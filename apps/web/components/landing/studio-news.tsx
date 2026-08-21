"use client";

export function StudioNews() {
    return (
        <section
            id="dispatches"
            className="relative z-10 overflow-clip bg-off-white text-void pt-20 md:pt-32"
        >
            <div className="relative z-10 bg-off-white px-3 md:px-6 lg:px-[0.46vw] lg:pt-[0.46vw]">
                {/* Header */}
                <div>
                    <span className="flex items-center text-xs font-mono font-bold uppercase tracking-tight slash-before md:text-sm lg:text-[0.69vw] text-flare">
                        ENGINE LOGS &amp; UPDATES
                    </span>
                    <h2 className="type-section-heading pt-2 pr-5 text-5xl md:text-8xl lg:text-[12.15vw] font-black uppercase tracking-tight">
                        Dispatches
                    </h2>
                </div>

                {/* See All button with sliding arrows */}
                <div className="mt-12 md:mt-24 lg:mt-[18.52vw] mb-6 md:mb-8">
                    <a href="#" className="group relative inline-block cursor-pointer">
                        <div className="flex items-center justify-between gap-6 md:gap-10">
                            {/* Arrow that slides in */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 22 19"
                                fill="#0b0b0b"
                                className="h-4 w-4 md:h-5 md:w-5 shrink-0 opacity-0 -translate-x-full transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                            >
                                <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
                            </svg>

                            <span className="shrink-0 text-xl md:text-2xl lg:text-[1.85vw] font-black uppercase tracking-tight">
                                <span className="relative">
                                    ALL DISPATCHES
                                    <span className="absolute top-0 left-full ml-1 text-xs md:text-sm font-mono font-bold text-flare">
                                        [ 08 ]
                                    </span>
                                </span>
                            </span>

                            {/* Arrow that slides out */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 22 19"
                                fill="#0b0b0b"
                                className="h-4 w-4 md:h-5 md:w-5 shrink-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-0"
                            >
                                <path d="m10.392 16.88 7.232-7.264-7.264-7.232 1.696-1.76 8.992 8.992-8.96 8.992zM.568 8.304h18.4v2.656H.568z" />
                            </svg>
                        </div>
                        <div className="h-[2px] w-full bg-void mt-1" />
                    </a>
                </div>

                {/* News cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 pb-16">
                    {/* Card 1 */}
                    <a className="group flex flex-col cursor-pointer" href="#">
                        <div className="relative mb-4 aspect-video overflow-hidden rounded-xs bg-void border border-void">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt="Spider-Verse Scraper Engine"
                                src="/video/clip-portal-poster.jpg"
                                className="h-full w-full object-cover grayscale contrast-125 transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                                loading="lazy"
                            />
                        </div>
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-wider text-void/70 mb-2">
                            <span className="font-light text-flare mr-1">/</span> RELEASE LOG{" "}
                            <span className="font-light mx-1">/</span> 16/08/2026
                        </span>
                        <h3 className="text-2xl md:text-3xl lg:text-[2.31vw] font-black uppercase leading-tight tracking-tight mb-3 transition-colors group-hover:text-flare">
                            SCRAPVERSE V2: AUTONOMOUS SELECTOR AST MUTATION ENGINE
                        </h3>
                        <p className="text-sm md:text-base leading-relaxed text-void/80 max-w-xl font-medium">
                            We&apos;re shipping real-time Abstract Syntax Tree mutation algorithms
                            for Playwright &amp; Cheerio. When target DOM nodes move, your code
                            rewrites itself before throwing an error.
                        </p>
                    </a>

                    {/* Card 2 */}
                    <a className="group flex flex-col cursor-pointer" href="#">
                        <div className="relative mb-4 aspect-video overflow-hidden rounded-xs bg-void border border-void">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt="Bright Data ScrapVerse Integration"
                                src="/video/clip-noir-poster.jpg"
                                className="h-full w-full object-cover grayscale contrast-125 transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                                loading="lazy"
                            />
                        </div>
                        <span className="flex items-center text-xs font-mono font-bold uppercase tracking-wider text-void/70 mb-2">
                            <span className="font-light text-flare mr-1">/</span> PARTNERSHIP{" "}
                            <span className="font-light mx-1">/</span> 08/08/2026
                        </span>
                        <h3 className="text-2xl md:text-3xl lg:text-[2.31vw] font-black uppercase leading-tight tracking-tight mb-3 transition-colors group-hover:text-flare">
                            POWERED BY BRIGHT DATA: UNLOCKING RESIDENTIAL PROXY MESH
                        </h3>
                        <p className="text-sm md:text-base leading-relaxed text-void/80 max-w-xl font-medium">
                            Deep integration with Bright Data&apos;s Web Unlocker and Scraping
                            Browser. Automatically solve CAPTCHAs, rotate TLS fingerprints, and
                            bypass Cloudflare bot detections.
                        </p>
                    </a>
                </div>
            </div>
        </section>
    );
}
