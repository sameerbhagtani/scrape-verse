import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage } from "@langchain/core/messages";
import type { FieldPlan, ScraperPlanResponse, SchemaField } from "@scrape-verse/types";
import env from "../shared/config/env.config.js";
import logger from "../shared/config/logger.config.js";
import { PROMPTS } from "./prompts.js";

export class AIService {
    private model: ChatMistralAI | null = null;

    constructor() {
        if (env.MISTRAL_API_KEY) {
            this.model = new ChatMistralAI({
                apiKey: env.MISTRAL_API_KEY,
                modelName: "mistral-small",
                temperature: 0.1,
            });
            logger.info("ChatMistralAI model initialized successfully.");
        } else {
            logger.warn(
                "MISTRAL_API_KEY is not defined. AI functionality will run in mock/fallback mode.",
            );
        }
    }

    /**
     * Helper to invoke the Mistral model and parse JSON output.
     */
    private async queryLLM<T>(prompt: string): Promise<T | null> {
        if (!this.model) {
            throw new Error("Mistral Chat Model is not initialized. Please set MISTRAL_API_KEY.");
        }

        try {
            const message = new HumanMessage(prompt);
            const response = await this.model.invoke([message]);
            const text = response.content.toString().trim();

            // Strip out any potential markdown wrapper (e.g. ```json ... ```)
            const cleanText = text
                .replace(/^```json/i, "")
                .replace(/^```/m, "")
                .replace(/```$/m, "")
                .trim();

            return JSON.parse(cleanText) as T;
        } catch (error) {
            logger.error(`Error querying LangChain Mistral Model: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Feature 1 & 2: Plan scraper fields from natural language instructions
     */
    public async planScraper(instruction: string): Promise<ScraperPlanResponse> {
        const prompt = PROMPTS.SCRAPER_PLANNER.replace("{instruction}", instruction);

        if (!this.model) {
            // Mock fallback planner when API key is missing
            logger.info("Using mock fallback scraper planner.");
            return {
                fields: [
                    {
                        name: "productName",
                        type: "string",
                        required: true,
                        description: "Name of the product",
                    },
                    {
                        name: "price",
                        type: "string",
                        required: true,
                        description: "Current price text",
                    },
                    {
                        name: "rating",
                        type: "number",
                        required: false,
                        description: "Rating score of product",
                    },
                ],
            };
        }

        const planned = await this.queryLLM<ScraperPlanResponse>(prompt);
        if (planned && planned.fields) {
            return planned;
        }

        throw new Error("Failed to plan scraper schema from instructions using AI.");
    }

    /**
     * Feature 3: Automatic Schema Generation
     */
    public async generateSchema(fields: FieldPlan[] | SchemaField[]): Promise<SchemaField[]> {
        const prompt = PROMPTS.SCHEMA_GENERATOR.replace(
            "{fieldsJson}",
            JSON.stringify(fields, null, 2),
        );

        const normalizeItem = (f: any): SchemaField => {
            let selector = f.selector;
            if (!selector) {
                if (Array.isArray(f.extractionStrategy) && f.extractionStrategy.length > 0) {
                    selector = f.extractionStrategy[0];
                } else if (
                    typeof f.extractionStrategy === "string" &&
                    f.extractionStrategy.trim()
                ) {
                    selector = f.extractionStrategy.trim();
                } else {
                    selector = `.${f.name}`;
                }
            }

            let extractionStrategy = f.extractionStrategy;
            if (Array.isArray(extractionStrategy)) {
                extractionStrategy = extractionStrategy.join(", ");
            } else if (typeof extractionStrategy !== "string") {
                extractionStrategy = String(extractionStrategy || "");
            }

            let validationRules = f.validationRules || [];
            if (Array.isArray(validationRules)) {
                validationRules = validationRules.map((rule: any) => {
                    if (typeof rule === "string") return { type: rule };
                    return rule;
                });
            }

            let normalizationRules = f.normalizationRules || [];
            if (Array.isArray(normalizationRules)) {
                normalizationRules = normalizationRules.map((rule: any) => {
                    if (typeof rule === "string") return { type: rule };
                    return rule;
                });
            }

            return {
                name: f.name || "field",
                type: (f.type as any) || "string",
                required: f.required !== undefined ? Boolean(f.required) : true,
                description: f.description || "",
                selector: String(selector),
                extractionStrategy,
                validationRules,
                normalizationRules,
            };
        };

        if (!this.model) {
            logger.info("Using mock schema generator.");
            return fields.map((f) =>
                normalizeItem({
                    ...f,
                    validationRules:
                        f.type === "number" ? [{ type: "containsNumber" }] : [{ type: "notEmpty" }],
                    selector: "selector" in f && f.selector ? f.selector : `.${f.name}`,
                    normalizationRules: f.name.toLowerCase().includes("price")
                        ? [{ type: "stripCurrency" }]
                        : [],
                }),
            );
        }

        const generated = await this.queryLLM<any[]>(prompt);
        if (generated && Array.isArray(generated)) {
            return generated.map(normalizeItem);
        }

        return fields.map(normalizeItem);
    }

    /**
     * Feature 11 Strategy 3: Repair CSS selector using LLM DOM analysis
     */
    public async analyzeDOM(
        htmlSnippet: string,
        fieldName: string,
        oldSelector: string,
        validationRules: any[],
    ): Promise<string[]> {
        const prompt = PROMPTS.DOM_ANALYSIS.replace("{fieldName}", fieldName)
            .replace("{oldSelector}", oldSelector)
            .replace("{validationRulesJson}", JSON.stringify(validationRules, null, 2))
            .replace("{htmlSnippet}", htmlSnippet);

        if (!this.model) {
            return [];
        }

        const candidates = await this.queryLLM<string[]>(prompt);
        if (candidates && Array.isArray(candidates)) {
            return candidates;
        }

        return [];
    }

    /**
     * Feature 11 Strategy 6: Direct AI text extraction fallback
     */
    public async extractWithAI(htmlSnippet: string, schema: any[]): Promise<any[]> {
        const prompt = PROMPTS.AI_EXTRACTION_FALLBACK.replace(
            "{schemaJson}",
            JSON.stringify(schema, null, 2),
        ).replace("{htmlSnippet}", htmlSnippet);

        if (!this.model) {
            return [];
        }

        const items = await this.queryLLM<any[]>(prompt);
        if (items && Array.isArray(items)) {
            return items;
        }

        return [];
    }

    /**
     * Feature 23: Optional AI Data Enrichment
     */
    public async enrichData(item: any, enrichmentInstruction: string): Promise<any> {
        const prompt = PROMPTS.DATA_ENRICHMENT.replace(
            "{enrichmentInstruction}",
            enrichmentInstruction,
        ).replace("{itemJson}", JSON.stringify(item, null, 2));

        if (!this.model) {
            logger.info("Using mock enrichment fallback.");
            return {
                ...item,
                sentiment: "positive",
                category: "electronics",
            };
        }

        const enriched = await this.queryLLM<any>(prompt);
        if (enriched) {
            return { ...item, ...enriched };
        }

        return item;
    }
}

export default new AIService();
