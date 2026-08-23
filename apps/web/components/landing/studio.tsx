"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * "The Scrape Engine" section — maps to reference site's "The Studio".
 *
 * Entrance animation:
 * - Starts off-screen at y=50vh, rotated 7deg, translateX=-10%
 * - As it scrolls into view, straightens to 0deg and y=0
 * - origin-[0%_50%] on desktop, origin-[0%_0%] on mobile
 */

const CAPABILITIES = [
    "AST SELECTOR REWRITING",
    "BRIGHT DATA WEB UNLOCKER",
    "AUTONOMOUS AI HEALING AGENT",
    "RESIDENTIAL PROXY ROTATION",
    "HEADLESS BROWSER CLUSTER",
    "DYNAMIC JAVASCRIPT RENDERING",
    "AUTOMATED CAPTCHA BYPASS",
    "SCHEMA DRIFT CORRECTION",
];

const SPECS = [
    "99.98% SELECTOR UPTIME",
    "< 45MS HEALING LATENCY",
    "100% UNBLOCKING SUCCESS",
    "ZERO-CONFIG SDK SETUP",
    "AI AGENT CLI INTEGRATION",
    "ZOD & TYPESCRIPT EXPORT",
    "REAL-TIME WEBHOOK ALERTS",
    "MULTI-REGION PROXY POOL",
    "HEADLESS PLAYWRIGHT READY",
    "BUILT FOR WEMAKEDEVS HACKATHON",
];

export function Studio() {
    const ref = useRef<HTMLDivElement>(null);
    const img1Ref = useRef<HTMLDivElement>(null);
    const img2Ref = useRef<HTMLDivElement>(null);

    // Entrance scroll animation — matches reference "The Studio" module (9442)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["50vh end", "100vh end"],
    });

    const studioY = useTransform(scrollYProgress, [0, 1], ["50vh", "0vh"]);
    const studioRotate = useTransform(scrollYProgress, [0, 0.3], ["7deg", "0deg"]);
    const studioX = useTransform(scrollYProgress, [0, 0.3], ["-10%", "0%"]);

    // Image parallax within studio
    const { scrollYProgress: imgProgress } = useScroll({
        target: ref,
        offset: ["start end", "0.8 end"],
    });

    const img1X = useTransform(imgProgress, [0, 1], ["25%", "45%"]);
    const img1Y = useTransform(imgProgress, [0, 1], ["0%", "-10%"]);
    const img1Rotate = useTransform(imgProgress, [0, 1], ["8deg", "4.89deg"]);

    const img2X = useTransform(imgProgress, [0, 1], ["-45%", "0%"]);
    const img2Y = useTransform(imgProgress, [0, 1], ["20%", "0%"]);
    const img2Rotate = useTransform(imgProgress, [0, 1], ["4.89deg", "0deg"]);

    return (
        <div ref={ref} className="pointer-events-none relative z-40">
            <motion.div
                style={{ x: studioX, y: studioY, rotate: studioRotate }}
                className="pointer-events-auto origin-[0%_0%] overflow-hidden bg-off-white max-lg:pt-2 lg:origin-[0%_50%]"
            >
                {/* Section Header */}
                <div className="px-3 md:px-6 lg:px-[0.46vw] lg:pt-[0.46vw]">
                    <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight md:text-sm lg:text-[0.69vw] text-flare">
                        <span className="font-light mr-1">/</span> MULTIVERSE DATA ARCHITECTURE
                    </span>
                    <h2 className="pt-[5px] pr-5 text-[72px] leading-[0.8] font-black tracking-[-0.04em] lg:text-[12.15vw] text-void uppercase">
                        The Scrape Engine
                    </h2>
                </div>

                {/* Two-column layout */}
                <div className="mt-[158px] flex flex-col lg:mt-[18.5vw] lg:flex-row lg:px-[0.46vw]">
                    {/* Left: Layered Spider-Man posters with parallax */}
                    <div className="relative min-h-[360px] sm:min-h-[480px] md:min-h-[600px] lg:flex-[0.55] lg:min-h-[700px]">
                        <motion.div
                            ref={img1Ref}
                            style={{ x: img1X, y: img1Y, rotate: img1Rotate }}
                            className="max-w-[85%] md:max-w-3/5 border-2 border-void shadow-2xl rounded-xs overflow-hidden bg-void"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt="Spider-Verse Society"
                                src="/video/clip-society-poster.jpg"
                                className="h-auto w-full grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                                loading="lazy"
                            />
                        </motion.div>
                        <motion.div
                            ref={img2Ref}
                            style={{ x: img2X, y: img2Y, rotate: img2Rotate }}
                            className="absolute top-0 w-full max-w-[85%] md:max-w-3/5 border-2 border-flare shadow-2xl rounded-xs overflow-hidden bg-void"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt="Spider-Verse Neon Scraper"
                                src="/video/clip-neon-poster.jpg"
                                className="h-auto w-full grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                                loading="lazy"
                            />
                        </motion.div>
                    </div>

                    {/* Right: The Lowdown & Capabilities */}
                    <div className="max-lg:px-3 max-lg:pt-20 lg:flex-[0.45]">
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight md:text-sm lg:text-[0.69vw] text-flare mb-4 lg:mb-[0.93vw]">
                            <span className="font-light mr-1">/</span> The Lowdown
                        </span>
                        <p className="mb-16 text-[24px] leading-[1.1] font-[470] tracking-[-0.01em] lg:mb-[3.7vw] lg:max-w-[37.27vw] lg:text-[1.62vw] lg:font-normal text-void">
                            ScrapVerse eliminates selector rot forever. By marrying{" "}
                            <strong className="font-bold underline decoration-flare">
                                Bright Data&apos;s Web Unlocker
                            </strong>{" "}
                            with autonomous DOM vision agents, your data pipelines self-repair
                            whenever target sites push layout redesigns.
                        </p>

                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight md:text-sm lg:text-[0.69vw] text-flare mb-4 lg:mb-[0.93vw]">
                            <span className="font-light mr-1">/</span> Capabilities &amp; Benchmarks
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base leading-[1.1] font-mono font-bold tracking-tight lg:text-[0.93vw]">
                            <div className="space-y-[0.12vw]">
                                {CAPABILITIES.map((cap) => (
                                    <a
                                        key={cap}
                                        href="#"
                                        className="block w-fit py-0.5 hover:text-flare transition-colors text-void"
                                    >
                                        ▸ {cap}
                                    </a>
                                ))}
                            </div>
                            <div className="space-y-[0.12vw] text-void/70">
                                {SPECS.map((spec) => (
                                    <div key={spec} className="py-0.5">
                                        {spec}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Spider-Verse Quote */}
                        <div className="mt-16 space-y-[3px] lg:mt-[3.7vw] lg:space-y-[0.35vw]">
                            <p className="text-[32px] leading-[0.85] font-black tracking-[-0.03em] lg:text-[2.31vw] text-void uppercase">
                                &ldquo;WITH GREAT DATA COMES ZERO MAINTENANCE.&rdquo;
                            </p>
                            <p className="pl-[15px] text-xs font-mono font-bold tracking-wider lg:pl-[0.87vw] lg:text-[0.69vw] text-flare">
                                – SPIDER-MAN • SCRAPEVERSE ARCHITECT
                            </p>
                        </div>
                    </div>
                </div>

                {/* Partners section flows directly below */}
                <PartnersSection />
            </motion.div>
        </div>
    );
}

/* ─── Partners / Ecosystem ─── */
function PartnersSection() {
    const partners = [
        "Bright Data",
        "Playwright",
        "Cheerio",
        "LangChain",
        "Next.js",
        "Cursor",
        "Claude",
        "Antigravity",
        "WeMakeDevs",
        "Puppeteer",
        "Zod",
        "TypeScript",
    ];

    return (
        <section className="bg-off-white pt-[160px] lg:pt-[19.05vw]">
            <div className="px-3 md:px-6 lg:px-[0.46vw]">
                <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight md:text-sm lg:text-[0.69vw] text-void">
                    <span className="font-light mr-1">/</span> Clients + Partners
                </span>
                <div className="flex cursor-default items-center flex-wrap pt-4 pb-2 text-[32px] leading-none font-[470] tracking-[-0.01em] lg:pt-[0.69vw] lg:pb-[0.58vw] lg:text-[3.7vw] lg:leading-[0.95] text-void">
                    {partners.map((name, i) => (
                        <div key={name} className="flex items-center">
                            {i > 0 && <span className="font-light text-void/40 mx-1">/</span>}
                            <span className="hover:text-flare transition-colors cursor-pointer">
                                {name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Scraper Player */}
            <div className="mt-8 md:mt-16 px-3 md:px-6 lg:px-[0.46vw]">
                <div className="relative aspect-video w-full overflow-hidden bg-void border-2 border-void rounded-xs">
                    <video
                        src="/video/clip-swing.mp4"
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        playsInline
                        muted
                    />
                    <div className="absolute bottom-3 left-3 bg-void/80 backdrop-blur-xs text-off-white px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest border border-flare">
                        ● SCRAPER DEMO REEL — LIVE
                    </div>
                </div>
            </div>
        </section>
    );
}
