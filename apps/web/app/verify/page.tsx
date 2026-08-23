"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "~/providers/auth-provider";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, verifyOTP, resendOTP, isAuthenticated } = useAuth();

    const paramEmail = searchParams.get("email") || "";
    const [email, setEmail] = useState(paramEmail || user?.email || "");
    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number>(0);

    // Sync email from auth user if available
    useEffect(() => {
        if (user?.email && !email) {
            setEmail(user.email);
        }
    }, [user, email]);

    // If user is already authenticated and verified, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated && user?.isVerified) {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, user, router]);

    // Cooldown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim() || !otp.trim()) {
            setErrorMsg("Please enter both email and verification code.");
            return;
        }

        setErrorMsg(null);
        setSuccessMsg(null);
        setSubmitting(true);

        try {
            const res = await verifyOTP(email.trim(), otp.trim());
            if (res.success) {
                setSuccessMsg("Identity verified! Entering the Scrape-Verse...");
                setTimeout(() => {
                    router.push("/dashboard");
                }, 700);
            } else {
                setErrorMsg(res.error || "Verification failed. Please check the code.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResend() {
        if (!email.trim() || countdown > 0 || resending) return;
        setErrorMsg(null);
        setResending(true);

        try {
            const res = await resendOTP(email.trim());
            if (res.success) {
                setSuccessMsg(res.message || "A new verification code has been sent.");
                setCountdown(60);
            } else {
                setErrorMsg(res.error || "Failed to resend code.");
            }
        } finally {
            setResending(false);
        }
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-void">
            {/* Background Video Loop */}
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

            <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 px-6 md:px-12 lg:pl-16 lg:pr-12 xl:pl-20 xl:pr-16 py-12">
                {/* Left Side: Spider-Man Branding */}
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
                        Verify
                        <br />
                        <span className="text-flare">your</span>
                        <br />
                        access
                    </h1>

                    <p className="max-w-110 font-mono text-xs leading-relaxed text-off-white/70 sm:text-sm md:text-base">
                        {"// NODE VERIFICATION PROTOCOL INITIATED."}
                        <br />
                        {"// CONFIRM 6-DIGIT MULTIVERSE ACCESS CODE TO PROCEED."}
                    </p>

                    <div className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-off-white/40">
                        <span className="inline-block h-2 w-2 rounded-full bg-flare animate-ping" />
                        STATUS: AWAITING AUTHORIZATION HANDSHAKE
                    </div>
                </motion.div>

                {/* Right Side: OTP Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                    className="w-full max-w-100 lg:ml-auto lg:max-w-105 lg:shrink-0"
                >
                    <div className="bg-void/80 backdrop-blur-md border border-off-white/10 p-8 md:p-10 shadow-2xl">
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-off-white mb-2">
                                Verify OTP
                            </h2>
                            <p className="text-xs font-mono uppercase tracking-wider text-off-white/50">
                                {"// DISPATCHED TO: "}
                                <span className="text-off-white font-bold">
                                    {email || "YOUR EMAIL"}
                                </span>
                            </p>
                        </div>

                        {/* Alerts */}
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

                        {/* Verification Form */}
                        <form onSubmit={handleVerify} className="flex flex-col gap-4">
                            {/* Email field if not set */}
                            {!user?.email ? (
                                <div>
                                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                        <span className="font-light mr-1">/</span> Account Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="miles@scrapeverse.dev"
                                        required
                                        className="w-full bg-off-white/5 border border-off-white/15 text-off-white placeholder-off-white/30 px-4 py-2.5 text-sm font-mono outline-none focus:border-flare/60 transition-colors"
                                    />
                                </div>
                            ) : null}

                            {/* OTP Code field */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-off-white/60 mb-2">
                                    <span className="font-light mr-1">/</span> 6-Digit Access Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
                                    placeholder="• • • • • •"
                                    required
                                    maxLength={10}
                                    autoFocus
                                    className="w-full bg-off-white/5 border border-off-white/15 text-off-white placeholder-off-white/30 px-4 py-3.5 text-center text-xl tracking-[0.3em] font-mono font-black outline-none focus:border-flare/60 transition-colors"
                                />
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={submitting || !otp.trim()}
                                className="w-full bg-flare text-off-white py-3.5 text-sm font-black uppercase tracking-wider hover:bg-flare/90 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group mt-2 disabled:opacity-50"
                            >
                                <span>
                                    {submitting
                                        ? "AUTHENTICATING..."
                                        : "VERIFY & ENTER SCRAPE-VERSE"}
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

                        {/* Resend code option */}
                        <div className="mt-6 flex items-center justify-between text-xs font-mono border-t border-off-white/10 pt-4">
                            <span className="text-off-white/40">Didn't receive code?</span>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={countdown > 0 || resending}
                                className="text-flare hover:underline uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {resending
                                    ? "Sending..."
                                    : countdown > 0
                                      ? `Resend in ${countdown}s`
                                      : "Resend Code"}
                            </button>
                        </div>

                        {/* Return to Login */}
                        <div className="mt-4 text-center">
                            <Link
                                href="/login"
                                className="text-[11px] font-mono text-off-white/40 hover:text-off-white uppercase tracking-wider transition-colors"
                            >
                                ← Return to Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-off-white/30">
                <span>© SCRAPEVERSE 2026 // INTO THE SCRAPE-VERSE</span>
                <span className="hidden md:inline">BRIGHT DATA × WEMAKEDEVS HACKATHON</span>
            </div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-void" />}>
            <VerifyContent />
        </Suspense>
    );
}
