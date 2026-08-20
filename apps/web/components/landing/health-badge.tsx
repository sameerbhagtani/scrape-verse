"use client";

import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

type HealthState = "loading" | "healthy" | "offline";

/** Tiny live status readout in the noir footer. */
export function HealthBadge() {
    const [health, setHealth] = useState<HealthState>("loading");

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_URL}/health`, { signal: controller.signal })
            .then((response) => {
                setHealth(response.ok ? "healthy" : "offline");
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setHealth("offline");
            });

        return () => controller.abort();
    }, []);

    const label = health === "loading" ? "PINGING" : health === "healthy" ? "HEALTHY" : "OFFLINE";
    const color = health === "loading" ? "#6E6E6E" : health === "healthy" ? "#00D26A" : "#FF2D55";

    return (
        <span className="inline-flex items-center gap-2 font-mono text-3xs uppercase tracking-studio-wide text-white/60 md:text-xs">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            API {"//"} {label}
        </span>
    );
}
