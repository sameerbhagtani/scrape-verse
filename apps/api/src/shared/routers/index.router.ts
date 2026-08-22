// Importing modules
import express from "express";
import healthRouter from "./health.router.js";
import authRouter from "../../modules/auth/auth.router.js";
import scraperRouter from "../../modules/scraper/scraper.router.js";
import serpRouter from "../../modules/serp/serp.router.js";

// making the router
const router = express.Router();

// mounting the public routers
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/scraper", scraperRouter);
router.use("/serp", serpRouter);

// exporting the router
export default router;
