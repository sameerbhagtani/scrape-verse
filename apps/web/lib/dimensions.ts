export type Dimension = {
    id: string;
    index: string;
    kicker: string;
    title: string;
    body: string;
    /** Canon Marvel universe designation, shown as a HUD micro-label. */
    earth: string;
    location: string;
    spider: string;
    /** Basename in /public/video — variants are `${clip}.webm|.mp4`, `${clip}-sm.*`, `${clip}-poster.jpg`. */
    clip: string;
    palette: { base: string; accent: string; secondary: string };
};

export const DIMENSIONS: Dimension[] = [
    {
        id: "hero",
        index: "00",
        kicker: "INTO THE",
        title: "SCRAPE-VERSE",
        body: "A multiverse of web data. One custom scraper. Built for the WeMakeDevs × Bright Data hackathon.",
        earth: "EARTH-1610",
        location: "BROOKLYN",
        spider: "Miles Morales",
        clip: "hero-leap",
        palette: { base: "#0A0A0F", accent: "#FF1B6B", secondary: "#00E5FF" },
    },
    {
        id: "target",
        index: "01",
        kicker: "WHAT WE HUNT",
        title: "TARGET",
        body: "Public web data only. The scraper locks on, extracts, and never touches anything behind a login.",
        earth: "EARTH-199999",
        location: "QUEENS",
        spider: "Peter Parker",
        clip: "clip-tom",
        palette: { base: "#0B1020", accent: "#E62429", secondary: "#1B2A6B" },
    },
    {
        id: "pipeline",
        index: "02",
        kicker: "HOW IT RUNS",
        title: "PIPELINE",
        body: "Scraper Studio fires the run. Raw HTML goes in — clean, structured data swings out the other side.",
        earth: "EARTH-120703",
        location: "MANHATTAN",
        spider: "Peter Parker",
        clip: "clip-swing",
        palette: { base: "#101418", accent: "#C8102E", secondary: "#4A5C6A" },
    },
    {
        id: "metrics",
        index: "03",
        kicker: "RUN DATA",
        title: "METRICS",
        body: "Pages crawled. Fields captured. Runtime per dimension. Numbers go live once the scraper ships.",
        earth: "EARTH-928",
        location: "NUEVA YORK",
        spider: "Miguel O'Hara",
        clip: "clip-miguel",
        palette: { base: "#050505", accent: "#FF2D55", secondary: "#2B0A1A" },
    },
    {
        id: "output",
        index: "04",
        kicker: "SAMPLE PAYLOAD",
        title: "OUTPUT",
        body: "Structured JSON, ready for anything — dashboards, agents, pipelines. Example payload lands here.",
        earth: "EARTH-65",
        location: "VISIONS",
        spider: "Gwen Stacy",
        clip: "clip-gwen",
        palette: { base: "#1A0A20", accent: "#FF6EC7", secondary: "#46E5D0" },
    },
    {
        id: "crew",
        index: "05",
        kicker: "THE TEAM",
        title: "CREW",
        body: "Up to four builders, one web. Names, roles and universes of origin — dropping in soon.",
        earth: "EARTH-138",
        location: "CAMDEN",
        spider: "Hobie Brown",
        clip: "clip-neon",
        palette: { base: "#0D0D0D", accent: "#FF5C00", secondary: "#00D26A" },
    },
    {
        id: "society",
        index: "06",
        kicker: "EVERY DIMENSION, ONE WEB",
        title: "SOCIETY",
        body: "Repo, demo video, docs and the Bright Data write-up — every part of the submission, linked here.",
        earth: "SPIDER-SOCIETY",
        location: "HQ",
        spider: "Collective",
        clip: "clip-society",
        palette: { base: "#0E1418", accent: "#F5F2EA", secondary: "#3A6B8C" },
    },
    {
        id: "noir",
        index: "07",
        kicker: "END OF LINE",
        title: "NOIR",
        body: "Fan-made hackathon project. Not affiliated with Marvel, Sony Pictures, or any Spider-Man rights holders.",
        earth: "EARTH-90214",
        location: "NEW YORK 1933",
        spider: "Spider-Man Noir",
        clip: "clip-noir",
        palette: { base: "#0A0A0A", accent: "#F2F0EB", secondary: "#6E6E6E" },
    },
];

/** Reused between every section change, not tied to one dimension. */
export const TRANSITION_CLIP = "clip-portal";

export const HERO = DIMENSIONS[0]!;
export const SECTIONS = DIMENSIONS.slice(1);

export const DIMENSION_BY_ID = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d])) as Record<
    string,
    Dimension
>;
