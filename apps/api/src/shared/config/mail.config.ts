// Brevo Mail Configuration
import env from "./env.config.js";

export const brevoConfig = {
    apiUrl: "https://api.brevo.com/v3/smtp/email",
    get apiKey() {
        return env.BREVO_API_KEY || env.SMTP_PASS || "";
    },
    get senderName() {
        return env.BREVO_SENDER_NAME || "ScrapeVerse";
    },
    get senderEmail() {
        return env.BREVO_SENDER_EMAIL || env.SMTP_USER || "noreply@example.com";
    },
};

export default brevoConfig;
