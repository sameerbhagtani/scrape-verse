import type {
    ValidationRule,
    SchemaField,
    ValidationResult,
    QualityScoreResult,
} from "@scrape-verse/types";
import logger from "../shared/config/logger.config.js";

export type { ValidationRule, SchemaField, ValidationResult };

export class ValidationService {
    /**
     * Checks if a string value complies with a specific validation rule.
     */
    public validateRule(value: string, rule: ValidationRule): boolean {
        if (rule.type === "notEmpty") {
            return value !== undefined && value !== null && value.trim() !== "";
        }
        if (rule.type === "containsNumber") {
            return /\d/.test(value);
        }
        if (rule.type === "numberRange") {
            const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
            if (isNaN(num)) return false;
            if (rule.min !== undefined && num < rule.min) return false;
            if (rule.max !== undefined && num > rule.max) return false;
            return true;
        }
        if (rule.type === "isValidUrl") {
            const urlPattern = /^(https?:\/\/|\/)[^\s/$.?#].[^\s]*$/i;
            return urlPattern.test(value);
        }
        return true;
    }

    /**
     * Checks if a value matches its expected base data type.
     */
    public validateType(value: string, type: string): boolean {
        if (!value) return true; // Empty checks handled by 'required' or 'notEmpty'

        if (type === "number") {
            const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
            return !isNaN(num);
        }
        if (type === "date") {
            const ts = Date.parse(value);
            return !isNaN(ts);
        }
        if (type === "url") {
            const urlPattern = /^(https?:\/\/|\/)[^\s/$.?#].[^\s]*$/i;
            return urlPattern.test(value);
        }
        if (type === "boolean") {
            const lower = value.toLowerCase().trim();
            return ["true", "false", "1", "0", "yes", "no"].includes(lower);
        }

        return true; // "string" is always valid
    }

    /**
     * Validates a record against schema fields configuration.
     */
    public validateRecord(
        record: Record<string, string>,
        fieldsConfig: SchemaField[],
    ): ValidationResult {
        const failures: Record<string, string[]> = {};
        let isValid = true;

        for (const field of fieldsConfig) {
            const val = record[field.name];
            const fieldFailures: string[] = [];

            // 1. Required check
            if (field.required) {
                if (val === undefined || val === null || val.trim() === "") {
                    fieldFailures.push("required");
                }
            }

            if (val !== undefined && val !== null && val.trim() !== "") {
                // 2. Type validation
                if (!this.validateType(val, field.type)) {
                    fieldFailures.push(`invalid_type_${field.type}`);
                }

                // 3. Custom rules
                if (field.validationRules && field.validationRules.length > 0) {
                    for (const rule of field.validationRules) {
                        if (!this.validateRule(val, rule)) {
                            fieldFailures.push(`rule_${rule.type}`);
                        }
                    }
                }
            }

            if (fieldFailures.length > 0) {
                failures[field.name] = fieldFailures;
                isValid = false;
            }
        }

        return { isValid, failures };
    }

    /**
     * Feature 6: Performs deduplication on records based on unique key fields.
     */
    public deduplicateRecords(
        records: Record<string, string>[],
        deduplicationStrategy: string[],
    ): { uniqueRecords: Record<string, string>[]; duplicatesCount: number } {
        if (!deduplicationStrategy || deduplicationStrategy.length === 0) {
            return { uniqueRecords: records, duplicatesCount: 0 };
        }

        const seenKeys = new Set<string>();
        const uniqueRecords: Record<string, string>[] = [];
        let duplicatesCount = 0;

        for (const rec of records) {
            // Generate composite unique key
            const compositeKey = deduplicationStrategy
                .map((field) => (rec[field] || "").trim().toLowerCase())
                .join("|");

            if (seenKeys.has(compositeKey)) {
                duplicatesCount++;
            } else {
                seenKeys.add(compositeKey);
                uniqueRecords.push(rec);
            }
        }

        return { uniqueRecords, duplicatesCount };
    }

    /**
     * Feature 5: Calculates deterministic data quality score and metrics
     */
    public calculateQualityScore(
        records: Record<string, string>[],
        fieldsConfig: SchemaField[],
        duplicatesCount: number,
    ): QualityScoreResult {
        if (records.length === 0) {
            return {
                qualityScore: 0,
                metrics: { completeness: 0, validity: 0, duplicates: 0, schemaMatch: 0 },
            };
        }

        let totalRequiredFields = 0;
        let filledRequiredFields = 0;

        let totalChecks = 0;
        let passedChecks = 0;

        let totalKeysExpected = records.length * fieldsConfig.length;
        let matchedKeysCount = 0;

        for (const rec of records) {
            // Count matched schema keys
            for (const field of fieldsConfig) {
                if (rec[field.name] !== undefined) {
                    matchedKeysCount++;
                }

                const val = rec[field.name] || "";

                if (field.required) {
                    totalRequiredFields++;
                    if (val.trim() !== "") {
                        filledRequiredFields++;
                    }
                }

                // Validity check count
                totalChecks++;
                const isTypeValid = this.validateType(val, field.type);
                let rulesPass = true;
                if (field.validationRules) {
                    for (const rule of field.validationRules) {
                        if (val && !this.validateRule(val, rule)) {
                            rulesPass = false;
                        }
                    }
                }

                if (isTypeValid && rulesPass && (!field.required || val.trim() !== "")) {
                    passedChecks++;
                }
            }
        }

        // Metrics percentage
        const completeness =
            totalRequiredFields > 0 ? filledRequiredFields / totalRequiredFields : 1.0;
        const validity = totalChecks > 0 ? passedChecks / totalChecks : 1.0;
        const duplicates = records.length > 0 ? 1.0 - duplicatesCount / records.length : 1.0;
        const schemaMatch = totalKeysExpected > 0 ? matchedKeysCount / totalKeysExpected : 1.0;

        // Weighted final quality score: 40% Completeness, 40% Validity, 10% Duplicates, 10% Schema Match
        const qualityScore =
            completeness * 0.4 + validity * 0.4 + duplicates * 0.1 + schemaMatch * 0.1;

        return {
            qualityScore: parseFloat(qualityScore.toFixed(4)),
            metrics: {
                completeness: parseFloat(completeness.toFixed(4)),
                validity: parseFloat(validity.toFixed(4)),
                duplicates: parseFloat(duplicates.toFixed(4)),
                schemaMatch: parseFloat(schemaMatch.toFixed(4)),
            },
        };
    }
}

export default new ValidationService();
