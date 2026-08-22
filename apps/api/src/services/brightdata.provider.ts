import * as cheerio from "cheerio";
import { ProxyAgent } from "undici";
import { ScraperProvider } from "./provider.interface.js";
import env from "../shared/config/env.config.js";
import logger from "../shared/config/logger.config.js";

export class BrightDataProvider implements ScraperProvider {
    /**
     * Resolves the Bright Data proxy URL based on configured environment variables.
     */
    private getProxyUrl(): string | null {
        if (env.BRIGHT_DATA_PROXY_URL && env.BRIGHT_DATA_PROXY_URL.trim()) {
            return env.BRIGHT_DATA_PROXY_URL.trim();
        }

        if (env.BRIGHT_DATA_CUSTOMER_ID && env.BRIGHT_DATA_ZONE_PASSWORD) {
            const zone = env.BRIGHT_DATA_ZONE || "web_unlocker";
            const countrySuffix = env.BRIGHT_DATA_COUNTRY
                ? `-country-${env.BRIGHT_DATA_COUNTRY.toLowerCase()}`
                : "";
            const username = `brd-customer-${env.BRIGHT_DATA_CUSTOMER_ID}-zone-${zone}${countrySuffix}`;
            return `http://${username}:${env.BRIGHT_DATA_ZONE_PASSWORD}@brd.superproxy.io:33335`;
        }

        return null;
    }

    /**
     * Fetches the page content via Bright Data Web Unlocker Proxy, falling back to direct fetch.
     */
    public async fetchHtml(url: string): Promise<{ html: string; methodUsed: "proxy" | "direct" }> {
        const proxyUrl = this.getProxyUrl();

        const headers: Record<string, string> = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        };

        // Strategy 1: Route through Bright Data Web Unlocker Proxy
        if (proxyUrl) {
            try {
                logger.info(`[Bright Data] Routing fetch through Web Unlocker proxy for: ${url}`);
                const agent = new ProxyAgent(proxyUrl);

                const response = await fetch(url, {
                    // @ts-expect-error undici dispatcher option for node-fetch / node 18+
                    dispatcher: agent,
                    headers,
                    signal: AbortSignal.timeout(45000),
                });

                if (!response.ok) {
                    throw new Error(`Proxy HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                logger.info(
                    `[Bright Data] Successfully fetched ${html.length} bytes via Web Unlocker proxy`,
                );
                return { html, methodUsed: "proxy" };
            } catch (proxyError) {
                logger.warn(
                    `[Bright Data] Proxy request failed (${(proxyError as Error).message}). Falling back to direct browser fetch...`,
                );
            }
        }

        // Strategy 2: Direct browser-emulated fetch fallback
        logger.info(`[Direct Fetch] Fetching target URL directly: ${url}`);
        const response = await fetch(url, {
            headers,
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            throw new Error(`Direct Fetch Failed: HTTP ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        return { html, methodUsed: "direct" };
    }

    /**
     * Intelligently extracts values from an element based on field name and tag semantics.
     */
    private extractFieldValue(
        $: cheerio.CheerioAPI,
        el: cheerio.Cheerio<any>,
        fieldName: string,
    ): string {
        if (!el || el.length === 0) return "";

        const nameLower = fieldName.toLowerCase();
        const tag = (el.prop("tagName") || "").toLowerCase();

        // 1. Link / URL fields
        if (nameLower.includes("url") || nameLower.includes("link") || nameLower.includes("href")) {
            const href =
                el.attr("href") || el.attr("src") || el.attr("data-url") || el.attr("content");
            if (href) return href.trim();
        }

        // 2. Image fields
        if (
            nameLower.includes("image") ||
            nameLower.includes("img") ||
            nameLower.includes("photo") ||
            nameLower.includes("poster") ||
            nameLower.includes("thumbnail")
        ) {
            const src =
                el.attr("src") ||
                el.attr("data-src") ||
                el.attr("data-lazy-src") ||
                el.attr("srcset")?.split(" ")[0] ||
                el.attr("content");
            if (src) return src.trim();
        }

        // 3. Meta tag elements
        if (tag === "meta") {
            return el.attr("content") || el.attr("value") || "";
        }

        // 4. Time elements
        if (tag === "time") {
            return el.attr("datetime") || el.text().trim();
        }

        // 5. Input elements
        if (tag === "input" || tag === "textarea") {
            const val = el.val();
            const valStr = Array.isArray(val) ? val.join(", ") : val || "";
            return valStr || el.attr("placeholder") || "";
        }

        // 6. Title / Alt attribute fallback if text is empty
        const directText = el.text().trim();
        if (!directText) {
            const altOrTitle = el.attr("title") || el.attr("alt") || el.attr("aria-label");
            if (altOrTitle) return altOrTitle.trim();
        }

        return directText;
    }

    /**
     * Executes the scraper by fetching HTML (routing through Bright Data if credentials exist) and parsing values.
     */
    public async runScraper(
        url: string,
        selectors: Record<string, string>,
        containerSelector?: string,
    ): Promise<{ html: string; rawData: Record<string, string>[]; methodUsed?: string }> {
        const { html, methodUsed } = await this.fetchHtml(url);

        const $ = cheerio.load(html);
        const rawData: Record<string, string>[] = [];

        if (containerSelector && containerSelector.trim()) {
            const containers = $(containerSelector.trim());
            containers.each((_, el) => {
                const item: Record<string, string> = {};
                for (const [fieldName, selector] of Object.entries(selectors)) {
                    const element = $(el).find(selector);
                    item[fieldName] = this.extractFieldValue($, element, fieldName);
                }
                rawData.push(item);
            });
        } else {
            const item: Record<string, string> = {};
            for (const [fieldName, selector] of Object.entries(selectors)) {
                const element = $(selector);
                item[fieldName] = this.extractFieldValue($, element, fieldName);
            }
            rawData.push(item);
        }

        return { html, rawData, methodUsed };
    }
}

export default new BrightDataProvider();
