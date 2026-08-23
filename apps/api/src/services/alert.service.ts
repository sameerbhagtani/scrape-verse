import sendMail from "../shared/utils/sendMail.util.js";
import env from "../shared/config/env.config.js";
import logger from "../shared/config/logger.config.js";
import Scraper from "../shared/models/scraper.model.js";

export class AlertService {
    /**
     * Feature 18 & 19: Sends modular alert notifications to logs, emails, and webhooks.
     */
    public async triggerAlert(
        scraperId: string,
        alertType: "SCRAPER_FAILED" | "SCRAPER_HEALED" | "WEBSITE_CHANGED" | "PRICE_CHANGED",
        details: any,
    ): Promise<void> {
        const scraper = await Scraper.findById(scraperId);
        const scraperName = scraper ? scraper.name : "Unknown Scraper";
        const webhookUrl = scraper ? scraper.webhookUrl : "";

        const subject = `[ScrapeVerse Alert] ${alertType} - ${scraperName}`;
        const messageText = `
Alert Type: ${alertType}
Scraper: ${scraperName} (ID: ${scraperId})
Timestamp: ${new Date().toISOString()}

Details:
${JSON.stringify(details, null, 2)}
        `;

        // 1. Log alert internally
        logger.warn(`ALERT TRIGGERED: ${subject}\n${messageText}`);

        // 2. Email alert (reuse existing Brevo configuration if enabled)
        if (env.SEND_MAIL) {
            try {
                // Ensure there is a recipient configured, fallback to sending user if SMTP_USER is blank
                const recipient = env.BREVO_SENDER_EMAIL || env.SMTP_USER || "admin@example.com";
                const htmlContent = `<pre style="font-family: monospace; white-space: pre-wrap;">${messageText}</pre>`;
                await sendMail(recipient, subject, htmlContent);
                logger.info(`Email alert sent successfully to ${recipient}`);
            } catch (err) {
                logger.error(`Failed to send email alert: ${(err as Error).message}`);
            }
        }

        // 3. Webhook Trigger (Feature 18: "IF price changes -> trigger webhook")
        if (webhookUrl) {
            try {
                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: alertType,
                        scraperId,
                        scraperName,
                        timestamp: new Date(),
                        details,
                    }),
                });
                logger.info(`Webhook alert posted to ${webhookUrl}. Response: ${response.status}`);
            } catch (err) {
                logger.error(`Failed to trigger webhook alert: ${(err as Error).message}`);
            }
        }
    }
}

export default new AlertService();
