"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";

/**
 * Login Page
 *
 * Layout:
 * - Full-screen video background (native loop, seamless)
 * - Left side: "Control your identity" in a redistributable brush font
 * - Right side: Basic login card (dark glass, pinned to edge)
 */
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-void">
            {/* ═══════════════════════════════════════════════
             *  VIDEO BACKGROUND — Seamless Infinite Ping-Pong Loop
             * ═══════════════════════════════════════════════ */}
            <div className="absolute inset-0 z-0">
                <video
                    src="/video/login-bg-pingpong.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Cinematic overlays */}
                <div className="absolute inset-0 bg-void/50 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-r from-void/85 via-void/30 to-void/70 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-t from-void/60 via-transparent to-void/40 pointer-events-none" />
            </div>

            {/* ═══════════════════════════════════════════════
             *  CONTENT — Split Layout (card pushed to far right)
             * ═══════════════════════════════════════════════ */}
            <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row items-center lg:items-center justify-between gap-8 lg:gap-12 px-6 md:px-12 lg:pl-16 lg:pr-12 xl:pl-20 xl:pr-16 py-12">
                {/* ─── LEFT SIDE: Spider-Man Branding ─── */}
                <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className="flex max-w-170 flex-col items-start lg:flex-1"
                >
                    {/* ScrapVerse logo */}
                    <Link href="/" className="flex items-center gap-2 mb-6 group">
                        <span className="inline-block w-3 h-3 bg-flare rounded-xs animate-pulse" />
                        <span className="font-extrabold tracking-tighter text-xl lg:text-2xl leading-none uppercase font-mono text-off-white">
                            SCRAPVERSE<span className="text-flare text-xs">®</span>
                        </span>
                    </Link>

                    {/* Hero display text */}
                    <h1 className="font-brush text-7xl leading-[0.88] text-off-white mb-6 select-none drop-shadow-2xl sm:text-8xl md:text-9xl lg:text-[8.5vw] xl:text-[8.5vw]">
                        Control
                        <br />
                        <span className="text-flare">your</span>
                        <br />
                        identity
                    </h1>

                    <p className="max-w-110 font-mono text-xs leading-relaxed text-off-white/70 sm:text-sm md:text-base">
                        {"// ACCESS THE SCRAPE-VERSE. DEPLOY INTELLIGENT AGENTS."}
                        <br />
                        {"// SELF-HEALING SCRAPERS. BRIGHT DATA POWERED."}
                    </p>

                    {/* HUD decorative element */}
                    <div className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-off-white/40">
                        <span className="inline-block h-2 w-2 rounded-full bg-flare animate-ping" />
                        NODE: EARTH-616 // MULTIVERSE ACCESS PROTOCOL
                    </div>
                </motion.div>

                {/* ─── RIGHT SIDE: Login Card (Shifted to Far Right) ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                    className="w-full max-w-100 lg:ml-auto lg:max-w-105 lg:shrink-0"
                >
                    <div className="bg-void/80 backdrop-blur-md border border-off-white/10 p-8 md:p-10 shadow-2xl">
                        {/* Card header */}
                        <div className="mb-8">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-off-white mb-2">
                                Sign In
                            </h2>
                            <p className="text-xs font-mono uppercase tracking-wider text-off-white/50">
                                {"// SCRAPE-VERSE IDENTITY VERIFICATION"}
                            </p>
                        </div>

                        {/* Login form */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                // TODO: actual auth
                            }}
                            className="flex flex-col gap-5"
                        >
                            {/* Email field */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                    <span className="font-light mr-1">/</span> Email or Username
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="miles@scrapverse.dev"
                                    required
                                    className="w-full bg-off-white/5 border border-off-white/15 text-off-white placeholder-off-white/30 px-4 py-3 text-sm font-mono outline-none focus:border-flare/60 transition-colors duration-300"
                                />
                            </div>

                            {/* Password field */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                    <span className="font-light mr-1">/</span> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        required
                                        className="w-full bg-off-white/5 border border-off-white/15 text-off-white placeholder-off-white/30 px-4 py-3 text-sm font-mono outline-none focus:border-flare/60 transition-colors duration-300 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/40 hover:text-off-white text-xs font-mono uppercase cursor-pointer transition-colors"
                                    >
                                        {showPassword ? "HIDE" : "SHOW"}
                                    </button>
                                </div>
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between text-xs font-mono">
                                <label className="flex items-center gap-2 cursor-pointer text-off-white/60 hover:text-off-white transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 accent-flare cursor-pointer"
                                    />
                                    Remember me
                                </label>
                                <a
                                    href="#"
                                    className="text-flare/80 hover:text-flare transition-colors uppercase tracking-wider"
                                >
                                    Forgot?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full bg-flare text-off-white py-3.5 text-sm font-black uppercase tracking-wider hover:bg-flare/90 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group mt-2"
                            >
                                <span>ACCESS SCRAPE-VERSE</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 22 19"
                                    fill="currentColor"
                                    className="h-3.5 w-4 group-hover:translate-x-1 transition-transform"
                                >
                                    <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
                                </svg>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-off-white/10" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-off-white/30">
                                or
                            </span>
                            <div className="flex-1 h-px bg-off-white/10" />
                        </div>

                        {/* Google OAuth frontend. Backend exchanges the authorization code. */}
                        <GoogleSignInButton />

                        {/* Sign up link */}
                        <p className="mt-6 text-center text-xs font-mono text-off-white/40">
                            New to ScrapVerse?{" "}
                            <a
                                href="#"
                                className="text-flare hover:underline uppercase tracking-wider"
                            >
                                Create Account
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════
             *  Bottom HUD Bar
             * ═══════════════════════════════════════════════ */}
            <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-off-white/30">
                <span>© SCRAPVERSE 2026 // INTO THE SCRAPE-VERSE</span>
                <span className="hidden md:inline">BRIGHT DATA × WEMAKEDEVS HACKATHON</span>
            </div>
        </main>
    );
}
