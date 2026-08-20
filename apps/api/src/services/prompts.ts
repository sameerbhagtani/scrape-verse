/**
 * Prompt Management Repository
 * Version: 1.0.0
 */

export const PROMPTS = {
    /**
     * Feature 1 & 2: Converts natural language request into a list of fields
     */
    SCRAPER_PLANNER: `
You are an AI scraper planner. Your task is to convert a user's natural language request into a structured scraping schema.

User Instruction:
{instruction}

Analyze the request and return a JSON object with a single root key "fields". Each field must contain:
- "name": string (camelCase identifier, e.g. "productName", "price", "rating")
- "type": string (must be "string", "number", "boolean", "url", "date")
- "required": boolean (whether this field is critical for a valid product/item)
- "description": string (brief explanation of what the field is)

Output MUST be strictly JSON. No markdown code blocks, no text before or after the JSON.
`,

    /**
     * Feature 3: Schema Generation
     * Takes fields and generates extraction strategies and validation rules
     */
    SCHEMA_GENERATOR: `
You are an AI schema generator. Take the following fields and generate a comprehensive schema layout containing:
- field name
- data type ("string", "number", "boolean", "url", "date")
- required/optional
- description
- validation rules (JSON array with types: "notEmpty", "containsNumber", "numberRange", "isValidUrl", and optional parameters "min", "max")
- extraction strategy (CSS selector guesses and heuristics, e.g., ".product-name", "h1.title")
- normalization rules (JSON array with types: "stripCurrency", "parseNumber", "trim", "resolveUrl", "parseDate")

Fields to generate schema for:
{fieldsJson}

Output MUST be strictly a JSON array of fields. No explanations, no markdown blocks.
`,

    /**
     * Feature 11 & 12: selector repair DOM Analysis
     */
    DOM_ANALYSIS: `
You are an expert DOM Analyzer. A scraper selector has failed.
Field Affected: "{fieldName}"
Old Selector: "{oldSelector}"
Validation Rules:
{validationRulesJson}

Here is a snippet of the HTML structure of the target website:
\`\`\`html
{htmlSnippet}
\`\`\`

Analyze the HTML structure. Locate the element that contains the "{fieldName}" data.
Generate a list of 5 candidate CSS selectors that can successfully extract this data. Order them from highest confidence to lowest confidence.
Provide your response strictly as a JSON array of strings:
["selector-1", "selector-2", "selector-3", "selector-4", "selector-5"]
`,

    /**
     * Feature 11 Strategy 6: Direct AI text extraction fallback
     */
    AI_EXTRACTION_FALLBACK: `
You are an AI data extractor. You will extract data directly from the HTML snippet based on the schema provided.
Fields to extract:
{schemaJson}

HTML Snippet:
\`\`\`html
{htmlSnippet}
\`\`\`

Extract the items (or single item) and return them as a JSON array of objects, where the keys are the field names and values are the extracted texts.
Output MUST be strictly a JSON array of objects.
`,

    /**
     * Feature 23: AI Data Enrichment
     */
    DATA_ENRICHMENT: `
You are an AI data enrichment worker. Take the raw scraped data item and enrich it based on the user's instructions.
Instruction: "{enrichmentInstruction}"
Raw Item:
{itemJson}

Provide the enriched fields as a JSON object, containing the keys and values.
Output MUST be strictly a JSON object.
`,
};
