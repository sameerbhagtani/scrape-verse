import logger from "../shared/config/logger.config.js";

export class NormalizationService {
    /**
     * Normalizes a field value based on configured normalization rules.
     */
    public normalizeValue(value: string, ruleType: string, baseUrl?: string): string {
        if (!value) return "";

        let cleanValue = value.trim();

        switch (ruleType) {
            case "trim":
                // Basic HTML stripping and whitespace cleanup
                cleanValue = cleanValue.replace(/<[^>]*>/g, ""); // Strip HTML tags
                cleanValue = cleanValue.replace(/\s+/g, " "); // Collapse duplicate whitespaces
                return cleanValue.trim();

            case "stripCurrency":
                // Remove currency symbols (e.g. $, ₹, €, £, INR, etc.) and commas
                cleanValue = cleanValue.replace(/[₹$€£\s,]/gi, "");
                // Replace multi-char currency codes
                cleanValue = cleanValue.replace(/(INR|USD|EUR|GBP)/gi, "");
                return cleanValue.trim();

            case "parseNumber":
                // Extract only numbers and decimals
                const match = cleanValue.match(/[+-]?\d+(\.\d+)?/);
                if (match) {
                    return match[0];
                }
                return "";

            case "resolveUrl":
                if (!baseUrl) return cleanValue;
                try {
                    const resolved = new URL(cleanValue, baseUrl);
                    return resolved.href;
                } catch {
                    // Fallback to adding base domain if relative starts with /
                    if (cleanValue.startsWith("/")) {
                        const parsedBase = new URL(baseUrl);
                        return `${parsedBase.origin}${cleanValue}`;
                    }
                    return cleanValue;
                }

            case "parseDate":
                try {
                    const parsed = Date.parse(cleanValue);
                    if (!isNaN(parsed)) {
                        return new Date(parsed).toISOString();
                    }
                } catch (err) {
                    logger.debug(`Failed to parse date string: ${cleanValue}`);
                }
                return cleanValue;

            default:
                return cleanValue;
        }
    }

    /**
     * Normalizes a complete record using the field configurations
     */
    public normalizeRecord(
        record: Record<string, string>,
        fieldsConfig: any[],
        baseUrl?: string,
    ): Record<string, string> {
        const normalized: Record<string, string> = { ...record };

        for (const field of fieldsConfig) {
            const fieldName = field.name;
            let val = record[fieldName] || "";

            if (field.normalizationRules && field.normalizationRules.length > 0) {
                for (const rule of field.normalizationRules) {
                    val = this.normalizeValue(val, rule.type, baseUrl);
                }
            }

            // Always default to basic trimming
            val = this.normalizeValue(val, "trim");
            normalized[fieldName] = val;
        }

        return normalized;
    }
}

export default new NormalizationService();
