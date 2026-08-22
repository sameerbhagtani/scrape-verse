// Importing modules
import express, { Express } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import env from "../config/env.config.js";

// function to apply middlewares to the app
function applyMiddlewares(app: Express) {
    // applying middlewares
    app.use(compression());

    const allowedOrigins = [
        env.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ];

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    env.CORS_ORIGIN === "*" ||
                    allowedOrigins.includes(origin) ||
                    env.NODE_ENV === "development"
                ) {
                    return callback(null, true);
                }
                return callback(new Error(`Origin ${origin} not allowed by CORS`));
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        }),
    );

    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
    );

    app.use(hpp());

    app.use(cookieParser());

    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

    app.use(express.json({ limit: "100kb" }));

    app.use(express.urlencoded({ extended: true, limit: "100kb" }));
}

export default applyMiddlewares;
