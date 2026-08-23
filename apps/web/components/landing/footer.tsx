"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";

const BUILD_LINKS = [
    "WeMakeDevs",
    "Bright Data",
    "Scraper Studio",
    "Self-Healing Engine",
    "Multi-Agent SDK",
];

const SOCIAL_LINKS = [
    { name: "YouTube", href: "#" },
    { name: "Instagram", href: "#" },
    { name: "Discord", href: "#" },
    { name: "X", href: "#" },
    { name: "GitHub", href: "#" },
    { name: "LinkedIn", href: "#" },
];

const NAV_ITEMS = [
    { label: "Home", href: "#" },
    { label: "Scrapers", href: "#scrapers" },
    { label: "Engine", href: "#engine" },
    { label: "Agents", href: "#agents" },
    { label: "Docs", href: "#dispatches" },
    { label: "Terminal", href: "#terminal" },
];

/**
 * Footer — Sticky footer revealed underneath when ContactCTA tilts.
 *
 * Design:
 * - FULL Spider-Man NYC skyline artwork covers the entire background
 * - Crimson red blend layer + subtle noir gradients
 * - Text content (/ REACH OUT, / BUILD, / CONNECT, / NAVIGATE, Newsletter, Copyright)
 *   sits directly on top with maximum readability
 * - HUD badge stamp in the background
 */
export function Footer() {
    const [email, setEmail] = useState("");
    const [placeholder, setPlaceholder] = useState("Newsletter");
    const [copied, setCopied] = useState(false);
    const controlInterval = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleFocus = () => {
        const target = "Enter email";
        let i = 0;
        controlInterval.current = setInterval(() => {
            setPlaceholder(target.slice(0, i));
            i++;
            if (i > target.length) clearInterval(controlInterval.current);
        }, 100);
    };

    const handleChange = () => {
        clearInterval(controlInterval.current);
        setPlaceholder("Enter email");
    };

    const handleBlur = () => {
        clearInterval(controlInterval.current);
        setPlaceholder("Newsletter");
    };

    const copyCli = () => {
        navigator.clipboard.writeText("npx SCRAPEVERSE@latest");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => () => clearInterval(controlInterval.current), []);

    return (
        <div className="bottom-0 z-0 min-h-screen px-3 md:px-6 lg:px-[0.46vw] pt-8 lg:pt-[2.5vw] pb-4 text-off-white selection:bg-off-white selection:text-flare relative overflow-hidden flex flex-col justify-end gap-8 lg:gap-[4vw]">
            {/* ═══════════════════════════════════════════════════════
             *  FULL SPIDER-MAN SKYLINE ARTWORK BACKGROUND
             *  Covers entire footer with red duotone blend
             * ═══════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 -z-10 h-full w-full pointer-events-none overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/spider-skyline.jpg"
                    alt="Spider-Man over New York City"
                    className="h-full w-full object-cover object-center contrast-125 brightness-100"
                    loading="lazy"
                />
                {/* Crimson red multiply overlay */}
                <div className="absolute inset-0 bg-flare mix-blend-multiply opacity-85" />
                {/* Cinematic gradient vignette for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/30 to-void/50 pointer-events-none" />

                {/* HUD Stamp Badge in background */}
                <div className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-void/80 backdrop-blur-xs text-off-white/80 px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-flare/50 hidden md:block">
                    {"// SPIDER-MAN • NEW YORK PROTOCOL // EARTH-616"}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
             *  MAIN DIRECTORY GRID (Desktop: 9-col, Mobile: stacked)
             * ═══════════════════════════════════════════════════════ */}
            <div className="relative z-20 lg:grid lg:grid-cols-9">
                {/* Column 1-2: Reach Out + CLI (Desktop) */}
                <div className="col-span-2 text-off-white max-lg:hidden">
                    <span className="mb-3 flex items-center text-xs font-mono font-bold uppercase tracking-wider lg:mb-[1.44676vw] xl:text-[0.69444vw] drop-shadow-md">
                        <span className="font-light mr-1">/</span> Reach Out
                    </span>
                    <div className="flex flex-col text-[24px] leading-[0.95] font-[470] tracking-[-0.01em] lg:text-[1.85185vw] lg:leading-[1.1] drop-shadow-lg">
                        <UnderlineLink href="mailto:team@scrapeverse.dev">
                            team@scrapeverse.dev
                        </UnderlineLink>
                        <div className="flex mt-1">
                            /&nbsp;
                            <UnderlineLink href="tel:18007272730">+1 (800) SCRAPE-0</UnderlineLink>
                        </div>
                    </div>

                    {/* CLI Quick-Install snippet */}
                    <div
                        onClick={copyCli}
                        className="mt-6 flex items-center justify-between bg-void/90 backdrop-blur-xs p-3 rounded-xs border border-off-white/30 cursor-pointer group hover:border-off-white transition-all font-mono text-xs max-w-[280px] shadow-xl"
                    >
                        <code className="text-off-white font-bold">$ npx scrapeverse@latest</code>
                        <span className="text-[10px] bg-off-white/20 text-off-white px-2 py-0.5 rounded-xs font-bold uppercase group-hover:bg-off-white/30 transition-colors">
                            {copied ? "COPIED!" : "COPY"}
                        </span>
                    </div>
                </div>

                {/* Column 6-9: 3 Directory Columns (Desktop) */}
                <div className="col-span-4 col-start-6 flex gap-x-[6.42361vw] text-[1.15741vw] leading-[1.1] font-[470] tracking-[-0.01em] text-off-white max-lg:hidden lg:pb-[5vw] drop-shadow-lg">
                    {/* / Build */}
                    <div className="space-y-[1.44676vw]">
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-wider xl:text-[0.69444vw]">
                            <span className="font-light mr-1">/</span> Build
                        </span>
                        <div>
                            {BUILD_LINKS.map((item) => (
                                <UnderlineLink key={item} href="#">
                                    {item}
                                </UnderlineLink>
                            ))}
                        </div>
                    </div>

                    {/* / Connect */}
                    <div className="space-y-[1.44676vw]">
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-wider xl:text-[0.69444vw]">
                            <span className="font-light mr-1">/</span> Connect
                        </span>
                        <div>
                            {SOCIAL_LINKS.map(({ name, href }) => (
                                <UnderlineLink key={name} href={href}>
                                    {name}
                                </UnderlineLink>
                            ))}
                        </div>
                    </div>

                    {/* / Navigate */}
                    <div className="space-y-[1.44676vw]">
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-wider xl:text-[0.69444vw]">
                            <span className="font-light mr-1">/</span> Navigate
                        </span>
                        <div>
                            {NAV_ITEMS.map(({ label, href }) => (
                                <UnderlineLink key={label} href={href}>
                                    {label}
                                </UnderlineLink>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Stacked Layout */}
                <div className="lg:hidden py-4">
                    <span className="mb-3 flex items-center text-xs font-mono font-bold uppercase tracking-wider">
                        <span className="font-light mr-1">/</span> Reach Out
                    </span>
                    <div className="flex flex-col text-xl leading-[1.1] font-[470] tracking-[-0.01em] mb-4">
                        <UnderlineLink href="mailto:team@scrapeverse.dev">
                            team@scrapeverse.dev
                        </UnderlineLink>
                        <div className="flex mt-1">
                            /&nbsp;
                            <UnderlineLink href="tel:18007272730">+1 (800) SCRAPE-0</UnderlineLink>
                        </div>
                    </div>

                    <div
                        onClick={copyCli}
                        className="mb-6 flex items-center justify-between bg-void/90 p-3 rounded-xs border border-off-white/30 cursor-pointer font-mono text-xs max-w-[280px]"
                    >
                        <code className="text-off-white font-bold">$ npx scrapeverse@latest</code>
                        <span className="text-[10px] bg-off-white/20 text-off-white px-2 py-0.5 rounded-xs font-bold uppercase">
                            {copied ? "COPIED!" : "COPY"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm font-mono mb-6">
                        <div>
                            <span className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider">
                                <span className="font-light mr-1">/</span> Build
                            </span>
                            <div className="flex flex-col gap-1.5 text-off-white/90">
                                {BUILD_LINKS.map((item) => (
                                    <a key={item} href="#" className="hover:underline">
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider">
                                <span className="font-light mr-1">/</span> Connect
                            </span>
                            <div className="flex flex-col gap-1.5 text-off-white/90">
                                {SOCIAL_LINKS.map(({ name }) => (
                                    <a key={name} href="#" className="hover:underline">
                                        {name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
             *  BOTTOM BAR: Newsletter Input + Copyright
             * ═══════════════════════════════════════════════════════ */}
            <div className="relative z-20 lg:grid lg:grid-cols-9 items-end pt-8 lg:pt-0">
                {/* Newsletter Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setEmail("");
                    }}
                    className="col-span-3 col-start-1 flex w-full border-b-2 border-off-white text-[32px] leading-[0.8] font-[470] tracking-[-0.01em] text-off-white lg:mb-[.46296vw] lg:max-w-[53.24306vw] lg:text-[3.7037vw] drop-shadow-md"
                >
                    <div className="flex-1">
                        <input
                            required
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => {
                                handleChange();
                                setEmail(e.target.value);
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                            className="h-full w-full bg-transparent placeholder-off-white accent-off-white outline-none"
                        />
                    </div>
                    <button className="cursor-pointer" aria-label="Submit email" type="submit">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 22 19"
                            fill="#f8f8f8"
                            className="h-auto w-[25px] lg:w-[3.47222vw]"
                        >
                            <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
                        </svg>
                    </button>
                </form>

                {/* Copyright & Up */}
                <div className="col-span-5 col-start-6 flex justify-between text-[14px] leading-[0.85] font-[470] tracking-[-0.01em] uppercase max-lg:pt-6 max-lg:pb-2 lg:items-end lg:justify-end lg:text-[1.27315vw] drop-shadow-md">
                    <span className="inline lg:hidden">© 2026</span>
                    <span className="hidden lg:inline">
                        © SCRAPEVERSE // INTO THE SCRAPE-VERSE 2026 &nbsp;
                        <span className="font-light">/</span>
                        &nbsp;
                    </span>
                    <div className="flex items-center gap-3">
                        <BlinkText repeat={1}>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                className="cursor-pointer"
                            >
                                GITHUB
                            </a>
                        </BlinkText>
                        <span className="font-light">/</span>
                        <BlinkText repeat={1}>
                            <a href="#" className="cursor-pointer">
                                BRIGHT DATA
                            </a>
                        </BlinkText>
                        <span className="font-light">/</span>
                        <BlinkText repeat={1}>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                                className="cursor-pointer uppercase"
                            >
                                UP ↑
                            </button>
                        </BlinkText>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── UnderlineLink: right-to-left animated underline on hover ── */
function UnderlineLink({ children, href = "#" }: { children: ReactNode; href?: string }) {
    return (
        <motion.div
            initial="initial"
            whileHover="whileHover"
            className="relative w-fit leading-[1.2] cursor-pointer"
        >
            <a href={href}>{children}</a>
            <motion.div
                className="absolute bottom-0 h-[1.25px] bg-off-white"
                variants={{
                    initial: { width: "0%", right: "0px", left: "auto" },
                    whileHover: { width: "100%", left: "0px", right: "auto" },
                }}
                transition={{
                    left: { duration: 0 },
                    right: { duration: 0 },
                    default: { ease: [0.19, 1, 0.22, 1], duration: 0.8 },
                }}
            />
        </motion.div>
    );
}

/* ── BlinkText: quick blink on hover ── */
function BlinkText({ children, repeat = 0 }: { children: ReactNode; repeat?: number }) {
    return (
        <motion.span initial="initial" whileHover="whileHover" className="cursor-pointer">
            <motion.span
                variants={{
                    initial: { opacity: 1 },
                    whileHover: {
                        opacity: [0, 0, 1],
                        transition: {
                            duration: 0.125,
                            times: [0, 0.5, 1],
                            repeat,
                            repeatDelay: 0.1,
                        },
                    },
                }}
            >
                {children}
            </motion.span>
        </motion.span>
    );
}
