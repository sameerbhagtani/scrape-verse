import mongoose from "mongoose";

const validationRuleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["notEmpty", "containsNumber", "numberRange", "isValidUrl"],
        },
        min: { type: Number, required: false },
        max: { type: Number, required: false },
    },
    { _id: false },
);

const normalizationRuleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["stripCurrency", "parseNumber", "trim", "resolveUrl", "parseDate"],
        },
    },
    { _id: false },
);

const fieldSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ["string", "number", "boolean", "url", "date"],
            default: "string",
        },
        selector: { type: String, required: true },
        required: { type: Boolean, default: false },
        validationRules: [validationRuleSchema],
        normalizationRules: [normalizationRuleSchema],
        description: { type: String, default: "" },
        extractionStrategy: { type: mongoose.Schema.Types.Mixed, default: "" },
    },
    { _id: false },
);

const versionHistorySchema = new mongoose.Schema(
    {
        version: { type: String, required: true },
        selectors: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        reason: { type: String, default: "" },
        qualityScore: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const scraperSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Scraper name is required"],
        },
        collectorId: {
            type: String,
            required: [true, "Bright Data Collector ID is required"],
            unique: true,
        },
        targetUrl: {
            type: String,
            required: [true, "Target URL is required"],
        },
        itemContainerSelector: {
            type: String,
            default: "",
        },
        currentVersion: {
            type: String,
            default: "v1",
        },
        status: {
            type: String,
            enum: ["HEALTHY", "WARNING", "DEGRADED", "BROKEN", "HEALING"],
            default: "HEALTHY",
        },
        fields: [fieldSchema],
        versionHistory: [versionHistorySchema],

        // Deduplication Strategy
        deduplicationStrategy: {
            type: [String], // Fields that define uniqueness, e.g. ['product_url']
            default: [],
        },

        // Scheduling
        cronExpression: {
            type: String,
            default: "",
        },

        // Health and Metrics Trackers
        lastSuccessfulRun: {
            type: Date,
        },
        consecutiveFailures: {
            type: Number,
            default: 0,
        },
        averageQualityScore: {
            type: Number,
            default: 0,
        },
        averageResponseTime: {
            type: Number,
            default: 0,
        },
        totalRuns: {
            type: Number,
            default: 0,
        },
        totalItemsScraped: {
            type: Number,
            default: 0,
        },

        // AI Healing Thresholds
        autoApproveThreshold: {
            type: Number,
            default: 0.9,
        },
        reviewThreshold: {
            type: Number,
            default: 0.7,
        },

        // Automation & Enrichment
        webhookUrl: {
            type: String,
            default: "",
        },
        enrichmentInstruction: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

// Pre-validate hook to defensively sanitize fields before validation
scraperSchema.pre("validate", function (next) {
    if (this.fields && Array.isArray(this.fields)) {
        this.fields = this.fields.map((f: any) => {
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
                type: f.type || "string",
                selector: String(selector),
                required: Boolean(f.required),
                description: f.description || "",
                extractionStrategy,
                validationRules,
                normalizationRules,
            };
        }) as any;
    }
    next();
});

const Scraper = mongoose.model("Scraper", scraperSchema);
export default Scraper;
