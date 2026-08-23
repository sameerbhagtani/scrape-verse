// Importing modules
import axios from "axios";
import logger from "../config/logger.config.js";
import env from "../config/env.config.js";

// function to send the mails via Brevo API
async function sendMail(to: string, subject: string, html: string): Promise<void> {
    if (env.SEND_MAIL) {
        try {
            const apiKey = env.BREVO_API_KEY || env.SMTP_PASS || "";
            const senderName = env.BREVO_SENDER_NAME || "ScrapeVerse";
            const senderEmail = env.BREVO_SENDER_EMAIL || env.SMTP_USER || "noreply@example.com";

            if (!apiKey) {
                logger.warn("Brevo API key is not configured (BREVO_API_KEY). Email skipped.");
                return;
            }

            const response = await axios.post(
                "https://api.brevo.com/v3/smtp/email",
                {
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: to }],
                    subject,
                    htmlContent: html,
                },
                {
                    headers: {
                        "api-key": apiKey,
                        "Content-Type": "application/json",
                    },
                },
            );

            logger.info(
                `📧 Email sent successfully via Brevo API to ${to} | Subject: "${subject}" | MessageId: ${response.data?.messageId || "ok"}`,
            );
        } catch (error: any) {
            const errorDetails = error?.response?.data
                ? JSON.stringify(error.response.data)
                : error?.message || error;
            logger.error(`❌ Failed to send email via Brevo API: ${errorDetails}`);
        }
    } else {
        logger.info(`📧 [Mail Mock] To: ${to} | Subject: "${subject}" | Message: ${html}`);
    }
}

export default sendMail;
