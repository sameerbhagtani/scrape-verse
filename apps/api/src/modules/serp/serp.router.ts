import express from "express";
import serpController from "./serp.controller.js";

const router = express.Router();

// Search the web via SERP API
router.post("/search", serpController.searchWeb);

export default router;
