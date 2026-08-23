"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Hero section — exact replica of The Line Studio hero mechanics:
 *
 * Structure:
 * 1. Sticky full-viewport video (stays fixed while user scrolls past)
 * 2. Absolute-positioned red overlay + brand wordmark that ROTATE from
 *    0deg → -15deg (origin-bottom-left) and translateX 0% → -10% as user scrolls
 * 3. pb-[100vh] on the sticky wrapper creates the "scroll runway" so the
 *    diagonal rotation plays out over one full viewport of scrolling
 */
export function Hero() {
    const wrapRef = useRef<HTMLDivElement>(null);

    // Track scroll progress across the entire hero wrapper
    const { scrollYProgress } = useScroll({
        target: wrapRef,
        offset: ["start start", "end start"],
    });

    // Red overlay + wordmark rotate & translate as user scrolls
    const overlayX = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
    const overlayRotate = useTransform(scrollYProgress, [0, 1], ["0deg", "-15deg"]);

    return (
        <div ref={wrapRef} className="relative max-w-screen overflow-x-clip lg:mb-[25vh]">
            {/* ── 1. Sticky full-screen Spider-Verse video ── */}
            <div className="sticky top-0 z-10 pb-[100vh]">
                <div className="h-screen">
                    <video
                        src="/video/hero-leap.mp4"
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        playsInline
                        muted
                    />
                </div>
            </div>

            {/* ── 2a. Red duotone overlay — rotates diagonally on scroll ── */}
            <motion.div
                style={{ x: overlayX, rotate: overlayRotate }}
                className="absolute inset-x-0 top-0 z-20 h-screen origin-bottom-left bg-[#ff0000] [mix-blend-mode:multiply]"
            />

            {/* ── 2b. Brand wordmark — same rotation as red overlay ── */}
            <motion.div
                style={{ x: overlayX, rotate: overlayRotate }}
                className="absolute inset-0 z-20 flex h-screen origin-bottom-left flex-col justify-end px-2 pb-2 lg:px-[1.27vw] lg:pb-[1.27vw]"
            >
                {/* Top left: hackathon tagline */}
                <div className="absolute top-16 md:top-20 left-4 md:left-8 lg:left-[1.27vw] max-w-4xl pointer-events-auto">
                    <span className="inline-block bg-void text-off-white px-2 py-0.5 text-xs md:text-sm font-mono uppercase tracking-widest mb-3 border border-off-white/20">
                        {"// HACKATHON PROTOCOL 2026"}
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.8vw] leading-[0.95] font-black uppercase tracking-[-0.04em] text-off-white drop-shadow-md whitespace-nowrap">
                        INTO THE{" "}
                        <span className="text-void bg-off-white px-1.5 py-0.5 ml-1">
                            SCRAPE-VERSE
                        </span>
                    </h2>
                    <p className="mt-3 text-sm md:text-base lg:text-[1vw] leading-snug font-medium text-off-white/90 max-w-2xl">
                        You write a scraper, it works, and a week later the site changes its layout
                        and everything breaks quietly. Build one that repairs itself instead.
                    </p>
                </div>

                {/* Bottom giant brand wordmark — single continuous text, no clipping */}
                <div className="w-full select-none pointer-events-none overflow-visible">
                    <h1 className="text-off-white font-black tracking-[-0.05em] leading-[0.85] text-[11vw] lg:text-[12vw] uppercase">
                        SCRAPEVERSE
                        <sup className="text-xs md:text-lg lg:text-[1.2vw] font-mono tracking-normal align-super">
                            ®
                        </sup>
                    </h1>
                </div>
            </motion.div>

            {/* ── 3. "Highlights" angled transition banner ── */}
            <HighlightsBanner />

            {/* ── 4. Tilted project cards ── */}
            <div className="relative z-30 flex flex-col gap-[5vh] overflow-x-clip lg:gap-[15vh]">
                {FEATURES.map((feat) => (
                    <ProjectCard key={feat.title} {...feat} />
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
 * Highlights Banner — the signature angled off-white sheet that sweeps
 * over the hero. Starts at rotate(7deg) + translateX(-10%), straightens
 * to 0 at 30% progress, then tilts slightly negative by scroll-end.
 * ─────────────────────────────────────────────────────────────────── */
function HighlightsBanner() {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const rotate = useTransform(
        scrollYProgress,
        [0, 0.3, 0.55, 1],
        ["7deg", "0deg", "0deg", "-3deg"],
    );
    const x = useTransform(scrollYProgress, [0, 0.3, 0.55, 1], ["-10%", "0%", "0%", "-8%"]);
    const y = useTransform(scrollYProgress, [0.55, 1], ["0%", "3%"]);

    return (
        <div ref={ref} className="relative z-20 max-h-[25vh]">
            <motion.div
                style={{ x, rotate, y }}
                className="h-screen origin-[0%_0%] bg-off-white px-2 pt-2 lg:origin-[0%_50%] lg:px-[0.46vw] lg:pt-[0.46vw]"
            >
                <div className="px-2 lg:px-[0.46vw] lg:pt-[0.46vw]">
                    <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight md:text-sm lg:text-[0.69vw] text-flare">
                        <span className="font-light mr-1">/</span> AUTONOMOUS WEB CRAWLER ENGINE
                    </span>
                    <h1 className="pt-[5px] pr-5 text-[72px] leading-[0.8] font-black tracking-[-0.04em] lg:text-[12.15vw] text-void uppercase">
                        Self-Healing Scrapers
                    </h1>
                </div>
            </motion.div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
 * Project Card — each card slides in rotated at 15°, straightens at
 * mid-scroll, then rotates back out. Exactly matches reference.
 * ─────────────────────────────────────────────────────────────────── */
const FEATURES = [
    {
        title: "Spider-Sense DOM Detection",
        tagline: "AUTONOMOUS SELECTOR MUTATION & HEALING",
        hudCode: "XPATH: //article/div[contains(@class,'price')]",
        hudStatus: "STATUS: SELECTOR HEALED (99.8% ACCURACY)",
        video: "/video/clip-swing.mp4",
    },
    {
        title: "Agentic Scraper Studio",
        tagline: "RUN FROM YOUR CODING AGENT VIA SDK & CLI",
        hudCode: "AGENT: CLAUDE-CURSOR-ANTIGRAVITY // SDK READY",
        hudStatus: "PROXIES: BRIGHT DATA RESIDENTIAL POOL",
        video: "/video/clip-gwen.mp4",
    },
    {
        title: "Multiverse Schema Pipeline",
        tagline: "ZERO-MAINTENANCE STRUCTURED DATA",
        hudCode: "SCHEMA: ZOD_VALIDATED // JSON EXPORT",
        hudStatus: "MUTATION: ZERO HUMAN INTERVENTION",
        video: "/video/clip-tom.mp4",
    },
] as const;

function ProjectCard({ title, tagline, hudCode, hudStatus, video }: (typeof FEATURES)[number]) {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["50vh end", "50vh start"],
    });

    // Card entrance → rest → exit transforms
    const cardY = useTransform(scrollYProgress, [0, 0.5, 0.6, 1], ["55vh", "0vh", "10vh", "-30vh"]);
    const cardX = useTransform(scrollYProgress, [0, 0.5, 0.6, 1], ["15vw", "0vw", "0vw", "-15vw"]);
    const cardRotate = useTransform(
        scrollYProgress,
        [0, 0.5, 0.6, 1],
        ["15deg", "0deg", "0deg", "-7deg"],
    );

    // Inner video has a counter-rotation for parallax effect
    const innerRotate = useTransform(
        scrollYProgress,
        [0, 0.5, 0.6, 1],
        ["15deg", "2deg", "0deg", "4deg"],
    );
    const innerX = useTransform(scrollYProgress, [0, 0.5, 0.6, 1], ["5vw", "2vw", "0vw", "4vw"]);
    const innerY = useTransform(scrollYProgress, [0, 0.5, 0.6, 1], ["25vh", "16vh", "0vh", "35vh"]);

    return (
        <div ref={ref} className="relative z-10 max-h-[50vh]">
            <motion.div
                style={{ x: cardX, y: cardY, rotate: cardRotate }}
                className="flex h-screen origin-bottom-right flex-col gap-[0.46vw] bg-[#dfdfe3f2] lg:origin-[0%_25%]"
            >
                {/* Card header */}
                <div className="flex items-end justify-between px-2 max-lg:flex-[0.25] max-lg:pb-5 lg:px-[0.46vw] lg:pt-[2.31vw] lg:pb-[0.49vw]">
                    <div className="max-w-3/5">
                        <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-flare block mb-1">
                            {"// "}
                            {tagline}
                        </span>
                        <h1 className="text-[34px] leading-[0.8] font-black tracking-[-0.04em] text-void lg:text-[5.56vw] lg:font-[470] uppercase">
                            {title}
                        </h1>
                    </div>
                </div>

                {/* Viewport with video */}
                <div className="relative flex-[0.75] lg:flex-1">
                    {/* HUD overlay frame */}
                    <div className="absolute inset-0 mx-2 border-[1.5px] border-dashed border-void p-[42px] lg:mx-[0.46vw] lg:p-[3.47vw] pointer-events-none z-10">
                        <span className="absolute left-1 lg:left-[0.46vw] top-0.5 lg:top-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-void">
                            Overscan
                        </span>
                        <span className="absolute right-1 lg:right-[0.46vw] top-0.5 lg:top-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-void">
                            {hudCode.slice(0, 15)}
                        </span>
                        <div className="relative h-full w-full border-[1.5px] border-void px-[78px] py-[68px] lg:px-[2.2vw] lg:py-[1.62vw]">
                            <span className="absolute left-1 lg:left-[0.46vw] top-0.5 lg:top-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-void">
                                [ DOM SCANNER ]
                            </span>
                            <span className="absolute right-1 lg:right-[0.46vw] top-0.5 lg:top-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-flare">
                                {hudStatus}
                            </span>
                            <span className="absolute right-1 lg:right-[0.46vw] bottom-0.5 lg:bottom-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-void">
                                100%
                            </span>
                            <div className="relative h-full w-full border-[1.5px] border-dashed border-void">
                                <span className="absolute left-1 lg:left-[0.46vw] top-0.5 lg:top-[0.23vw] flex items-center text-xs font-mono font-bold uppercase tracking-tight lg:text-[0.69vw] text-void">
                                    Action safe
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Video with parallax counter-rotation */}
                    <motion.div
                        style={{ x: innerX, y: innerY, rotate: innerRotate }}
                        className="h-full w-full"
                    >
                        <video
                            src={video}
                            className="h-full w-full object-cover"
                            autoPlay
                            loop
                            playsInline
                            muted
                        />
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
