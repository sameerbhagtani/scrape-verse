import mongoose from "mongoose";

const scrapedDataSchema = new mongoose.Schema(
    {
        scraperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scraper",
            required: true,
        },
        versionUsed: {
            type: String,
            required: true,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        scrapedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true },
);

const ScrapedData = mongoose.model("ScrapedData", scrapedDataSchema);
export default ScrapedData;
