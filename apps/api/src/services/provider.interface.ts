export interface ScraperProvider {
    /**
     * Triggers the scraping process on the target URL with given selectors.
     */
    runScraper(
        url: string,
        selectors: Record<string, string>,
        containerSelector?: string,
    ): Promise<{ html: string; rawData: Record<string, string>[] }>;
}
