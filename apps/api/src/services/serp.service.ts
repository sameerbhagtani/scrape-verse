import * as cheerio from "cheerio";
import { ProxyAgent } from "undici";
import { SerpResultItem, SerpSearchResponse } from "@scrape-verse/types";
import env from "../shared/config/env.config.js";
import logger from "../shared/config/logger.config.js";

export class SerpService {
    /**
     * Executes a web search query via Bright Data SERP API with direct search fallback.
     */
    public async search(
        query: string,
        options: {
            engine?: "google" | "bing" | "duckduckgo";
            num?: number;
            country?: string;
        } = {},
    ): Promise<SerpSearchResponse> {
        const engine = options.engine || "google";
        const num = options.num || 10;
        const country = options.country || "en";
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            return {
                query: "",
                engine,
                results: [],
                totalResults: 0,
                source: "direct_search",
            };
        }

        // Strategy 1: Bright Data SERP HTTP API (with API Key & Credits)
        if (env.BRIGHT_DATA_API_KEY && env.BRIGHT_DATA_API_KEY.trim()) {
            try {
                const zone = env.BRIGHT_DATA_SERP_ZONE || "serp";
                const targetSearchUrl =
                    engine === "bing"
                        ? `https://www.bing.com/search?q=${encodeURIComponent(trimmedQuery)}&count=${num}`
                        : `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}&num=${num}&hl=${country}`;

                logger.info(
                    `[SERP API] Querying Bright Data SERP API (zone: ${zone}, engine: ${engine}) for "${trimmedQuery}"`,
                );

                const response = await fetch("https://api.brightdata.com/request", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${env.BRIGHT_DATA_API_KEY.trim()}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        zone,
                        url: targetSearchUrl,
                        format: "json",
                    }),
                    signal: AbortSignal.timeout(45000),
                });

                if (response.ok) {
                    const data = await response.json().catch(() => null);
                    const results = this.parseBrightDataSerpJson(data);

                    if (results.length > 0) {
                        logger.info(
                            `[SERP API] Extracted ${results.length} organic results via Bright Data SERP API`,
                        );
                        return {
                            query: trimmedQuery,
                            engine,
                            results,
                            totalResults: results.length,
                            source: "brightdata_serp_api",
                        };
                    }
                } else {
                    const errText = await response.text().catch(() => "");
                    logger.warn(
                        `[SERP API] Bright Data SERP API returned ${response.status}: ${errText || response.statusText}. Falling back...`,
                    );
                }
            } catch (err) {
                logger.warn(`[SERP API] Bright Data API request failed: ${(err as Error).message}`);
            }
        }

        // Strategy 2: Bright Data Proxy Tunnel with &lum_json=1 (if credentials exist)
        if (env.BRIGHT_DATA_CUSTOMER_ID && env.BRIGHT_DATA_ZONE_PASSWORD) {
            try {
                const zone = env.BRIGHT_DATA_SERP_ZONE || "serp";
                const username = `brd-customer-${env.BRIGHT_DATA_CUSTOMER_ID}-zone-${zone}`;
                const proxyUrl = `http://${username}:${env.BRIGHT_DATA_ZONE_PASSWORD}@brd.superproxy.io:33335`;
                const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}&num=${num}&hl=${country}&lum_json=1`;

                logger.info(
                    `[SERP Proxy] Routing search through Bright Data proxy for "${trimmedQuery}"`,
                );
                const agent = new ProxyAgent(proxyUrl);

                const response = await fetch(targetUrl, {
                    // @ts-expect-error undici dispatcher option
                    dispatcher: agent,
                    signal: AbortSignal.timeout(45000),
                });

                if (response.ok) {
                    const data = await response.json().catch(() => null);
                    const results = this.parseBrightDataSerpJson(data);

                    if (results.length > 0) {
                        return {
                            query: trimmedQuery,
                            engine,
                            results,
                            totalResults: results.length,
                            source: "brightdata_serp_proxy",
                        };
                    }
                }
            } catch (err) {
                logger.warn(`[SERP Proxy] Proxy search failed: ${(err as Error).message}`);
            }
        }

        // Strategy 3: Direct DuckDuckGo HTML Search Fallback
        logger.info(`[Direct SERP] Fallback search via DuckDuckGo for "${trimmedQuery}"`);
        try {
            const fallbackResults = await this.searchDuckDuckGoDirect(trimmedQuery, num);
            return {
                query: trimmedQuery,
                engine: "duckduckgo",
                results: fallbackResults,
                totalResults: fallbackResults.length,
                source: "direct_search",
            };
        } catch (err) {
            logger.error(`[Direct SERP] Search fallback failed: ${(err as Error).message}`);
            return {
                query: trimmedQuery,
                engine,
                results: [],
                totalResults: 0,
                source: "direct_search",
            };
        }
    }

    /**
     * Normalizes Bright Data SERP JSON format into SerpResultItem[].
     */
    private parseBrightDataSerpJson(data: any): SerpResultItem[] {
        if (!data) return [];

        const results: SerpResultItem[] = [];

        // 1. Organic array from Google / Bright Data SERP response
        const items =
            data.organic || data.general?.results || data.results || data.organic_results || [];

        if (Array.isArray(items)) {
            items.forEach((item: any, index: number) => {
                const title = item.title || item.name || item.heading || "";
                const url = item.link || item.url || item.display_url || "";
                const description = item.snippet || item.description || item.body || "";

                if (title && url) {
                    results.push({
                        title: title.trim(),
                        url: url.trim(),
                        description: description.trim(),
                        position: item.rank || item.position || index + 1,
                    });
                }
            });
        }

        return results;
    }

    /**
     * Direct DuckDuckGo HTML parser for instant zero-dependency search fallback.
     */
    private async searchDuckDuckGoDirect(query: string, limit: number): Promise<SerpResultItem[]> {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        };

        const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!response.ok) {
            throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const results: SerpResultItem[] = [];

        $(".result").each((index, el) => {
            if (results.length >= limit) return false;

            const titleEl = $(el).find(".result__title a");
            const title = titleEl.text().trim();
            let rawLink = titleEl.attr("href") || "";

            // Unwrap DuckDuckGo redirect link /uddg?uddg=https%3A%2F%2F...
            if (rawLink.includes("uddg=")) {
                try {
                    const match = rawLink.match(/uddg=([^&]+)/);
                    if (match && match[1]) {
                        rawLink = decodeURIComponent(match[1]);
                    }
                } catch {}
            }

            const snippet = $(el).find(".result__snippet").text().trim();

            if (title && rawLink && !rawLink.includes("duckduckgo.com")) {
                results.push({
                    title,
                    url: rawLink,
                    description: snippet,
                    position: index + 1,
                });
            }
        });

        return results;
    }
}

export default new SerpService();
