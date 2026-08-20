import express from "express";
import ScraperController from "./scraper.controller.js";

const router = express.Router();
const scraperController = new ScraperController();

// Create new scraper config
router.post("/", scraperController.createScraper);

// Feature 1 & 2: Plan fields from natural language description
router.post("/plan", scraperController.planScraper);

// Feature 3: Automatically generate schema parameters for fields
router.post("/schema", scraperController.generateSchema);

// Get scraper config
router.get("/:id", scraperController.getScraper);

// Expose active selectors (supports mongo ID or collectorId for Scraper Studio callback/fetch)
router.get("/:id/selectors", scraperController.getSelectors);

// Trigger run
router.post("/:id/run", scraperController.runScrape);

// Get run logs
router.get("/:id/logs", scraperController.getLogs);

// Feature 20: Retrieve analytics trends data
router.get("/:id/analytics", scraperController.getAnalytics);

// Feature 10: Retrieve website structure changes
router.get("/:id/changes", scraperController.getChanges);

// Rollback to version
router.post("/:id/rollback", scraperController.rollbackScraper);

export default router;
