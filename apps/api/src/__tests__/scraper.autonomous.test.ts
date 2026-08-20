import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Scraper from "../shared/models/scraper.model.js";
import ScrapedData from "../shared/models/scrapedData.model.js";
import ScraperLog from "../shared/models/scraperLog.model.js";
import validationService from "../services/validation.service.js";
import normalizationService from "../services/normalization.service.js";
import healthService from "../services/health.service.js";
import scraperService from "../services/scraper.service.js";

// Generic Mongoose Chain Mock Utility
function createMockMongooseChain(resolveValue: any = []) {
    const chain: any = {
        then: (cb: any) => Promise.resolve(resolveValue).then(cb),
        catch: (cb: any) => Promise.resolve(resolveValue).catch(cb),
        sort: jest.fn().mockImplementation(() => chain),
        limit: jest.fn().mockImplementation(() => chain),
        select: jest.fn().mockImplementation(() => chain),
        exec: jest.fn().mockResolvedValue(resolveValue),
    };
    return chain;
}

// Healthy mock HTML
const healthyHtml = `
  <html>
    <body>
      <div class="item">
        <h1 class="title">Product A</h1>
        <span class="price">INR 1,299</span>
        <a class="link" href="/prod-a">Link</a>
      </div>
      <div class="item">
        <h1 class="title">Product B</h1>
        <span class="price">INR 3,499</span>
        <a class="link" href="/prod-b">Link</a>
      </div>
    </body>
  </html>
`;

// Broken mock HTML where price class is renamed to "sale-price" and link to "item-url"
const brokenHtml = `
  <html>
    <body>
      <div class="item">
        <h1 class="title">Product A</h1>
        <span class="sale-price">INR 1,299</span>
        <a class="item-url" href="/prod-a">Link</a>
      </div>
      <div class="item">
        <h1 class="title">Product B</h1>
        <span class="sale-price">INR 3,499</span>
        <a class="item-url" href="/prod-b">Link</a>
      </div>
    </body>
  </html>
`;

describe("Autonomous Web Scraper Features", () => {
    describe("Feature 6 & 7: Normalization & Deduplication", () => {
        it("should normalize raw texts correctly", () => {
            const trimmed = normalizationService.normalizeValue(
                "   some text <p>html</p>  ",
                "trim",
            );
            expect(trimmed).toBe("some text html");

            const stripped = normalizationService.normalizeValue("₹1,299.50 INR", "stripCurrency");
            expect(stripped).toBe("1299.50");

            const parsed = normalizationService.normalizeValue("Age: 25 years old", "parseNumber");
            expect(parsed).toBe("25");

            const url = normalizationService.normalizeValue(
                "/relative-link",
                "resolveUrl",
                "https://site.com/subpage",
            );
            expect(url).toBe("https://site.com/relative-link");
        });

        it("should filter out duplicate records based on unique strategy", () => {
            const raw = [
                { id: "1", name: "Alpha", url: "http://test.com/a" },
                { id: "2", name: "Beta", url: "http://test.com/b" },
                { id: "3", name: "Alpha Duplicate", url: "http://test.com/a" }, // Duplicate URL
            ];

            const { uniqueRecords, duplicatesCount } = validationService.deduplicateRecords(raw, [
                "url",
            ]);
            expect(uniqueRecords).toHaveLength(2);
            expect(duplicatesCount).toBe(1);
            expect(uniqueRecords[0].name).toBe("Alpha");
        });
    });

    describe("Feature 5: Deterministic Data Quality Score", () => {
        it("should calculate quality scores correctly based on completeness and validity metrics", () => {
            const fields = [
                {
                    name: "title",
                    type: "string" as const,
                    required: true,
                    validationRules: [{ type: "notEmpty" as const }],
                },
                {
                    name: "price",
                    type: "number" as const,
                    required: true,
                    validationRules: [{ type: "containsNumber" as const }],
                },
            ];

            const records = [
                { title: "Product A", price: "99.99" }, // 100% valid, 100% complete
                { title: "Product B", price: "" }, // Missing required price (incomplete/invalid)
            ];

            const quality = validationService.calculateQualityScore(records, fields, 0);

            // Completeness: (2 filled + 1 filled) / 4 = 75%
            expect(quality.metrics.completeness).toBe(0.75);
            // Validity: Product A (2 valid fields), Product B (1 valid title, 1 invalid price) = 3 / 4 = 75%
            expect(quality.metrics.validity).toBe(0.75);
            // Duplicates: 0 duplicates = 100%
            expect(quality.metrics.duplicates).toBe(1);

            // Total: 0.75 * 0.4 + 0.75 * 0.4 + 1.0 * 0.1 + 1.0 * 0.1 = 0.3 + 0.3 + 0.1 + 0.1 = 0.80
            expect(quality.qualityScore).toBe(0.8);
        });
    });

    describe("Full Auto-Healing & Rollback Integration", () => {
        let mockScraper: any;
        let findByIdSpy: jest.SpyInstance;
        let findOneSpy: jest.SpyInstance;
        let insertManySpy: jest.SpyInstance;
        let logCreateSpy: jest.SpyInstance;
        let logFindSpy: jest.SpyInstance;

        beforeEach(() => {
            jest.clearAllMocks();

            mockScraper = {
                _id: new mongoose.Types.ObjectId(),
                name: "Autonomous Scraper",
                collectorId: "col_autonomous_456",
                targetUrl: "https://shop.com/all",
                itemContainerSelector: ".item",
                currentVersion: "v1",
                status: "HEALTHY",
                fields: [
                    {
                        name: "title",
                        type: "string",
                        selector: ".title",
                        required: true,
                        validationRules: [{ type: "notEmpty" }],
                        normalizationRules: [{ type: "trim" }],
                        description: "Item name title",
                    },
                    {
                        name: "price",
                        type: "string",
                        selector: ".price",
                        required: true,
                        validationRules: [{ type: "notEmpty" }, { type: "containsNumber" }],
                        normalizationRules: [{ type: "stripCurrency" }, { type: "trim" }],
                        description: "Item price value",
                    },
                    {
                        name: "url",
                        type: "url",
                        selector: ".link",
                        required: true,
                        validationRules: [{ type: "notEmpty" }, { type: "isValidUrl" }],
                        normalizationRules: [{ type: "resolveUrl" }],
                        description: "Product details url",
                    },
                ],
                versionHistory: [] as any[],
                deduplicationStrategy: ["url"],
                save: jest.fn().mockImplementation(function (this: any) {
                    return Promise.resolve(this);
                }),
            };

            findByIdSpy = jest.spyOn(Scraper, "findById").mockResolvedValue(mockScraper as any);
            findOneSpy = jest.spyOn(Scraper, "findOne").mockResolvedValue(mockScraper as any);
            insertManySpy = jest.spyOn(ScrapedData, "insertMany").mockResolvedValue([] as any);
            logCreateSpy = jest.spyOn(ScraperLog, "create").mockImplementation((args: any) => {
                return Promise.resolve({
                    _id: new mongoose.Types.ObjectId(),
                    ...args,
                } as any);
            });

            // Mock ScraperLog.find with chainable methods
            logFindSpy = jest
                .spyOn(ScraperLog, "find")
                .mockImplementation(() => createMockMongooseChain([]));
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should successfully run, normalize, validate, and check quality score on healthy HTML", async () => {
            const result = await scraperService.runScraperJob(
                mockScraper._id.toString(),
                healthyHtml,
            );

            expect(result.success).toBe(true);
            expect(result.scrapedItems).toHaveLength(2);

            // Verifies normalization stripped currency text
            expect(result.scrapedItems[0].price).toBe("1299");
            expect(result.scrapedItems[0].url).toBe("https://shop.com/prod-a");

            expect(result.log.qualityScore).toBe(1.0); // 100% Quality
            expect(result.log.healingAttempted).toBe(false);
        });

        it("should auto-heal broken selector and rollback if healed configuration drops quality", async () => {
            // Step 1: Run with broken HTML. Self-healing should deploy a fix changing selectors to .sale-price and .item-url
            const result = await scraperService.runScraperJob(
                mockScraper._id.toString(),
                brokenHtml,
            );

            expect(result.success).toBe(true);
            expect(result.scraper.currentVersion).toBe("v2");
            expect(result.scraper.status).toBe("HEALTHY");

            const priceField = result.scraper.fields.find((f: any) => f.name === "price");
            const urlField = result.scraper.fields.find((f: any) => f.name === "url");
            expect(priceField.selector).toBe(".sale-price");
            expect(urlField.selector).toBe(".item-url");

            // Mock log queries to simulate version rollback test
            const mockFindOneChain = createMockMongooseChain({
                qualityScore: 1.0, // Last successful run quality
                timestamp: new Date(),
            });
            jest.spyOn(ScraperLog, "findOne").mockImplementation(() => mockFindOneChain);

            // Step 2: Now feed bad mock HTML where healed selectors fail entirely (simulating degraded performance)
            const badHtml =
                "<html><body><div class='item'><h1 class='title'>Product</h1></div></body></html>";

            // Next run will experience drop in quality: triggers automatic rollback to previous version
            const rollbackResult = await scraperService.runScraperJob(
                mockScraper._id.toString(),
                badHtml,
            );

            // Scraper should restore back to version v1
            expect(rollbackResult.scraper.currentVersion).toBe("v1");
        });
    });
});
