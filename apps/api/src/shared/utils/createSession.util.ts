// Importing modules
import mongoose from "mongoose";
import SessionDao from "../dao/session.dao.js";
import type { Response } from "express";
import { COOKIE_EXPIRY_TIME, REFRESH_TOKEN_COOKIE_OPTIONS } from "../constants/tokens.constants.js";
import { generateAccessToken, generateRefreshToken } from "./token.util.js";
import buildTokenPayload from "./buildTokenPayload.util.js";

// function to create a session and return sanitized user with tokens
async function createSession(user: Record<string, unknown> | object, res: Response) {
    const rawId: any = (user as any)?._id || (user as any)?.id || (user as any)?.userId;
    let userIdObj: mongoose.Types.ObjectId;

    if (rawId instanceof mongoose.Types.ObjectId) {
        userIdObj = rawId;
    } else {
        const str = String(rawId || "");
        const hexMatch = str.match(/[0-9a-fA-F]{24}/);
        if (hexMatch) {
            userIdObj = new mongoose.Types.ObjectId(hexMatch[0]);
        } else {
            throw new Error(`Invalid user ID provided for session creation: ${str}`);
        }
    }

    const tokenPayload = await buildTokenPayload(user);
    const sessionId = new mongoose.Types.ObjectId();
    const refreshToken = generateRefreshToken({
        sessionId: sessionId.toString(),
        userId: userIdObj.toString(),
    });

    const sDao = new SessionDao();
    await sDao.createSession({
        _id: sessionId,
        userId: userIdObj,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + COOKIE_EXPIRY_TIME),
    });

    const accessToken = generateAccessToken(tokenPayload);
    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    return { sanitizedUser: tokenPayload, accessToken };
}

export default createSession;
