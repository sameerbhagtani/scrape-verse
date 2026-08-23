"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function PageTransition() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    setDone(true);
                },
            });

            // Spider-Verse badge glitch & pop
            tl.fromTo(
                ".pt-badge",
                { scale: 0.8, autoAlpha: 0, filter: "blur(10px)" },
                {
                    scale: 1,
                    autoAlpha: 1,
                    filter: "blur(0px)",
                    duration: 0.5,
                    ease: "back.out(2)",
                },
            )
                .to(".pt-badge", {
                    scale: 1.05,
                    duration: 0.4,
                    ease: "power1.inOut",
                })
                .to(".pt-badge", {
                    scale: 0.85,
                    autoAlpha: 0,
                    duration: 0.35,
                    ease: "power3.in",
                })
                // 5 colored panels stagger sliding away upwards
                .to(
                    ".pt-panel",
                    {
                        scaleY: 0,
                        transformOrigin: "top",
                        stagger: {
                            each: 0.08,
                            from: "random",
                        },
                        duration: 0.75,
                        ease: "power4.inOut",
                    },
                    "-=0.15",
                );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    if (done) return null;

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-100 flex overflow-hidden"
            aria-hidden="true"
        >
            {/* 5 Vertical Curtain Panels */}
            <div className="pt-panel h-full w-1/5 bg-ink-deep" />
            <div className="pt-panel h-full w-1/5 bg-miles" />
            <div className="pt-panel h-full w-1/5 bg-ink-deep" />
            <div className="pt-panel h-full w-1/5 bg-cyanide" />
            <div className="pt-panel h-full w-1/5 bg-ink-deep" />

            {/* Intro Logo & Glitch Text in Center */}
            <div className="pt-badge absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                    <span className="type-giant text-4xl tracking-tighter text-white sm:text-6xl md:text-8xl">
                        SCRAPE<span className="text-miles">VERSE</span>
                    </span>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-2xs uppercase tracking-studio-xl text-cyanide md:text-3xs">
                        [ INITIALIZING MULTIVERSE SCRAPER ]
                    </div>
                </div>
            </div>
        </div>
    );
}
