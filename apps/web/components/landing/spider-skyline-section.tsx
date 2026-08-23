"use client";

import { motion } from "framer-motion";

/**
 * SpiderSkylineSection — Full-bleed cinematic showcase of Spider-Man
 * over the New York City skyline in crimson red and deep noir shadows.
 *
 * Placed before the Dispatches/News section, matching the full-width
 * visual showcase section from the reference.
 */
export function SpiderSkylineSection() {
    return (
        <section className="relative w-full overflow-hidden bg-void border-y-2 border-flare selection:bg-flare selection:text-off-white">
            <div className="relative w-full aspect-[21/9] min-h-[420px] md:min-h-[560px] lg:min-h-[70vh]">
                <motion.img
                    initial={{ scale: 1.05 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                    viewport={{ once: true }}
                    alt="Spider-Man over New York City skyline in crimson red and black"
                    src="/images/spider-skyline.jpg"
                    className="h-full w-full object-cover object-center contrast-125 brightness-100"
                    loading="lazy"
                />

                {/* Cinematic subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-void/40 via-transparent to-void/30 pointer-events-none" />

                {/* HUD Stamp Badge */}
                <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 bg-void/90 backdrop-blur-xs text-off-white px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest border border-flare flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-flare animate-pulse" />
                    {"// SPIDER-MAN • NEW YORK PROTOCOL // SCRAPEVERSE"}
                </div>

                {/* Right HUD info */}
                <div className="hidden md:flex absolute bottom-8 right-8 bg-void/90 backdrop-blur-xs text-off-white/80 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-off-white/20">
                    {"NODE: EARTH-616 // SCRAPE-ENGINE: ACTIVE"}
                </div>
            </div>
        </section>
    );
}
