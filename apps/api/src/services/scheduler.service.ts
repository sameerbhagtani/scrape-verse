import Scraper from "../shared/models/scraper.model.js";
import scraperService from "./scraper.service.js";
import logger from "../shared/config/logger.config.js";

export class SchedulerService {
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Feature 17: Starts scheduling active scraper runs.
     */
    public async startScheduler(): Promise<void> {
        logger.info("Initializing Scraper Scheduler background worker...");

        try {
            // Find all scrapers with a defined cronExpression or simple scheduling metadata
            const scrapers = await Scraper.find({
                cronExpression: { $exists: true, $ne: "" },
                status: { $ne: "BROKEN" },
            });

            logger.info(`Found ${scrapers.length} active scheduled scrapers.`);

            for (const scraper of scrapers) {
                this.scheduleScraper(scraper._id.toString(), scraper.cronExpression);
            }
        } catch (err) {
            logger.error(`Failed to start scraper scheduler: ${(err as Error).message}`);
        }
    }

    /**
     * Schedules or reschedules a single scraper.
     */
    public scheduleScraper(scraperId: string, cronExpr: string): void {
        // Clear existing interval if set
        this.clearSchedule(scraperId);

        if (!cronExpr) return;

        // Parse simple interval durations (e.g. "hourly", "daily" or minutes like "5m", "30m", "1h")
        let intervalMs = 60 * 60 * 1000; // Default: 1 hour

        const minutesMatch = cronExpr.match(/^(\d+)m$/);
        const hoursMatch = cronExpr.match(/^(\d+)h$/);

        if (minutesMatch) {
            intervalMs = parseInt(minutesMatch[1]) * 60 * 1000;
        } else if (hoursMatch) {
            intervalMs = parseInt(hoursMatch[1]) * 60 * 60 * 1000;
        } else if (cronExpr === "daily") {
            intervalMs = 24 * 60 * 60 * 1000;
        } else if (cronExpr === "weekly") {
            intervalMs = 7 * 24 * 60 * 60 * 1000;
        }

        logger.info(`Scheduling Scraper ${scraperId} to execute every ${intervalMs / 1000}s`);

        const timer = setInterval(async () => {
            try {
                logger.info(`[Scheduled Execution] Triggering run for Scraper ID ${scraperId}...`);
                await scraperService.runScraperJob(scraperId);
            } catch (err) {
                logger.error(
                    `Scheduled run failed for Scraper ${scraperId}: ${(err as Error).message}`,
                );
            }
        }, intervalMs);

        this.intervals.set(scraperId, timer);
    }

    /**
     * Clears running schedule for a scraper.
     */
    public clearSchedule(scraperId: string): void {
        const timer = this.intervals.get(scraperId);
        if (timer) {
            clearInterval(timer);
            this.intervals.delete(scraperId);
        }
    }
}

export default new SchedulerService();
