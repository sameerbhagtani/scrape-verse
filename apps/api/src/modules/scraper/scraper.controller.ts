import type { Request, Response } from "express";
import type {
    CreateScraperDto,
    RollbackScraperDto,
    ScraperPlanRequest,
    SchemaGeneratorRequest,
} from "@scrape-verse/types";
import Scraper from "../../shared/models/scraper.model.js";
import ScrapedData from "../../shared/models/scrapedData.model.js";
import ScraperLog from "../../shared/models/scraperLog.model.js";
import scraperService from "../../services/scraper.service.js";
import aiService from "../../services/ai.service.js";
import NotFound from "../../shared/errors/NotFound.error.js";
import Ok from "../../shared/responses/Ok.response.js";
import Created from "../../shared/responses/Created.response.js";

class ScraperController {
    /**
     * Create a new scraper configuration
     */
    public createScraper = async (req: Request, res: Response): Promise<void> => {
        const {
            name,
            collectorId,
            targetUrl,
            itemContainerSelector,
            fields,
            deduplicationStrategy,
            cronExpression,
            autoApproveThreshold,
            reviewThreshold,
            webhookUrl,
            enrichmentInstruction,
        } = req.body;

        const scraper = await Scraper.create({
            name,
            collectorId,
            targetUrl,
            itemContainerSelector: itemContainerSelector || "",
            fields,
            deduplicationStrategy: deduplicationStrategy || [],
            cronExpression: cronExpression || "",
            autoApproveThreshold: autoApproveThreshold !== undefined ? autoApproveThreshold : 0.9,
            reviewThreshold: reviewThreshold !== undefined ? reviewThreshold : 0.7,
            webhookUrl: webhookUrl || "",
            enrichmentInstruction: enrichmentInstruction || "",
        });

        Created(res, "Scraper configuration created successfully", scraper);
    };

    /**
     * Fetch a specific scraper configuration
     */
    public getScraper = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const scraper = await Scraper.findById(id);
        if (!scraper) {
            throw new NotFound(`Scraper with ID ${id} not found`);
        }

        Ok(res, "Scraper configuration retrieved successfully", scraper);
    };

    /**
     * Expose current selectors for a collector to pull dynamically (Scraper Studio integration)
     */
    public getSelectors = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const scraper = await Scraper.findOne({
            $or: [
                { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined },
                { collectorId: id },
            ].filter(Boolean),
        });

        if (!scraper) {
            throw new NotFound(`Scraper configuration not found`);
        }

        const selectorsMap: Record<string, string> = {};
        scraper.fields.forEach((f) => {
            selectorsMap[f.name] = f.selector;
        });

        Ok(res, "Active selectors retrieved successfully", {
            scraperId: scraper._id,
            collectorId: scraper.collectorId,
            currentVersion: scraper.currentVersion,
            itemContainerSelector: scraper.itemContainerSelector,
            selectors: selectorsMap,
        });
    };

    /**
     * Manually trigger a scraping job run
     */
    public runScrape = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const { htmlOverride } = req.body;
        const result = await scraperService.runScraperJob(id, htmlOverride);

        Ok(
            res,
            result.success
                ? "Scraping completed and verified successfully"
                : "Scraping completed but verification failed",
            {
                success: result.success,
                scrapedItemsCount: result.scrapedItems.length,
                log: result.log,
                scraper: {
                    id: result.scraper._id,
                    name: result.scraper.name,
                    status: result.scraper.status,
                    currentVersion: result.scraper.currentVersion,
                },
            },
        );
    };

    /**
     * Retrieve run execution and healing logs
     */
    public getLogs = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const scraper = await Scraper.findById(id);
        if (!scraper) {
            throw new NotFound(`Scraper with ID ${id} not found`);
        }

        const logs = await ScraperLog.find({ scraperId: id }).sort({ timestamp: -1 });
        Ok(res, "Scraper logs retrieved successfully", logs);
    };

    /**
     * Rollback a scraper configuration to a previous version
     */
    public rollbackScraper = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const { version } = req.body;
        const scraper = await Scraper.findById(id);
        if (!scraper) {
            throw new NotFound(`Scraper with ID ${id} not found`);
        }

        const historicalVersion = scraper.versionHistory.find((vh) => vh.version === version);
        if (!historicalVersion) {
            throw new NotFound(`Version ${version} not found in history`);
        }

        // Apply historical selectors
        scraper.fields.forEach((f) => {
            const historicalSelector = historicalVersion.selectors[f.name];
            if (historicalSelector) {
                f.selector = historicalSelector;
            }
        });

        // Update version and status
        scraper.currentVersion = version;
        scraper.status = "HEALTHY";
        await scraper.save();

        Ok(res, `Scraper rolled back successfully to version ${version}`, scraper);
    };

    /**
     * Feature 1 & 2: Plan scraper from natural language instruction
     */
    public planScraper = async (req: Request, res: Response): Promise<void> => {
        const { instruction } = req.body;
        if (!instruction) {
            throw new Error("Instruction is required to plan a scraper.");
        }

        const plan = await aiService.planScraper(instruction);
        Ok(res, "Scraper fields planned successfully using AI", plan);
    };

    /**
     * Feature 3: Automatically generate schema parameters for planned fields
     */
    public generateSchema = async (req: Request, res: Response): Promise<void> => {
        const { fields } = req.body;
        if (!fields || !Array.isArray(fields)) {
            throw new Error("Fields array is required to generate schema.");
        }

        const schema = await aiService.generateSchema(fields);
        Ok(res, "Extraction schema generated successfully using AI", schema);
    };

    /**
     * Feature 20: Expose scraper analytics and trends data
     */
    public getAnalytics = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const scraper = await Scraper.findById(id);
        if (!scraper) {
            throw new NotFound(`Scraper with ID ${id} not found`);
        }

        // Find last 20 logs to plot historical trends
        const logs = await ScraperLog.find({ scraperId: id }).sort({ timestamp: 1 }).limit(20);

        const qualityTrend = logs.map((l) => ({
            timestamp: l.timestamp,
            qualityScore: l.qualityScore,
            successRate: l.successRate,
        }));

        const totalHealAttempts = logs.reduce(
            (acc, l) => acc + (l.healingAttempts ? l.healingAttempts.length : 0),
            0,
        );
        const successfulHeals = logs.filter(
            (l) => l.healingAttempted && l.status !== "broken",
        ).length;

        Ok(res, "Scraper analytics retrieved successfully", {
            scraperId: scraper._id,
            name: scraper.name,
            status: scraper.status,
            totalRuns: scraper.totalRuns,
            totalItemsScraped: scraper.totalItemsScraped,
            averageQualityScore: scraper.averageQualityScore,
            averageResponseTime: scraper.averageResponseTime,
            healing: {
                totalAttempts: totalHealAttempts,
                successful: successfulHeals,
            },
            qualityTrend,
        });
    };

    /**
     * Feature 10: Retrieve list of detected website structure changes
     */
    public getChanges = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const logs = await ScraperLog.find({
            scraperId: id,
            changeReport: { $exists: true, $ne: null },
        })
            .sort({ timestamp: -1 })
            .select("timestamp changeReport versionUsed");

        const changes = logs.map((l) => ({
            timestamp: l.timestamp,
            versionUsed: l.versionUsed,
            report: l.changeReport,
        }));

        Ok(res, "Website changes log retrieved successfully", changes);
    };
}

export default ScraperController;
