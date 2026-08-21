"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type ClipVideoProps = {
    clip: string;
    eager?: boolean;
    className?: string;
};

/** Lazy background video: poster first, sources attach when scrolled near. */
export function ClipVideo({ clip, eager = false, className = "" }: ClipVideoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(eager);

    useEffect(() => {
        if (eager || active) return;
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setActive(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "400px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [eager, active]);

    return (
        <div
            ref={ref}
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        >
            {active ? (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={`/video/${clip}-poster.jpg`}
                    className="h-full w-full scale-105 object-cover"
                >
                    <source src={`/video/${clip}.webm`} type="video/webm" />
                    <source src={`/video/${clip}.mp4`} type="video/mp4" />
                </video>
            ) : (
                <Image
                    src={`/video/${clip}-poster.jpg`}
                    alt=""
                    fill
                    sizes="100vw"
                    className="scale-105 object-cover"
                />
            )}
        </div>
    );
}
