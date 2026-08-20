import mongoose from "mongoose";

const healingAttemptSchema = new mongoose.Schema(
    {
        strategy: { type: String, required: true },
        candidate: { type: String, required: true },
        validationScore: { type: Number, required: true },
        confidence: { type: Number, required: true },
        status: { type: String, enum: ["success", "failed"], required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false },
);

const qualityMetricsSchema = new mongoose.Schema(
    {
        completeness: { type: Number, default: 0 },
        validity: { type: Number, default: 0 },
        duplicates: { type: Number, default: 0 },
        schemaMatch: { type: Number, default: 0 },
    },
    { _id: false },
);

const scraperLogSchema = new mongoose.Schema(
    {
        scraperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scraper",
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        successRate: {
            type: Number,
            required: true,
        },
        totalItems: {
            type: Number,
            required: true,
        },
        validItems: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["healthy", "warning", "degraded", "broken"],
            required: true,
        },
        versionUsed: {
            type: String,
            required: true,
        },
        durationMs: {
            type: Number,
            default: 0,
        },
        pagesScraped: {
            type: Number,
            default: 1,
        },
        qualityScore: {
            type: Number,
            default: 0,
        },
        qualityMetrics: {
            type: qualityMetricsSchema,
            default: () => ({ completeness: 0, validity: 0, duplicates: 0, schemaMatch: 0 }),
        },
        changeReport: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        healingAttempted: {
            type: Boolean,
            default: false,
        },
        healingAttempts: [healingAttemptSchema],
        healingDetails: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
    },
    { timestamps: true },
);

const ScraperLog = mongoose.model("ScraperLog", scraperLogSchema);
export default ScraperLog;
