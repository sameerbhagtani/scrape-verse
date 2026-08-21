"use client";

import { useState } from "react";

export function Nav() {
    const [menuOpen, setMenuOpen] = useState(false);

    const links = [
        { label: "SCRAPERS", href: "#scrapers", active: true },
        { label: "HEALING", href: "#healing" },
        { label: "ENGINE", href: "#engine" },
        { label: "AGENTS", href: "#agents" },
        { label: "DOCS", href: "#docs" },
    ];

    return (
        <>
            <header className="fixed top-0 z-[60] flex w-full items-center justify-between p-3 text-off-white mix-blend-difference md:grid md:grid-cols-12 md:gap-x-[.5vw] md:p-3 lg:p-[0.46vw]">
                {/* Brand Logo: SCRAPVERSE */}
                <a
                    href="#"
                    className="col-span-3 flex items-center gap-2 group cursor-pointer"
                    aria-label="ScrapVerse Studio"
                >
                    <span className="font-extrabold tracking-tighter text-xl lg:text-[1.4vw] leading-none uppercase font-mono flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 bg-flare rounded-xs animate-pulse" />
                        SCRAPVERSE<span className="text-flare text-xs font-mono">®</span>
                    </span>
                </a>

                {/* Center Live Hackathon / Multiverse status */}
                <div className="col-span-4 col-start-4 hidden items-center gap-4 md:flex lg:gap-6">
                    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-tight font-mono">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-flare animate-ping" />
                        SELF-HEALING: ACTIVE
                    </span>
                    <span className="text-xs font-medium uppercase tracking-tight text-off-white/80 font-mono">
                        BRIGHT DATA READY
                    </span>
                </div>

                {/* Nav Links */}
                <nav className="col-span-5 col-start-8 hidden items-center justify-end gap-1 md:flex">
                    {links.map((l, i) => (
                        <span key={l.label} className="flex items-center font-mono">
                            {i > 0 && (
                                <span className="mx-1.5 text-xs font-light text-off-white/50">
                                    /
                                </span>
                            )}
                            <a
                                href={l.href}
                                className={`text-xs font-bold uppercase tracking-tight transition-colors hover:text-flare ${
                                    l.active ? "text-flare" : "text-off-white"
                                }`}
                            >
                                {l.active && (
                                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-flare align-middle" />
                                )}
                                {l.label}
                            </a>
                        </span>
                    ))}
                    <span className="mx-1.5 text-xs font-light text-off-white/50">/</span>
                    <a
                        href="/login"
                        className="text-xs font-bold uppercase tracking-tight font-mono text-flare border border-flare/50 px-3 py-1 hover:bg-flare hover:text-off-white transition-all duration-300"
                    >
                        LOGIN
                    </a>
                </nav>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="z-50 flex flex-col gap-1.5 p-2 md:hidden cursor-pointer"
                    aria-label="Toggle menu"
                >
                    <span
                        className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${
                            menuOpen ? "translate-y-2 rotate-45" : ""
                        }`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-current transition-opacity duration-200 ${
                            menuOpen ? "opacity-0" : ""
                        }`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${
                            menuOpen ? "-translate-y-2 -rotate-45" : ""
                        }`}
                    />
                </button>
            </header>

            {/* Mobile Drawer */}
            {menuOpen && (
                <div className="fixed inset-0 z-[55] flex flex-col justify-between bg-void p-8 text-off-white md:hidden">
                    <div className="pt-16 flex flex-col gap-6 font-mono">
                        <span className="text-xs uppercase tracking-widest text-flare">
                            {"// INTO THE SCRAPE-VERSE"}
                        </span>
                        {links.map((l) => (
                            <a
                                key={l.label}
                                href={l.href}
                                onClick={() => setMenuOpen(false)}
                                className={`text-3xl font-extrabold tracking-tight ${
                                    l.active ? "text-flare" : "text-off-white"
                                }`}
                            >
                                / {l.label}
                            </a>
                        ))}
                        <a
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className="text-3xl font-extrabold tracking-tight text-flare"
                        >
                            / LOGIN
                        </a>
                    </div>
                    <div className="border-t border-off-white/20 pt-4 text-xs font-mono uppercase tracking-widest text-off-white/70">
                        AUTO-REPAIR ENGINE • WE-MAKE-DEVS HACKATHON
                    </div>
                </div>
            )}
        </>
    );
}
