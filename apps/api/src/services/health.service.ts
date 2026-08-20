import Scraper from "../shared/models/scraper.model.js";
import ScraperLog from "../shared/models/scraperLog.model.js";
import logger from "../shared/config/logger.config.js";

export class HealthService {
    /**
     * Feature 8: Evaluates and updates the scraper's health state and statistics.
     */
    public async evaluateHealth(
        scraperId: string,
        newRun: {
            successRate: number;
            qualityScore: number;
            durationMs: number;
            itemsCount: number;
            validCount: number;
        },
    ): Promise<string> {
        const scraper = await Scraper.findById(scraperId);
        if (!scraper) return "HEALTHY";

        // Increment run statistics
        const currentTotalRuns = scraper.totalRuns || 0;
        scraper.totalRuns = currentTotalRuns + 1;
        scraper.totalItemsScraped = (scraper.totalItemsScraped || 0) + newRun.itemsCount;

        // Calculate running average for response time and quality score
        scraper.averageResponseTime = Math.round(
            ((scraper.averageResponseTime || 0) * currentTotalRuns + newRun.durationMs) /
                scraper.totalRuns,
        );
        scraper.averageQualityScore = parseFloat(
            (
                ((scraper.averageQualityScore || 0) * currentTotalRuns + newRun.qualityScore) /
                scraper.totalRuns
            ).toFixed(4),
        );

        // Adjust consecutive failures and last successful runs
        if (newRun.successRate >= 0.7) {
            scraper.consecutiveFailures = 0;
            scraper.lastSuccessfulRun = new Date();
        } else {
            scraper.consecutiveFailures = (scraper.consecutiveFailures || 0) + 1;
        }

        // Determine health status state
        let healthState: "HEALTHY" | "WARNING" | "DEGRADED" | "BROKEN" | "HEALING" = "HEALTHY";

        if (scraper.status === "HEALING") {
            healthState = "HEALING";
        } else if (newRun.successRate < 0.5 || scraper.consecutiveFailures > 3) {
            healthState = "BROKEN";
        } else if (
            newRun.successRate < 0.7 ||
            scraper.consecutiveFailures >= 2 ||
            newRun.qualityScore < 0.7
        ) {
            healthState = "DEGRADED";
        } else if (newRun.successRate < 0.9 || newRun.qualityScore < 0.9) {
            healthState = "WARNING";
        }

        scraper.status = healthState;
        await scraper.save();

        logger.info(
            `Scraper health evaluated: ${scraper.name} is now ${healthState} (Consecutive Failures: ${scraper.consecutiveFailures})`,
        );
        return healthState;
    }

    /**
     * Feature 10: Compares current run success rates with previous logs to detect website changes.
     */
    public async detectWebsiteChanges(
        scraperId: string,
        currentFailureRates: Record<string, number>,
    ): Promise<{ changeDetected: boolean; changeReport?: any }> {
        // Fetch last 5 logs for this scraper to compute baseline
        const pastLogs = await ScraperLog.find({ scraperId }).sort({ timestamp: -1 }).limit(5);

        if (pastLogs.length < 2) {
            // Not enough baseline history to detect anomalies
            return { changeDetected: false };
        }

        const changes: Record<string, string> = {};
        let changeDetected = false;

        // Compare each field failure rate
        for (const [fieldName, failureRate] of Object.entries(currentFailureRates)) {
            // Find baseline field success from logs
            let logCount = 0;
            let sumSuccess = 0;

            for (const log of pastLogs) {
                // If it succeeded previously, the failure rate for this field should be low
                // Let's check historical details or calculate from successRate
                // If log is healthy, we assume fields succeeded.
                if (log.status === "healthy") {
                    sumSuccess += 1.0;
                    logCount++;
                } else if (log.status === "broken") {
                    sumSuccess += 0.0;
                    logCount++;
                }
            }

            const baselineSuccessRate = logCount > 0 ? sumSuccess / logCount : 0.9;
            const currentSuccessRate = 1.0 - failureRate;

            // If historical success was high (e.g. >80%) but current is low (e.g. <30%)
            if (baselineSuccessRate > 0.8 && currentSuccessRate < 0.3) {
                changeDetected = true;
                changes[fieldName] =
                    `Critical drop in extraction rate. Historical average: ${(baselineSuccessRate * 100).toFixed(1)}%, Current: ${(currentSuccessRate * 100).toFixed(1)}%. Selector probably changed.`;
            }
        }

        if (changeDetected) {
            logger.warn(
                `Website change detected for scraper ID ${scraperId}: ${JSON.stringify(changes)}`,
            );
            return {
                changeDetected: true,
                changeReport: {
                    timestamp: new Date(),
                    fieldsAffected: Object.keys(changes),
                    details: changes,
                },
            };
        }

        return { changeDetected: false };
    }
}

export default new HealthService();
