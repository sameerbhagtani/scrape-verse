"use client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

export function GoogleSignInButton() {
    return (
        <a
            href={`${API_URL}/auth/google`}
            className="flex w-full cursor-pointer items-center justify-center gap-3 border border-off-white/15 bg-off-white/5 py-3 font-mono text-sm tracking-wider text-off-white uppercase transition-all duration-300 hover:border-off-white/30 hover:bg-off-white/10"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
                <path
                    fill="#4285F4"
                    d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
                />
                <path
                    fill="#34A853"
                    d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
                />
                <path
                    fill="#FBBC05"
                    d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.55l3.35-2.62Z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.94c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
                />
            </svg>
            Continue with Google
        </a>
    );
}
