import type { Request, Response } from "express";
import type { SerpSearchRequest } from "@scrape-verse/types";
import serpService from "../../services/serp.service.js";
import Ok from "../../shared/responses/Ok.response.js";
import BadRequest from "../../shared/errors/BadRequest.error.js";

class SerpController {
    /**
     * Search the web across Google, Bing, or DuckDuckGo via Bright Data SERP API.
     */
    public searchWeb = async (req: Request, res: Response): Promise<void> => {
        const { query, engine, num, country } = req.body as SerpSearchRequest;

        if (!query || typeof query !== "string" || !query.trim()) {
            throw new BadRequest("Search query is required.");
        }

        const results = await serpService.search(query, {
            engine,
            num: num ? Number(num) : 10,
            country,
        });

        Ok(res, "Web search completed successfully", results);
    };
}

export default new SerpController();
