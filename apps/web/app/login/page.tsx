"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";
import { useAuth } from "~/providers/auth-provider";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, login, signup, forgotPassword, isAuthenticated } = useAuth();

    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Forgot password state
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSubmitting, setForgotSubmitting] = useState(false);
    const [forgotResult, setForgotResult] = useState<{ success: boolean; message: string } | null>(
        null,
    );

    // Check if Google sign-in failed via callback
    useEffect(() => {
        if (searchParams.get("googleError")) {
            setErrorMsg("Google sign-in could not be completed. Please try again.");
        }
    }, [searchParams]);

    // Redirect if authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (!user.isVerified) {
                router.replace(`/verify?email=${encodeURIComponent(user.email)}`);
            } else {
                router.replace("/dashboard");
            }
        }
    }, [isAuthenticated, user, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setSubmitting(true);

        try {
            if (mode === "signin") {
                const res = await login(email, password);
                if (res.success) {
                    if (user && !user.isVerified) {
                        router.push(`/verify?email=${encodeURIComponent(email)}`);
                    } else {
                        router.push("/dashboard");
                    }
                } else {
                    setErrorMsg(res.error || "Invalid email or password");
                }
            } else {
                if (!name.trim()) {
                    setErrorMsg("Please enter your name");
                    setSubmitting(false);
                    return;
                }
                const res = await signup(name.trim(), email, password);
                if (res.success) {
                    setSuccessMsg("Account created! Redirecting to verification...");
                    setTimeout(() => {
                        router.push(`/verify?email=${encodeURIComponent(email)}`);
                    }, 600);
                } else {
                    setErrorMsg(res.error || "Registration failed");
                }
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleForgotPassword(e: React.FormEvent) {
        e.preventDefault();
        if (!forgotEmail) return;
        setForgotSubmitting(true);
        setForgotResult(null);

        try {
            const res = await forgotPassword(forgotEmail);
            if (res.success) {
                setForgotResult({
                    success: true,
                    message: res.message || "Password reset link sent to your email.",
                });
            } else {
                setForgotResult({
                    success: false,
                    message: res.error || "Failed to send reset link.",
                });
            }
        } finally {
            setForgotSubmitting(false);
        }
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-void">
            {/* ═══════════════════════════════════════════════
             *  VIDEO BACKGROUND — Seamless Infinite Loop
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

                <div className="absolute inset-0 bg-void/50 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-r from-void/85 via-void/30 to-void/70 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-t from-void/60 via-transparent to-void/40 pointer-events-none" />
            </div>

            {/* ═══════════════════════════════════════════════
             *  CONTENT — Split Layout
             * ═══════════════════════════════════════════════ */}
            <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row items-center lg:items-center justify-between gap-8 lg:gap-12 px-6 md:px-12 lg:pl-16 lg:pr-12 xl:pl-20 xl:pr-16 py-12">
                {/* ─── LEFT SIDE: Spider-Man Branding ─── */}
                <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className="flex max-w-170 flex-col items-start lg:flex-1"
                >
                    <Link href="/" className="flex items-center gap-2 mb-6 group">
                        <span className="inline-block w-3 h-3 bg-flare rounded-xs animate-pulse" />
                        <span className="font-extrabold tracking-tighter text-xl lg:text-2xl leading-none uppercase font-mono text-off-white">
                            SCRAPEVERSE<span className="text-flare text-xs">®</span>
                        </span>
                    </Link>

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

                    <div className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-off-white/40">
                        <span className="inline-block h-2 w-2 rounded-full bg-flare animate-ping" />
                        NODE: EARTH-616 // MULTIVERSE ACCESS PROTOCOL
                    </div>
                </motion.div>

                {/* ─── RIGHT SIDE: Auth Card ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                    className="w-full max-w-100 lg:ml-auto lg:max-w-105 lg:shrink-0"
                >
                    <div className="bg-void/80 backdrop-blur-md border border-off-white/10 p-8 md:p-10 shadow-2xl">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-off-white/10 mb-6 font-mono text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("signin");
                                    setErrorMsg(null);
                                    setSuccessMsg(null);
                                }}
                                className={`flex-1 pb-3 font-bold uppercase tracking-wider transition-colors ${
                                    mode === "signin"
                                        ? "border-b-2 border-flare text-off-white"
                                        : "text-off-white/40 hover:text-off-white/70"
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("signup");
                                    setErrorMsg(null);
                                    setSuccessMsg(null);
                                }}
                                className={`flex-1 pb-3 font-bold uppercase tracking-wider transition-colors ${
                                    mode === "signup"
                                        ? "border-b-2 border-flare text-off-white"
                                        : "text-off-white/40 hover:text-off-white/70"
                                }`}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Error / Success Alerts */}
                        <AnimatePresence>
                            {errorMsg ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-4 bg-rose-500/15 border border-rose-500/40 p-3 text-xs font-mono text-rose-300 rounded"
                                >
                                    ⚠ {errorMsg}
                                </motion.div>
                            ) : null}

                            {successMsg ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-4 bg-emerald-500/15 border border-emerald-500/40 p-3 text-xs font-mono text-emerald-300 rounded"
                                >
                                    ✓ {successMsg}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* Auth Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {mode === "signup" ? (
                                <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                        <span className="font-light mr-1">/</span> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Miles Morales"
                                        required
                                        className="w-full bg-off-white/5 border border-off-white/15 text-off-white placeholder-off-white/30 px-4 py-3 text-sm font-mono outline-none focus:border-flare/60 transition-colors duration-300"
                                    />
                                </div>
                            ) : null}

                            {/* Email field */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                    <span className="font-light mr-1">/</span> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="miles@scrapeverse.dev"
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
                                        minLength={6}
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

                            {/* Forgot Password trigger */}
                            {mode === "signin" ? (
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <label className="flex items-center gap-2 cursor-pointer text-off-white/60 hover:text-off-white transition-colors">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="w-3.5 h-3.5 accent-flare cursor-pointer"
                                        />
                                        Remember session
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setForgotOpen(true)}
                                        className="text-flare/80 hover:text-flare transition-colors uppercase tracking-wider cursor-pointer"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                            ) : null}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-flare text-off-white py-3.5 text-sm font-black uppercase tracking-wider hover:bg-flare/90 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group mt-2 disabled:opacity-50"
                            >
                                <span>
                                    {submitting
                                        ? "VERIFYING IDENTITY..."
                                        : mode === "signin"
                                          ? "ACCESS SCRAPE-VERSE"
                                          : "INITIALIZE IDENTITY"}
                                </span>
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

                        {/* Google OAuth button */}
                        <GoogleSignInButton />

                        {/* Switch Mode Prompt */}
                        <p className="mt-6 text-center text-xs font-mono text-off-white/40">
                            {mode === "signin" ? (
                                <>
                                    New to ScrapeVerse?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("signup");
                                            setErrorMsg(null);
                                            setSuccessMsg(null);
                                        }}
                                        className="text-flare hover:underline uppercase tracking-wider cursor-pointer"
                                    >
                                        Create Account
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have credentials?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("signin");
                                            setErrorMsg(null);
                                            setSuccessMsg(null);
                                        }}
                                        className="text-flare hover:underline uppercase tracking-wider cursor-pointer"
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════
             *  Forgot Password Modal
             * ═══════════════════════════════════════════════ */}
            <AnimatePresence>
                {forgotOpen ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="w-full max-w-md bg-void border border-off-white/15 p-6 md:p-8 text-off-white space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase font-mono">
                                    Reset Password
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForgotOpen(false);
                                        setForgotResult(null);
                                    }}
                                    className="text-off-white/50 hover:text-off-white text-lg cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-xs font-mono text-off-white/60">
                                Enter your account email to receive a password reset token.
                            </p>

                            {forgotResult ? (
                                <div
                                    className={`p-3 rounded text-xs font-mono ${
                                        forgotResult.success
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    }`}
                                >
                                    {forgotResult.message}
                                </div>
                            ) : null}

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="your-email@example.com"
                                    required
                                    className="w-full bg-off-white/5 border border-off-white/15 px-3 py-2 text-sm font-mono text-off-white outline-none focus:border-flare/60"
                                />

                                <button
                                    type="submit"
                                    disabled={forgotSubmitting}
                                    className="w-full bg-flare text-off-white py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-flare/90 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {forgotSubmitting ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-off-white/30">
                <span>© SCRAPEVERSE 2026 // INTO THE SCRAPE-VERSE</span>
                <span className="hidden md:inline">BRIGHT DATA × WEMAKEDEVS HACKATHON</span>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-void" />}>
            <LoginContent />
        </Suspense>
    );
}
