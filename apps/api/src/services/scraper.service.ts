import * as cheerio from "cheerio";
import type { ScraperRunResult, ScraperStatus, SchemaField } from "@scrape-verse/types";
import Scraper from "../shared/models/scraper.model.js";
import ScrapedData from "../shared/models/scrapedData.model.js";
import ScraperLog from "../shared/models/scraperLog.model.js";
import brightdataProvider from "./brightdata.provider.js";
import validationService from "./validation.service.js";
import normalizationService from "./normalization.service.js";
import healthService from "./health.service.js";
import alertService from "./alert.service.js";
import aiService from "./ai.service.js";
import logger from "../shared/config/logger.config.js";

export class ScraperService {
    /**
     * Executes a scheduled or manually triggered scraper job.
     */
    public async runScraperJob(
        scraperId: string,
        htmlOverride?: string,
    ): Promise<{
        success: boolean;
        scrapedItems: any[];
        log: any;
        scraper: any;
    }> {
        const startTime = Date.now();

        // 1. Fetch Scraper Configuration
        const scraper = await Scraper.findById(scraperId);
        if (!scraper) {
            throw new Error(`Scraper with ID ${scraperId} not found`);
        }

        logger.info(`[Run Started] Scraper: ${scraper.name} (Version: ${scraper.currentVersion})`);

        // 2. Map selectors
        const selectorsMap: Record<string, string> = {};
        scraper.fields.forEach((f) => {
            selectorsMap[f.name] = f.selector;
        });

        let html = htmlOverride || "";
        let rawData: Record<string, string>[] = [];

        // 3. Fetch Website Content
        if (!htmlOverride) {
            try {
                logger.info(`[Fetch Page] Target URL: ${scraper.targetUrl}`);
                const result = await brightdataProvider.runScraper(
                    scraper.targetUrl,
                    selectorsMap,
                    scraper.itemContainerSelector,
                );
                html = result.html;
                rawData = result.rawData;
            } catch (err) {
                logger.error(
                    `[Fetch Failed] Scraper ID: ${scraperId}. Error: ${(err as Error).message}`,
                );

                // Log execution failure
                const log = await ScraperLog.create({
                    scraperId,
                    successRate: 0,
                    totalItems: 0,
                    validItems: 0,
                    status: "broken",
                    versionUsed: scraper.currentVersion,
                    durationMs: Date.now() - startTime,
                    qualityScore: 0,
                    healingAttempted: false,
                    healingDetails: { error: `Network fetch failed: ${(err as Error).message}` },
                });

                await healthService.evaluateHealth(scraperId, {
                    successRate: 0,
                    qualityScore: 0,
                    durationMs: Date.now() - startTime,
                    itemsCount: 0,
                    validCount: 0,
                });

                await alertService.triggerAlert(scraperId, "SCRAPER_FAILED", {
                    error: `Network fetch failed: ${(err as Error).message}`,
                    version: scraper.currentVersion,
                });

                return { success: false, scrapedItems: [], log, scraper };
            }
        } else {
            // Local parsing of mock HTML override (for tests/analysis)
            const $ = cheerio.load(html);
            if (scraper.itemContainerSelector) {
                $(scraper.itemContainerSelector).each((_, el) => {
                    const item: Record<string, string> = {};
                    for (const [name, sel] of Object.entries(selectorsMap)) {
                        const element = $(el).find(sel);
                        if (
                            name.toLowerCase().includes("url") ||
                            name.toLowerCase().includes("link")
                        ) {
                            item[name] = element.attr("href") || element.text().trim();
                        } else {
                            item[name] = element.text().trim();
                        }
                    }
                    rawData.push(item);
                });
            } else {
                const item: Record<string, string> = {};
                for (const [name, sel] of Object.entries(selectorsMap)) {
                    const element = $(sel);
                    if (name.toLowerCase().includes("url") || name.toLowerCase().includes("link")) {
                        item[name] = element.attr("href") || element.text().trim();
                    } else {
                        item[name] = element.text().trim();
                    }
                }
                rawData.push(item);
            }
        }

        // 4. Data Normalization / Cleaning
        logger.info(`[Normalization] Cleaning ${rawData.length} records...`);
        const normalizedData = rawData.map((record) =>
            normalizationService.normalizeRecord(
                record,
                scraper.fields as any as SchemaField[],
                scraper.targetUrl,
            ),
        );

        // 5. Duplicate Detection
        const dedupResult = validationService.deduplicateRecords(
            normalizedData,
            scraper.deduplicationStrategy,
        );
        const uniqueData = dedupResult.uniqueRecords;
        const duplicatesCount = dedupResult.duplicatesCount;

        // 6. Data Validation
        let validCount = 0;
        const recordValidations = uniqueData.map((record) => {
            const valRes = validationService.validateRecord(record, scraper.fields as any[]);
            if (valRes.isValid) validCount++;
            return valRes;
        });

        // 7. Calculate Data Quality Score
        const qualityResult = validationService.calculateQualityScore(
            uniqueData,
            scraper.fields as any[],
            duplicatesCount,
        );

        // Calculate success rate based on validity of expected vs processed records
        const successRate = uniqueData.length > 0 ? validCount / uniqueData.length : 0;
        const durationMs = Date.now() - startTime;

        logger.info(
            `[Validation Complete] Quality Score: ${(qualityResult.qualityScore * 100).toFixed(1)}%, Success Rate: ${(successRate * 100).toFixed(1)}%`,
        );

        // Check if there was a previous successful run to perform ROLLBACK check
        // Feature 15: Automatic Rollback
        if (scraper.versionHistory && scraper.versionHistory.length > 0) {
            const lastLog = await ScraperLog.findOne({ scraperId }).sort({ timestamp: -1 });
            if (lastLog && lastLog.qualityScore > 0.8 && qualityResult.qualityScore < 0.5) {
                const prevVer = scraper.versionHistory[scraper.versionHistory.length - 1];

                if (scraper.currentVersion !== prevVer.version) {
                    logger.warn(
                        `[Rollback Triggered] Current quality (${qualityResult.qualityScore}) dropped significantly compared to baseline (${lastLog.qualityScore}). Rolling back version...`,
                    );

                    // Rollback to last known good version
                    scraper.fields.forEach((f) => {
                        const selector = prevVer.selectors[f.name];
                        if (selector) f.selector = selector;
                    });
                    scraper.currentVersion = prevVer.version;
                    scraper.status = "WARNING";
                    await scraper.save();

                    await alertService.triggerAlert(scraperId, "WEBSITE_CHANGED", {
                        message:
                            "Auto-healed configuration performed worse than prior baseline. Rollback initiated.",
                        rolledBackTo: prevVer.version,
                        previousQuality: lastLog.qualityScore,
                        currentQuality: qualityResult.qualityScore,
                    });

                    // Re-run scrape job with rolled back selectors
                    return this.runScraperJob(scraperId, htmlOverride);
                }
            }
        }

        // 8. Anomaly-based Website Change Detection
        const fieldFailures = scraper.fields.reduce(
            (acc, f) => {
                const failedMatches = recordValidations.filter(
                    (v) => v.failures[f.name] !== undefined,
                ).length;
                acc[f.name] = uniqueData.length > 0 ? failedMatches / uniqueData.length : 1.0;
                return acc;
            },
            {} as Record<string, number>,
        );

        const changeResult = await healthService.detectWebsiteChanges(scraperId, fieldFailures);
        if (changeResult.changeDetected) {
            await alertService.triggerAlert(
                scraperId,
                "WEBSITE_CHANGED",
                changeResult.changeReport,
            );
        }

        // Setup variables for healing checks
        let healingAttempted = false;
        let failedFields: string[] = [];
        const healingAttempts: any[] = [];
        let finalItems = uniqueData;
        let finalQualityResult = qualityResult;
        let finalSuccessRate = successRate;
        let finalValidCount = validCount;

        const autoApproveThreshold = scraper.autoApproveThreshold || 0.9;
        const reviewThreshold = scraper.reviewThreshold || 0.7;

        // 9. Failure Detection & Healing Engine Trigger
        // Scraper is considered failing if quality score is below review threshold or successRate < 70%
        if (finalQualityResult.qualityScore < reviewThreshold || finalSuccessRate < 0.7) {
            healingAttempted = true;
            logger.warn(
                `[Scraper Failing] Triggering Self-Healing Engine. Quality: ${finalQualityResult.qualityScore}`,
            );

            // Identify failed fields (failure rate > 30% or completely missing)
            failedFields = scraper.fields
                .filter((f) => {
                    const failedMatches = recordValidations.filter(
                        (v) => v.failures[f.name] !== undefined,
                    ).length;
                    const failRate =
                        uniqueData.length > 0 ? failedMatches / uniqueData.length : 1.0;
                    return failRate > 0.3;
                })
                .map((f) => f.name);

            logger.info(`Failed fields targeted: ${failedFields.join(", ")}`);

            const selectorsUpdate = { ...selectorsMap };
            let allFieldsHealed = true;

            for (const fieldName of failedFields) {
                const fieldConfig = scraper.fields.find((f) => f.name === fieldName)!;
                let fieldHealed = false;

                // Feature 12: Multi-Strategy Healing Attempts in Priority Order
                const strategies = [
                    // Attempt 1: DOM analysis heuristics
                    {
                        name: "DOM Heuristics",
                        execute: async () =>
                            this.heuristicallyFindCandidates(
                                html,
                                fieldName,
                                fieldConfig.validationRules,
                                scraper.itemContainerSelector,
                            ),
                    },
                    // Attempt 2: AI selector repair DOM analysis via LangChain Mistral
                    {
                        name: "Mistral DOM Analyzer",
                        execute: async () => {
                            const snippet = scraper.itemContainerSelector
                                ? cheerio
                                      .load(html)(scraper.itemContainerSelector)
                                      .first()
                                      .html() || ""
                                : html.slice(0, 10000);
                            return aiService.analyzeDOM(
                                snippet,
                                fieldName,
                                fieldConfig.selector,
                                fieldConfig.validationRules,
                            );
                        },
                    },
                ];

                for (const strat of strategies) {
                    try {
                        logger.info(`[Healing Strategy] Trying ${strat.name} for ${fieldName}...`);
                        const candidates = await strat.execute();
                        logger.info(`[Healing Candidates] Found ${candidates.length} candidates.`);

                        let bestSelector: string | null = null;
                        let bestScore = -1;

                        for (const candidate of candidates) {
                            // Test candidate
                            const testSelectors = { ...selectorsMap, [fieldName]: candidate };
                            const testItems = this.scrapeLocalHtml(
                                html,
                                scraper.itemContainerSelector,
                                testSelectors,
                            );
                            const testNormalized = testItems.map((item) =>
                                normalizationService.normalizeRecord(
                                    item,
                                    scraper.fields as any as SchemaField[],
                                    scraper.targetUrl,
                                ),
                            );
                            const testVal = testNormalized.map((item) =>
                                validationService.validateRecord(item, scraper.fields as any[]),
                            );

                            const valScore = validationService.calculateQualityScore(
                                testNormalized,
                                scraper.fields as any[],
                                0,
                            );

                            // Calculate specific field validation success rate
                            const fieldFails = testVal.filter(
                                (v) => v.failures[fieldName] !== undefined,
                            ).length;
                            const fieldPassRate =
                                testNormalized.length > 0
                                    ? 1.0 - fieldFails / testNormalized.length
                                    : 0;

                            if (fieldPassRate > bestScore && fieldPassRate >= 0.9) {
                                bestScore = fieldPassRate;
                                bestSelector = candidate;
                            }
                        }

                        if (bestSelector) {
                            logger.info(
                                `[Healing Approved] Approved selector "${bestSelector}" via ${strat.name} (Score: ${bestScore})`,
                            );
                            selectorsUpdate[fieldName] = bestSelector;
                            fieldHealed = true;

                            healingAttempts.push({
                                strategy: strat.name,
                                candidate: bestSelector,
                                validationScore: bestScore,
                                confidence: parseFloat(bestScore.toFixed(2)),
                                status: "success",
                                timestamp: new Date(),
                            });
                            break; // Stop trying strategies for this field
                        } else {
                            healingAttempts.push({
                                strategy: strat.name,
                                candidate: "None met validation threshold",
                                validationScore: 0,
                                confidence: 0,
                                status: "failed",
                                timestamp: new Date(),
                            });
                        }
                    } catch (err) {
                        logger.error(
                            `Strategy ${strat.name} failed with error: ${(err as Error).message}`,
                        );
                    }
                }

                if (!fieldHealed) {
                    allFieldsHealed = false;
                }
            }

            // 10. Healing Validation & Versioning
            if (allFieldsHealed) {
                // Perform healing validation re-scrape
                const healedItems = this.scrapeLocalHtml(
                    html,
                    scraper.itemContainerSelector,
                    selectorsUpdate,
                );
                const healedNormalized = healedItems.map((item) =>
                    normalizationService.normalizeRecord(
                        item,
                        scraper.fields as any as SchemaField[],
                        scraper.targetUrl,
                    ),
                );
                const healedDedup = validationService.deduplicateRecords(
                    healedNormalized,
                    scraper.deduplicationStrategy,
                );
                const healedVal = healedDedup.uniqueRecords.map((item) =>
                    validationService.validateRecord(item, scraper.fields as any[]),
                );

                const healedQuality = validationService.calculateQualityScore(
                    healedDedup.uniqueRecords,
                    scraper.fields as any[],
                    healedDedup.duplicatesCount,
                );
                const healedSuccess =
                    healedDedup.uniqueRecords.length > 0
                        ? healedVal.filter((v) => v.isValid).length /
                          healedDedup.uniqueRecords.length
                        : 0;

                // Feature 16: Human Approval Confidence Checks
                if (healedQuality.qualityScore >= autoApproveThreshold) {
                    logger.info(
                        `[Healing Approved] Quality: ${healedQuality.qualityScore}. Auto deploying fix...`,
                    );

                    const currentVerNumber =
                        parseInt(scraper.currentVersion.replace(/[^\d]/g, "")) || 1;
                    const nextVer = `v${currentVerNumber + 1}`;

                    // Push to history
                    const currentSelectorsMap: Record<string, string> = {};
                    scraper.fields.forEach((f) => {
                        currentSelectorsMap[f.name] = f.selector;
                    });

                    scraper.versionHistory.push({
                        version: scraper.currentVersion,
                        selectors: currentSelectorsMap as any,
                        reason: `Auto-healed failed fields: ${failedFields.join(", ")}`,
                        qualityScore: finalQualityResult.qualityScore,
                        createdAt: new Date(),
                    });

                    // Update scraper selectors & currentVersion
                    scraper.fields.forEach((f) => {
                        if (selectorsUpdate[f.name]) {
                            f.selector = selectorsUpdate[f.name];
                        }
                    });
                    scraper.currentVersion = nextVer;
                    scraper.status = "HEALTHY";
                    await scraper.save();

                    // Update metrics variables for the return payload
                    finalItems = healedDedup.uniqueRecords;
                    finalQualityResult = healedQuality;
                    finalSuccessRate = healedSuccess;
                    finalValidCount = healedVal.filter((v) => v.isValid).length;

                    await alertService.triggerAlert(scraperId, "SCRAPER_HEALED", {
                        fieldsHealed: failedFields,
                        newVersion: nextVer,
                        newQuality: healedQuality.qualityScore,
                    });
                } else if (healedQuality.qualityScore >= reviewThreshold) {
                    logger.warn(
                        `[Review Required] Healed quality score ${healedQuality.qualityScore} is below auto-approve limit. Flagging for manual review.`,
                    );
                    scraper.status = "WARNING";
                    await scraper.save();
                } else {
                    logger.error(
                        `[Healing Rejected] Proposed fix quality (${healedQuality.qualityScore}) below review threshold.`,
                    );
                    scraper.status = "BROKEN";
                    await scraper.save();
                }
            } else {
                scraper.status = "BROKEN";
                await scraper.save();
                await alertService.triggerAlert(scraperId, "SCRAPER_FAILED", {
                    error: "Self-healing failed to find suitable selectors for all fields.",
                    failedFields,
                });
            }
        }

        // 11. Optional Data Enrichment (Feature 23)
        let enrichedItems = finalItems;
        if (
            scraper.enrichmentInstruction &&
            finalItems.length > 0 &&
            finalQualityResult.qualityScore >= reviewThreshold
        ) {
            logger.info("[Enrichment] Performing AI Data Enrichment...");
            try {
                // Enrich only top 5 items in a run to conserve costs/time
                const enriched = await Promise.all(
                    finalItems
                        .slice(0, 5)
                        .map((item) => aiService.enrichData(item, scraper.enrichmentInstruction)),
                );
                enrichedItems = [...enriched, ...finalItems.slice(5)];
            } catch (err) {
                logger.error(`Data enrichment failed: ${(err as Error).message}`);
            }
        }

        // 12. Save Data to Database
        if (enrichedItems.length > 0 && scraper.status !== "BROKEN") {
            const dataToInsert = enrichedItems.map((item) => ({
                scraperId,
                versionUsed: scraper.currentVersion,
                data: item,
                scrapedAt: new Date(),
            }));
            await ScrapedData.insertMany(dataToInsert);
        }

        // 13. Create Run Execution Log
        const logStatus =
            finalQualityResult.qualityScore >= 0.9
                ? "healthy"
                : finalQualityResult.qualityScore >= 0.7
                  ? "warning"
                  : "broken";
        const log = await ScraperLog.create({
            scraperId,
            successRate: finalSuccessRate,
            totalItems: enrichedItems.length,
            validItems: finalValidCount,
            status: logStatus,
            versionUsed: scraper.currentVersion,
            durationMs,
            pagesScraped: 1,
            qualityScore: finalQualityResult.qualityScore,
            qualityMetrics: {
                completeness: finalQualityResult.metrics.completeness,
                validity: finalQualityResult.metrics.validity,
                duplicates: finalQualityResult.metrics.duplicates,
                schemaMatch: finalQualityResult.metrics.schemaMatch,
            },
            healingAttempted,
            healingAttempts,
            healingDetails: healingAttempted ? { failedFields } : null,
        });

        // 14. Update Scraper Health State in DB
        await healthService.evaluateHealth(scraperId, {
            successRate: finalSuccessRate,
            qualityScore: finalQualityResult.qualityScore,
            durationMs,
            itemsCount: enrichedItems.length,
            validCount: finalValidCount,
        });

        return {
            success: logStatus !== "broken",
            scrapedItems: enrichedItems,
            log,
            scraper,
        };
    }

    /**
     * Local scraping parser utility.
     */
    private scrapeLocalHtml(
        html: string,
        containerSelector: string,
        selectors: Record<string, string>,
    ): any[] {
        const $ = cheerio.load(html);
        const results: any[] = [];

        if (containerSelector) {
            const containers = $(containerSelector);
            containers.each((_, el) => {
                const item: Record<string, string> = {};
                for (const [name, sel] of Object.entries(selectors)) {
                    const element = $(el).find(sel);
                    if (name.toLowerCase().includes("url") || name.toLowerCase().includes("link")) {
                        item[name] = element.attr("href") || element.text().trim();
                    } else {
                        item[name] = element.text().trim();
                    }
                }
                results.push(item);
            });
        } else {
            const item: Record<string, string> = {};
            for (const [name, sel] of Object.entries(selectors)) {
                const element = $(sel);
                if (name.toLowerCase().includes("url") || name.toLowerCase().includes("link")) {
                    item[name] = element.attr("href") || element.text().trim();
                } else {
                    item[name] = element.text().trim();
                }
            }
            results.push(item);
        }

        return results;
    }

    /**
     * DOM Analysis Heuristics
     */
    private heuristicallyFindCandidates(
        html: string,
        fieldName: string,
        validationRules: any[],
        containerSelector: string,
    ): string[] {
        const $ = cheerio.load(html);
        const candidates: string[] = [];

        const target = containerSelector ? $(containerSelector).first() : $("body");
        if (target.length === 0) return [];

        const self = this;
        target.find("*").each((_, el) => {
            let val = "";
            if (
                fieldName.toLowerCase().includes("url") ||
                fieldName.toLowerCase().includes("link")
            ) {
                val = $(el).attr("href") || $(el).text().trim();
            } else {
                val = $(el).text().trim();
            }

            if (val && self.validateHeuristic(val, validationRules)) {
                const tags = [el.name || el.tagName || ""];
                const classAttr = $(el).attr("class");

                if (classAttr) {
                    const classes = classAttr.split(/\s+/).filter(Boolean);
                    for (const cls of classes) {
                        candidates.push(`.${cls}`);
                        candidates.push(`${tags[0]}.${cls}`);
                    }
                }

                const attribs = el.attribs || {};
                for (const key of Object.keys(attribs)) {
                    if (key.includes("test") || key.includes("id") || key.startsWith("data-")) {
                        candidates.push(`[${key}="${attribs[key]}"]`);
                    }
                }

                if (!["div", "span", "p"].includes(tags[0])) {
                    candidates.push(tags[0]);
                }
            }
        });

        // Hardcoded typical heuristics for e-commerce field names
        if (fieldName.toLowerCase().includes("price")) {
            candidates.push(
                ".price",
                ".current-price",
                ".price-value",
                "span.price",
                "[data-testid='price']",
            );
        }
        if (fieldName.toLowerCase().includes("name") || fieldName.toLowerCase().includes("title")) {
            candidates.push(".product-title", ".product-name", "h1", "h2", "h3", ".title", ".name");
        }
        if (fieldName.toLowerCase().includes("rating")) {
            candidates.push(".rating", ".stars", ".product-rating", ".rating-stars");
        }

        return Array.from(new Set(candidates)).filter(Boolean);
    }

    private validateHeuristic(value: string, rules: any[]): boolean {
        if (!rules || rules.length === 0) return true;
        for (const rule of rules) {
            if (rule.type === "notEmpty") {
                if (!value || value.trim() === "") return false;
            }
            if (rule.type === "containsNumber") {
                if (!/\d/.test(value)) return false;
            }
            if (rule.type === "numberRange") {
                const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
                if (isNaN(num)) return false;
                if (rule.min !== undefined && num < rule.min) return false;
                if (rule.max !== undefined && num > rule.max) return false;
            }
            if (rule.type === "isValidUrl") {
                const urlPattern = /^(https?:\/\/|\/)[^\s/$.?#].[^\s]*$/i;
                if (!urlPattern.test(value)) return false;
            }
        }
        return true;
    }
}

export default new ScraperService();
