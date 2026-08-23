"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ContactCTA — Scroll-animated white sheet that tilts diagonally to
 * reveal the sticky red footer underneath.
 *
 * Direct port of The Line Studio's ContactDesktop + CallToAction + ClosingLogoBlock.
 * Contains ONLY:
 * 1. StartScrapingCTA (FlickerText + sliding arrows)
 * 2. ClosingLogoBlock (Massive full-width SCRAPVERSE® wordmark)
 *
 * Desktop: rotate 0→-12deg, translateX 0→-14%, origin-[0%_50%]
 * Mobile: static white sheet
 */
export function ContactCTA() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["1 1", "1 0"],
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
    const rotate = useTransform(scrollYProgress, [0, 1], ["0deg", "-12deg"]);

    return (
        <section className="relative z-20">
            {/* Mobile: static white sheet */}
            <div className="lg:hidden bg-off-white text-void">
                <StartScrapingCTA />
                <ClosingLogoBlock />
            </div>

            {/* Desktop: scroll-animated diagonal tilt revealing red footer */}
            <motion.div
                ref={ref}
                style={{ x, rotate }}
                className="hidden lg:block origin-[0%_50%] bg-off-white text-void"
            >
                <StartScrapingCTA />
                <ClosingLogoBlock />
            </motion.div>
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * "Start Scraping" CTA
 * - Left arrow slides IN from -100% on hover
 * - Right arrow slides OUT to 100% on hover
 * - FlickerText: each character blinks with staggered timing
 * - Underline shrinks from 100% to 0% on hover
 * ──────────────────────────────────────────────────────────────── */
function StartScrapingCTA() {
    return (
        <motion.div
            initial="initial"
            whileHover="whileHover"
            className="relative flex cursor-pointer items-center justify-between pt-[178px] px-2 lg:px-[0.46296vw] lg:pt-[18.51852vw]"
        >
            {/* Left arrow — slides IN from left */}
            <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 22 19"
                fill="#0b0b0b"
                className="absolute left-0 lg:left-[0.5787vw] h-[50px] w-[58px] lg:h-[8.96991vw] lg:w-[10.70602vw]"
                variants={{
                    initial: { x: "-100%" },
                    whileHover: { x: "0%" },
                }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
                <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
            </motion.svg>

            {/* FlickerText "Start Scraping" */}
            <FlickerText>Start Scraping</FlickerText>

            {/* Right arrow — slides OUT to right */}
            <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 22 19"
                fill="#0b0b0b"
                className="right-0 h-[50px] w-[58px] lg:left-[0.5787vw] lg:h-[8.96991vw] lg:w-[10.70602vw] shrink-0"
                variants={{
                    initial: { x: "0%" },
                    whileHover: { x: "100%" },
                }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
                <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
            </motion.svg>
        </motion.div>
    );
}

/* ── FlickerText — character-by-character glitch/blink animation ── */
function FlickerText({ children }: { children: string }) {
    const [mouseIn, setMouseIn] = useState(false);

    const x = 0.08;
    const len = children.length;
    const totalDur = (len - 1) * (x / 2) + 2 * x;

    return (
        <>
            <style>{`
        .cta-flicker-text { --cta-x: 58px; }
        @media (min-width: 1024px) { .cta-flicker-text { --cta-x: 12.71vw; } }
      `}</style>
            <div
                className="w-full"
                onMouseEnter={() => setMouseIn(true)}
                onMouseLeave={() => setMouseIn(false)}
            >
                <div className="relative w-fit">
                    <motion.div
                        className="cta-flicker-text text-[52px] sm:text-[72px] md:text-[96px] leading-[0.95] font-black tracking-[-0.04em] text-void lg:indent-[-0.9vw] lg:text-[12.15vw] uppercase"
                        variants={{
                            initial: {
                                x: "0px",
                                transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
                            },
                            whileHover: {
                                x: "var(--cta-x)",
                                transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] },
                            },
                        }}
                    >
                        {children.split("").map((letter, i) => (
                            <motion.span
                                key={`fl-${i}`}
                                initial="rest"
                                animate={mouseIn ? "active" : "rest"}
                                variants={{
                                    rest: {
                                        opacity: [0, 1, 0, 0, 1, 1],
                                        transition: {
                                            duration: totalDur,
                                            times: [
                                                0,
                                                i * (x / 2),
                                                i * (x / 2) + (2 * x) / 5,
                                                i * (x / 2) + (2 * x) / 5 + (6 / 5) * x,
                                                i * (x / 2) + (4 * x) / 5 + (6 / 5) * x,
                                                totalDur,
                                            ].map((t) => t / totalDur),
                                        },
                                    },
                                    active: {
                                        opacity: [1, 1, 0, 0, 1, 1],
                                        transition: {
                                            duration: totalDur,
                                            times: [
                                                0,
                                                i * (x / 2),
                                                i * (x / 2) + x / 2,
                                                i * (x / 2) + x / 2 + x,
                                                i * (x / 2) + 2 * x,
                                                totalDur,
                                            ].map((t) => t / totalDur),
                                            repeat: 1,
                                        },
                                    },
                                }}
                                className="last:tracking-wider"
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* Animated underline — shrinks from full to 0 on hover */}
                    <motion.div
                        className="absolute bottom-0 h-[2px] bg-void"
                        variants={{
                            whileHover: { width: "0%", right: "0%", left: "auto" },
                            initial: { width: "100%", left: "0px", right: "auto" },
                        }}
                        transition={{
                            left: { duration: 0 },
                            right: { duration: 0 },
                            default: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
                        }}
                    />
                </div>
            </div>
        </>
    );
}

/* ────────────────────────────────────────────────────────────────────
 * ClosingLogoBlock — Giant SCRAPVERSE® Wordmark
 * Exact port of The Line Studio's ClosingLogoBlock:
 * pt-[250px] pb-2 lg:px-[0.46296vw] lg:pt-[17.36111vw] lg:pb-[0.46296vw]
 * Spans full width edge-to-edge with the ® symbol in top corner.
 * ──────────────────────────────────────────────────────────────── */
function ClosingLogoBlock() {
    return (
        <div className="px-2 pt-[250px] pb-2 lg:px-[0.46296vw] lg:pt-[17.36111vw] lg:pb-[0.46296vw] select-none">
            <svg
                viewBox="0 0 1684 380"
                className="h-auto w-full overflow-visible"
                aria-label="SCRAPVERSE®"
            >
                <text
                    x="48%"
                    y="76%"
                    textAnchor="middle"
                    className="font-black fill-void select-none"
                    style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "230px",
                        fontWeight: 900,
                        letterSpacing: "-0.05em",
                    }}
                >
                    SCRAPE<tspan className="fill-flare">VERSE</tspan>
                </text>
                <text
                    x="97%"
                    y="28%"
                    textAnchor="middle"
                    className="font-black fill-void select-none"
                    style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "64px",
                        fontWeight: 900,
                    }}
                >
                    ®
                </text>
            </svg>
        </div>
    );
}
