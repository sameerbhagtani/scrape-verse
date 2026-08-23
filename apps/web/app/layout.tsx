import type { Metadata } from "next";
import {
    Anton,
    Archivo,
    Archivo_Black,
    Bangers,
    JetBrains_Mono,
    Kaushan_Script,
} from "next/font/google";

import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const anton = Anton({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-anton",
});
const archivoBlack = Archivo_Black({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-archivo-black",
});
const bangers = Bangers({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-bangers",
});
const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
});
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const kaushan = Kaushan_Script({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-kaushan",
});

export const metadata: Metadata = {
    title: "ScrapeVerse — Into the Scrape-Verse",
    description:
        "A multiverse of web data. Custom scraper built with Bright Data Scraper Studio for the WeMakeDevs hackathon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${anton.variable} ${archivoBlack.variable} ${bangers.variable} ${jetbrains.variable} ${archivo.variable} ${kaushan.variable}`}
        >
            <body suppressHydrationWarning>
                <GlobalProviders>{children}</GlobalProviders>
            </body>
        </html>
    );
}
