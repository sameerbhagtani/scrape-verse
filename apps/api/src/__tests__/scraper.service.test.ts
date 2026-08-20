import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Scraper from "../shared/models/scraper.model.js";
import ScrapedData from "../shared/models/scrapedData.model.js";
import ScraperLog from "../shared/models/scraperLog.model.js";
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

// Sample healthy mock HTML
const healthyHtml = `
  <html>
    <body>
      <div class="product-card">
        <h2 class="product-name">Super Widget A</h2>
        <span class="price">$19.99</span>
        <div class="rating">4.8</div>
        <a class="product-link" href="/products/widget-a">View Detail</a>
      </div>
      <div class="product-card">
        <h2 class="product-name">Mega Widget B</h2>
        <span class="price">$45.00</span>
        <div class="rating">4.2</div>
        <a class="product-link" href="/products/widget-b">View Detail</a>
      </div>
    </body>
  </html>
`;

// Sample broken HTML where price class is renamed to "current-price" and link class is renamed to "detail-url"
const brokenHtml = `
  <html>
    <body>
      <div class="product-card">
        <h2 class="product-name">Super Widget A</h2>
        <span class="current-price">$19.99</span>
        <div class="rating">4.8</div>
        <a class="detail-url" href="/products/widget-a">View Detail</a>
      </div>
      <div class="product-card">
        <h2 class="product-name">Mega Widget B</h2>
        <span class="current-price">$45.00</span>
        <div class="rating">4.2</div>
        <a class="detail-url" href="/products/widget-b">View Detail</a>
      </div>
    </body>
  </html>
`;

describe("Scraper Service & Self-Healing Pipeline", () => {
    let mockScraper: any;
    let findByIdSpy: jest.SpyInstance;
    let insertManySpy: jest.SpyInstance;
    let logCreateSpy: jest.SpyInstance;
    let logFindSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Initialize a clean mock scraper before each test
        mockScraper = {
            _id: new mongoose.Types.ObjectId(),
            name: "Test E-commerce Scraper",
            collectorId: "col_test_123",
            targetUrl: "https://example-test-store.com/products",
            itemContainerSelector: ".product-card",
            currentVersion: "v1",
            status: "HEALTHY",
            fields: [
                {
                    name: "title",
                    type: "string",
                    selector: ".product-name",
                    required: true,
                    validationRules: [{ type: "notEmpty" }],
                    normalizationRules: [],
                    description: "Title",
                },
                {
                    name: "price",
                    type: "string",
                    selector: ".price",
                    required: true,
                    validationRules: [{ type: "notEmpty" }, { type: "containsNumber" }],
                    normalizationRules: [],
                    description: "Price",
                },
                {
                    name: "rating",
                    type: "number",
                    selector: ".rating",
                    required: true,
                    validationRules: [
                        { type: "notEmpty" },
                        { type: "numberRange", min: 0, max: 5 },
                    ],
                    normalizationRules: [],
                    description: "Rating",
                },
                {
                    name: "url",
                    type: "url",
                    selector: ".product-link",
                    required: true,
                    validationRules: [{ type: "notEmpty" }, { type: "isValidUrl" }],
                    normalizationRules: [],
                    description: "Link URL",
                },
            ],
            versionHistory: [] as any[],
            deduplicationStrategy: [],
            save: jest.fn().mockImplementation(function (this: any) {
                return Promise.resolve(this);
            }),
        };

        // Spy and mock Scraper Model static methods
        findByIdSpy = jest.spyOn(Scraper, "findById").mockResolvedValue(mockScraper as any);
        insertManySpy = jest.spyOn(ScrapedData, "insertMany").mockResolvedValue([] as any);
        logCreateSpy = jest.spyOn(ScraperLog, "create").mockImplementation((args: any) => {
            return Promise.resolve({
                _id: new mongoose.Types.ObjectId(),
                ...args,
            } as any);
        });

        // Mock ScraperLog.find using our generic query chain mocker
        logFindSpy = jest
            .spyOn(ScraperLog, "find")
            .mockImplementation(() => createMockMongooseChain([]));
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("should scrape healthy HTML successfully without triggering healing", async () => {
        const result = await scraperService.runScraperJob(mockScraper._id.toString(), healthyHtml);

        expect(findByIdSpy).toHaveBeenCalledWith(mockScraper._id.toString());
        expect(result.success).toBe(true);
        expect(result.scrapedItems).toHaveLength(2);
        expect(result.scrapedItems[0].title).toBe("Super Widget A");
        expect(result.scrapedItems[0].price).toBe("$19.99");
        expect(result.scrapedItems[0].rating).toBe("4.8");
        expect(result.scrapedItems[0].url).toBe("/products/widget-a");

        // Verify log was saved correctly
        expect(logCreateSpy).toHaveBeenCalled();
        expect(result.log.status).toBe("healthy");
        expect(result.log.successRate).toBe(1);
        expect(result.log.healingAttempted).toBe(false);

        // Verify data was saved
        expect(insertManySpy).toHaveBeenCalled();
        expect(insertManySpy.mock.calls[0][0][0].data.title).toBe("Super Widget A");
    });

    it("should trigger healing, find correct replacement selectors, and update configuration version on broken HTML", async () => {
        // Run scraper with broken HTML
        const result = await scraperService.runScraperJob(mockScraper._id.toString(), brokenHtml);

        // Resulting scrape should succeed after auto-healing the price and url selectors
        expect(result.success).toBe(true);
        expect(result.scrapedItems).toHaveLength(2);
        expect(result.scrapedItems[0].price).toBe("$19.99");
        expect(result.scrapedItems[0].url).toBe("/products/widget-a");

        // Check if configuration version bumped to v2 and status is active
        expect(result.scraper.currentVersion).toBe("v2");
        expect(result.scraper.status).toBe("HEALTHY");

        // Verify historical version v1 selectors saved in versionHistory
        expect(result.scraper.versionHistory).toHaveLength(1);
        expect(result.scraper.versionHistory[0].version).toBe("v1");
        expect(result.scraper.versionHistory[0].selectors.price).toBe(".price");

        // Verify selectors updated in current fields configuration
        const priceField = result.scraper.fields.find((f: any) => f.name === "price");
        const urlField = result.scraper.fields.find((f: any) => f.name === "url");
        expect(priceField.selector).toBe(".current-price");
        expect(urlField.selector).toBe(".detail-url");

        // Verify Log fields
        expect(logCreateSpy).toHaveBeenCalled();
        expect(result.log.status).toBe("healthy"); // Ends up healthy because healing succeeded
        expect(result.log.healingAttempted).toBe(true);
        expect(result.log.healingAttempts[0].status).toBe("success");
    });
});
