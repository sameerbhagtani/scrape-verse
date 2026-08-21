"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only activate on devices with fine pointer (mouse/trackpad)
        if (
            typeof window === "undefined" ||
            !window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
            return;
        }

        const cursor = cursorRef.current;
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!cursor || !dot || !ring) return;

        gsap.set(cursor, { autoAlpha: 1 });

        // Quick setters for performant mouse following
        const setDotX = gsap.quickSetter(dot, "x", "px");
        const setDotY = gsap.quickSetter(dot, "y", "px");
        const setRingX = gsap.quickTo(ring, "x", {
            duration: 0.3,
            ease: "power3.out",
        });
        const setRingY = gsap.quickTo(ring, "y", {
            duration: 0.3,
            ease: "power3.out",
        });

        const handleMouseMove = (e: MouseEvent) => {
            setDotX(e.clientX);
            setDotY(e.clientY);
            setRingX(e.clientX);
            setRingY(e.clientY);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            const interactive = target.closest(
                "a, button, [role='button'], input, textarea, select, .interactive",
            );
            if (interactive) {
                gsap.to(ring, {
                    scale: 2.2,
                    borderColor: "#00E5FF",
                    backgroundColor: "rgba(0, 229, 255, 0.15)",
                    duration: 0.25,
                });
                gsap.to(dot, { scale: 0.5, backgroundColor: "#FF1B6B", duration: 0.2 });
            } else {
                gsap.to(ring, {
                    scale: 1,
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    backgroundColor: "transparent",
                    duration: 0.25,
                });
                gsap.to(dot, { scale: 1, backgroundColor: "#FFFFFF", duration: 0.2 });
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.addEventListener("mouseover", handleMouseOver, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="pointer-events-none invisible fixed inset-0 z-9999 overflow-hidden opacity-0"
            aria-hidden="true"
        >
            {/* Outer Ring */}
            <div
                ref={ringRef}
                className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-white/40 mix-blend-difference"
            />
            {/* Inner Dot */}
            <div
                ref={dotRef}
                className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-white mix-blend-difference"
            />
        </div>
    );
}
