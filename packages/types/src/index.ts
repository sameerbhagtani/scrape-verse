/**
 * @scrape-verse/types
 * Single source of truth for types across ScrapeVerse apps and packages
 */

// ─── Scraper Fields, Validation & Normalization ───

export type ValidationRuleType = "notEmpty" | "containsNumber" | "numberRange" | "isValidUrl";

export interface ValidationRule {
    type: ValidationRuleType;
    min?: number;
    max?: number;
}

export type NormalizationRuleType =
    "stripCurrency" | "parseNumber" | "trim" | "resolveUrl" | "parseDate";

export interface NormalizationRule {
    type: NormalizationRuleType;
}

export type FieldType = "string" | "number" | "boolean" | "url" | "date";

export interface SchemaField {
    name: string;
    type: FieldType;
    selector: string;
    required: boolean;
    validationRules?: ValidationRule[];
    normalizationRules?: NormalizationRule[];
    description?: string;
    extractionStrategy?: string;
}

export interface ValidationResult {
    isValid: boolean;
    failures: Record<string, string[]>;
}

// ─── Scraper Configuration & Versioning ───

export type ScraperStatus = "HEALTHY" | "WARNING" | "DEGRADED" | "BROKEN" | "HEALING";

export interface VersionHistoryEntry {
    version: string;
    selectors: Record<string, string>;
    reason?: string;
    qualityScore?: number;
    createdAt?: string | Date;
}

export interface ScraperConfig {
    _id: string;
    name: string;
    collectorId: string;
    targetUrl: string;
    itemContainerSelector?: string;
    currentVersion: string;
    status: ScraperStatus;
    fields: SchemaField[];
    versionHistory: VersionHistoryEntry[];
    deduplicationStrategy?: string[];
    cronExpression?: string;
    lastSuccessfulRun?: string | Date;
    consecutiveFailures?: number;
    averageQualityScore?: number;
    averageResponseTime?: number;
    totalRuns?: number;
    totalItemsScraped?: number;
    autoApproveThreshold?: number;
    reviewThreshold?: number;
    webhookUrl?: string;
    enrichmentInstruction?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface CreateScraperDto {
    name: string;
    collectorId: string;
    targetUrl: string;
    itemContainerSelector?: string;
    fields: SchemaField[];
    deduplicationStrategy?: string[];
    cronExpression?: string;
    autoApproveThreshold?: number;
    reviewThreshold?: number;
    webhookUrl?: string;
    enrichmentInstruction?: string;
}

export interface UpdateScraperDto extends Partial<CreateScraperDto> {}

export interface RollbackScraperDto {
    version: string;
}

// ─── Logs, Healing & Analytics ───

export interface HealingAttempt {
    strategy: string;
    candidate: string;
    validationScore: number;
    confidence: number;
    status: "success" | "failed";
    timestamp: string | Date;
}

export interface QualityMetrics {
    completeness: number;
    validity: number;
    duplicates: number;
    schemaMatch: number;
}

export interface QualityScoreResult {
    qualityScore: number;
    metrics: QualityMetrics;
}

export type ScraperLogStatus = "healthy" | "warning" | "degraded" | "broken";

export interface ScraperLog {
    _id: string;
    scraperId: string;
    timestamp: string | Date;
    successRate: number;
    totalItems: number;
    validItems: number;
    status: ScraperLogStatus;
    versionUsed: string;
    durationMs: number;
    pagesScraped: number;
    qualityScore: number;
    qualityMetrics: QualityMetrics;
    changeReport?: Record<string, any> | null;
    healingAttempted: boolean;
    healingAttempts?: HealingAttempt[];
    healingDetails?: Record<string, any> | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface ScrapedDataItem {
    _id: string;
    scraperId: string;
    versionUsed: string;
    data: Record<string, any>;
    scrapedAt: string | Date;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface ScraperRunResult {
    success: boolean;
    scrapedItemsCount: number;
    scrapedItems?: Record<string, any>[];
    log: ScraperLog;
    scraper: {
        id: string;
        name: string;
        status: ScraperStatus;
        currentVersion: string;
    };
}

export interface QualityTrendPoint {
    timestamp: string | Date;
    qualityScore: number;
    successRate: number;
}

export interface ScraperAnalytics {
    scraperId: string;
    name: string;
    status: ScraperStatus;
    totalRuns: number;
    totalItemsScraped: number;
    averageQualityScore: number;
    averageResponseTime: number;
    healing: {
        totalAttempts: number;
        successful: number;
    };
    qualityTrend: QualityTrendPoint[];
}

export interface WebsiteChangeRecord {
    timestamp: string | Date;
    versionUsed: string;
    report: Record<string, any>;
}

// ─── AI Planner & Schema Generator ───

export interface FieldPlan {
    name: string;
    type: FieldType | string;
    required?: boolean;
    description?: string;
}

export interface ScraperPlanRequest {
    instruction: string;
}

export interface ScraperPlanResponse {
    fields: FieldPlan[];
}

export interface SchemaGeneratorRequest {
    fields: FieldPlan[];
}

// ─── Authentication & User ───

export type UserRole = "USER" | "ADMIN";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    accessToken?: string;
    tokens?: AuthTokens;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface SignupDto {
    name: string;
    email: string;
    password: string;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    token: string;
    password: string;
}

export interface GoogleLoginDto {
    idToken: string;
}

// ─── Common API Responses ───

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface ApiErrorResponse {
    success: boolean;
    message: string;
    error?: any;
    stack?: string;
}
