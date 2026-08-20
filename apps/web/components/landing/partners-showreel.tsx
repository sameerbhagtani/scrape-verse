"use client";

import { useState } from "react";

const ECOSYSTEM = [
    "Bright Data",
    "Playwright",
    "Puppeteer",
    "Python",
    "TypeScript",
    "LangChain",
    "Next.js",
    "OpenAI",
    "Claude",
    "Cursor",
    "Antigravity",
    "Supabase",
    "Redis",
    "Docker",
    "WeMakeDevs",
    "Cheerio",
    "Zod",
    "TailwindCSS",
];

export function PartnersShowreel() {
    const [unmuted, setUnmuted] = useState(false);

    return (
        <section id="agents" className="bg-off-white pt-24 md:pt-36 lg:pt-[19.05vw] text-void">
            {/* Ecosystem Integrations */}
            <div className="px-3 md:px-6 lg:px-[0.46vw]">
                <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight slash-before md:text-sm lg:text-[0.69vw] text-flare">
                    ECOSYSTEM &amp; CODING AGENT INTEGRATIONS
                </span>

                <div className="flex cursor-default flex-wrap items-center pt-4 pb-6 text-2xl md:text-4xl lg:text-[3.7vw] font-black uppercase tracking-tight lg:leading-[0.95]">
                    {ECOSYSTEM.map((tool, i) => (
                        <span key={tool} className="flex items-center">
                            {i > 0 && (
                                <span className="font-light text-void/30 mx-2 md:mx-3">/</span>
                            )}
                            <span className="transition-colors hover:text-flare cursor-pointer">
                                {tool}
                            </span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Showreel / Live Scraper Stream Player */}
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-void md:aspect-[390/220] lg:px-[0.46vw] border-y-2 border-flare">
                {/* Background Spider-Verse video with duotone red/black treatment */}
                <div className="h-full w-full relative">
                    <video
                        src="/video/hero-leap.mp4"
                        className="h-full w-full object-cover grayscale brightness-90 contrast-125"
                        autoPlay
                        loop
                        playsInline
                        muted={!unmuted}
                    />
                    <div className="absolute inset-0 bg-[#ff0000] mix-blend-multiply opacity-75 pointer-events-none" />
                </div>

                {/* Center Reel overlay box */}
                <button
                    onClick={() => setUnmuted((p) => !p)}
                    className="group absolute flex aspect-square w-64 md:w-[41.84vw] flex-col justify-between text-off-white cursor-pointer shadow-2xl transition-transform duration-300 hover:scale-105 border-2 border-off-white/40 bg-void/50 backdrop-blur-xs"
                >
                    {/* Red multiply filter */}
                    <div className="absolute inset-0 z-10 bg-flare [mix-blend-mode:multiply]" />

                    <div className="relative z-20 flex size-full flex-col text-3xl md:text-5xl lg:text-[7.41vw] font-black uppercase tracking-tight">
                        {/* Top metadata bar */}
                        <div className="flex justify-between p-3 text-[10px] md:text-xs font-mono uppercase tracking-wider font-bold">
                            <span className="flex items-center gap-1">
                                SCRAPER ENGINE <span className="font-light">/</span> LIVE STREAM
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-flare animate-ping" />{" "}
                                100% HEALTH
                            </span>
                            <span className="hidden sm:inline">BRIGHT DATA × SCRAPVERSE</span>
                        </div>

                        {/* Center play icon + text */}
                        <div className="absolute inset-0 flex items-center justify-center gap-3 md:gap-6">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 75 87"
                                className="h-8 w-8 md:h-12 md:w-12 lg:h-[4.92vw] lg:w-[4.28vw] transition-transform duration-300 group-hover:scale-110 text-off-white"
                            >
                                <path d="M74.25 43.5 0 86.366V.631z" fill="#F8F8F8" />
                            </svg>
                            <span>RUN</span>
                        </div>

                        {/* Bottom mute indicator */}
                        <div className="p-3 text-right text-[10px] md:text-xs font-mono uppercase tracking-widest text-off-white/80">
                            {unmuted ? "● AUDIO ACTIVE" : "▶ CLICK TO UNMUTE & RUN"}
                        </div>
                    </div>
                </button>
            </div>
        </section>
    );
}
