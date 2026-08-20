"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
    type FormEvent,
    type KeyboardEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { HealthBadge } from "~/components/landing/health-badge";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
const ease = [0.19, 1, 0.22, 1] as const;

type FieldPlan = {
    name: string;
    type: string;
    description: string;
    required?: boolean;
};

type Message = {
    id: string;
    role: "agent" | "user";
    content: string;
    timestamp: string;
    fields?: FieldPlan[];
    mode?: "live" | "local";
};

type JobStatus = "running" | "healthy" | "draft";

type Job = {
    id: string;
    name: string;
    target: string;
    status: JobStatus;
    rows: string;
    progress: number;
};

type PlanResponse = {
    success?: boolean;
    data?: {
        fields?: FieldPlan[];
    };
};

const conversations = [
    { id: "c-1", title: "Sneaker price monitor", time: "NOW", active: true },
    { id: "c-2", title: "HN AI launch tracker", time: "19:42" },
    { id: "c-3", title: "Hotel rate watch", time: "YEST." },
];

const initialJobs: Job[] = [
    {
        id: "SV-2049",
        name: "AIR-JORDAN WATCH",
        target: "nike.com",
        status: "running",
        rows: "1,284",
        progress: 72,
    },
    {
        id: "SV-1942",
        name: "LAUNCH SIGNALS",
        target: "news.ycombinator.com",
        status: "healthy",
        rows: "8,491",
        progress: 100,
    },
    {
        id: "SV-1886",
        name: "RATE PULSE",
        target: "booking.com",
        status: "draft",
        rows: "—",
        progress: 18,
    },
];

const initialMessages: Message[] = [
    {
        id: "m-1",
        role: "agent",
        timestamp: "21:16",
        content:
            "ScrapeVerse node online. Tell me what website to inspect and what data you need. I’ll turn the request into a reviewable extraction plan.",
    },
    {
        id: "m-2",
        role: "user",
        timestamp: "21:17",
        content:
            "Track Air Jordan listings on Nike. I need the product name, current price, colorway, sizes and product URL.",
    },
    {
        id: "m-3",
        role: "agent",
        timestamp: "21:17",
        content:
            "Target understood. I mapped five fields and prepared a recurring product monitor. Review the schema before deployment.",
        fields: [
            { name: "product_name", type: "text", description: "Product title", required: true },
            { name: "price", type: "number", description: "Current listed price", required: true },
            { name: "colorway", type: "text", description: "Displayed colorway" },
            { name: "sizes", type: "array", description: "Available sizes" },
            {
                name: "product_url",
                type: "url",
                description: "Canonical product URL",
                required: true,
            },
        ],
    },
];

const resultRows = [
    { product: "Air Jordan 1 Retro High OG", price: "$180", color: "Black / Varsity Red" },
    { product: "Air Jordan 4 RM", price: "$150", color: "Sail / Black" },
    { product: "Air Jordan 3 Retro", price: "$200", color: "White / Cement Grey" },
];

function timestamp() {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
}

function fallbackFields(instruction: string): FieldPlan[] {
    const normalized = instruction.toLowerCase();
    const fields: FieldPlan[] = [
        { name: "title", type: "text", description: "Primary item title", required: true },
        { name: "source_url", type: "url", description: "Source page URL", required: true },
    ];

    if (/price|cost|rate|fare/.test(normalized)) {
        fields.splice(1, 0, {
            name: "price",
            type: "number",
            description: "Current displayed price",
            required: true,
        });
    }
    if (/image|photo|thumbnail/.test(normalized)) {
        fields.push({ name: "image_url", type: "url", description: "Primary image URL" });
    }
    if (/rating|review/.test(normalized)) {
        fields.push({ name: "rating", type: "number", description: "Displayed rating" });
    }
    if (/date|published|time/.test(normalized)) {
        fields.push({ name: "published_at", type: "date", description: "Published timestamp" });
    }

    return fields;
}

function statusColor(status: JobStatus) {
    if (status === "healthy") return "bg-emerald-400";
    if (status === "running") return "bg-flare";
    return "bg-off-white/30";
}

export function DashboardClient() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const [instruction, setInstruction] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [showJson, setShowJson] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const latestPlan = useMemo(
        () => [...messages].reverse().find((message) => message.fields?.length),
        [messages],
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isPlanning]);

    async function submitInstruction(event?: FormEvent) {
        event?.preventDefault();
        const request = instruction.trim();
        if (!request || isPlanning) return;

        const requestTime = timestamp();
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            timestamp: requestTime,
            content: request,
        };

        setMessages((current) => [...current, userMessage]);
        setInstruction("");
        setIsPlanning(true);

        let fields: FieldPlan[];
        let mode: "live" | "local" = "live";

        try {
            const response = await fetch(`${API_URL}/scraper/plan`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ instruction: request }),
            });

            if (!response.ok) throw new Error("Planning endpoint unavailable");
            const payload = (await response.json()) as PlanResponse;
            fields = payload.data?.fields?.filter((field) => field.name) ?? [];
            if (!fields.length) throw new Error("Planning endpoint returned no fields");
        } catch {
            mode = "local";
            fields = fallbackFields(request);
        }

        const target = request.match(/https?:\/\/([^/\s]+)/i)?.[1] ?? "Target pending";
        const agentMessage: Message = {
            id: crypto.randomUUID(),
            role: "agent",
            timestamp: timestamp(),
            mode,
            content:
                mode === "live"
                    ? `Plan received from the scrape engine. I mapped ${fields.length} fields for review.`
                    : `The API node is offline, so I prepared a local ${fields.length}-field draft. Connect the backend before deployment.`,
            fields,
        };

        setMessages((current) => [...current, agentMessage]);
        setJobs((current) => [
            {
                id: `SV-${Math.floor(2100 + Math.random() * 700)}`,
                name: request.slice(0, 28).toUpperCase(),
                target,
                status: "draft",
                rows: "—",
                progress: 24,
            },
            ...current,
        ]);
        setIsPlanning(false);
    }

    function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submitInstruction();
        }
    }

    return (
        <main className="relative h-dvh min-h-[680px] overflow-hidden bg-void text-off-white selection:bg-flare">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:36px_36px]" />
            <div className="pointer-events-none absolute -top-48 left-[35%] h-96 w-96 rounded-full bg-flare/15 blur-[140px]" />

            <div className="relative z-10 grid h-full lg:grid-cols-[280px_minmax(0,1fr)_340px]">
                <DashboardSidebar jobs={jobs} open={leftOpen} onClose={() => setLeftOpen(false)} />

                <section className="flex min-w-0 flex-col border-x border-off-white/10">
                    <DashboardHeader
                        onOpenLeft={() => setLeftOpen(true)}
                        onOpenRight={() => setRightOpen(true)}
                    />

                    <div className="relative min-h-0 flex-1">
                        <div className="absolute inset-0 overflow-y-auto px-4 pb-48 pt-5 sm:px-8 lg:px-10">
                            <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
                                <div className="border-l-2 border-flare pl-4">
                                    <p className="font-mono text-[10px] tracking-[0.22em] text-flare uppercase">
                                        {"// ACTIVE CONVERSATION"}
                                    </p>
                                    <h1 className="mt-1 font-heavy text-2xl tracking-[-0.04em] uppercase sm:text-3xl">
                                        Sneaker price monitor
                                    </h1>
                                </div>

                                <AnimatePresence initial={false}>
                                    {messages.map((message) => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))}
                                </AnimatePresence>

                                {isPlanning ? <PlanningIndicator /> : null}
                                <div ref={messagesEndRef} aria-hidden="true" />
                            </div>
                        </div>

                        <Composer
                            value={instruction}
                            pending={isPlanning}
                            onChange={setInstruction}
                            onKeyDown={handleComposerKeyDown}
                            onSubmit={submitInstruction}
                        />
                    </div>
                </section>

                <MissionControl
                    open={rightOpen}
                    onClose={() => setRightOpen(false)}
                    plan={latestPlan}
                    showJson={showJson}
                    onToggleJson={() => setShowJson((current) => !current)}
                />
            </div>
        </main>
    );
}

function DashboardHeader({
    onOpenLeft,
    onOpenRight,
}: {
    onOpenLeft: () => void;
    onOpenRight: () => void;
}) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-off-white/10 bg-void/85 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Open conversations"
                    onClick={onOpenLeft}
                    className="grid size-9 place-items-center border border-off-white/15 lg:hidden"
                >
                    <MenuIcon />
                </button>
                <div className="hidden items-center gap-2 sm:flex">
                    <span className="size-2 animate-pulse rounded-full bg-flare" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-off-white/55 uppercase">
                        NODE / EARTH-616
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <HealthBadge />
                <span className="hidden h-4 w-px bg-off-white/15 sm:block" />
                <span className="hidden font-mono text-[10px] tracking-widest text-off-white/35 uppercase sm:inline">
                    Encrypted session
                </span>
                <button
                    type="button"
                    aria-label="Open mission control"
                    onClick={onOpenRight}
                    className="grid size-9 place-items-center border border-off-white/15 xl:hidden"
                >
                    <PanelIcon />
                </button>
            </div>
        </header>
    );
}

function DashboardSidebar({
    jobs,
    open,
    onClose,
}: {
    jobs: Job[];
    open: boolean;
    onClose: () => void;
}) {
    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close conversations"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                />
            ) : null}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#080808] transition-transform duration-500 lg:static lg:z-auto lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-off-white/10 px-5">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="size-2.5 bg-flare" />
                        <span className="font-heavy text-lg tracking-[-0.04em] uppercase">
                            ScrapVerse<span className="text-flare">®</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close conversations"
                        onClick={onClose}
                        className="font-mono text-xs text-off-white/40 lg:hidden"
                    >
                        ESC
                    </button>
                </div>

                <div className="border-b border-off-white/10 p-4">
                    <button
                        type="button"
                        className="group flex w-full items-center justify-between bg-flare px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-red-500"
                    >
                        New scrape
                        <span className="text-lg transition-transform group-hover:rotate-90">
                            +
                        </span>
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                    <SidebarLabel>Conversations</SidebarLabel>
                    <div className="mt-3 space-y-1">
                        {conversations.map((conversation) => (
                            <button
                                type="button"
                                key={conversation.id}
                                className={`flex w-full items-start justify-between border-l-2 px-3 py-3 text-left transition-colors ${
                                    conversation.active
                                        ? "border-flare bg-off-white/7"
                                        : "border-transparent hover:bg-off-white/5"
                                }`}
                            >
                                <span className="max-w-[170px] truncate text-sm">
                                    {conversation.title}
                                </span>
                                <span className="pt-0.5 font-mono text-[9px] text-off-white/30">
                                    {conversation.time}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8">
                        <SidebarLabel>Scrape jobs</SidebarLabel>
                        <div className="mt-3 space-y-2">
                            {jobs.slice(0, 4).map((job) => (
                                <button
                                    type="button"
                                    key={job.id}
                                    className="w-full border border-off-white/10 bg-off-white/[0.025] p-3 text-left transition-colors hover:border-off-white/25"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[9px] text-off-white/35">
                                            {job.id}
                                        </span>
                                        <span
                                            className={`size-1.5 rounded-full ${statusColor(job.status)}`}
                                        />
                                    </div>
                                    <p className="mt-2 truncate font-mono text-[11px] font-bold tracking-wide">
                                        {job.name}
                                    </p>
                                    <div className="mt-3 h-px bg-off-white/10">
                                        <div
                                            className="h-px bg-flare"
                                            style={{ width: `${job.progress}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between font-mono text-[9px] text-off-white/35">
                                        <span>{job.target}</span>
                                        <span>{job.rows} rows</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-off-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center bg-off-white text-xs font-black text-void">
                            OP
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold uppercase">Operator</p>
                            <p className="font-mono text-[9px] text-off-white/35">
                                MULTIVERSE ACCESS
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="font-mono text-[9px] text-off-white/35 transition-colors hover:text-flare"
                        >
                            EXIT
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}

function ChatMessage({ message }: { message: Message }) {
    const isAgent = message.role === "agent";

    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease }}
            className={`flex gap-3 sm:gap-4 ${isAgent ? "" : "flex-row-reverse"}`}
        >
            <div
                className={`grid size-9 shrink-0 place-items-center font-mono text-[10px] font-black ${
                    isAgent
                        ? "border border-flare bg-flare/10 text-flare"
                        : "bg-off-white text-void"
                }`}
            >
                {isAgent ? "SV" : "YOU"}
            </div>
            <div className={`max-w-[88%] sm:max-w-[82%] ${isAgent ? "" : "text-right"}`}>
                <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-widest text-off-white/30 uppercase">
                    {isAgent ? (
                        <>
                            <span>Scrape agent</span>
                            {message.mode ? (
                                <span
                                    className={
                                        message.mode === "live"
                                            ? "text-emerald-400"
                                            : "text-amber-300"
                                    }
                                >
                                    / {message.mode === "live" ? "API PLAN" : "LOCAL DRAFT"}
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <span className="ml-auto">Operator</span>
                    )}
                    <span>{message.timestamp}</span>
                </div>
                <div
                    className={`border px-4 py-3.5 text-sm leading-relaxed sm:px-5 sm:py-4 ${
                        isAgent
                            ? "border-off-white/10 bg-off-white/[0.035] text-off-white/80"
                            : "border-flare/40 bg-flare text-white"
                    }`}
                >
                    {message.content}
                </div>

                {message.fields?.length ? <FieldPlanGrid fields={message.fields} /> : null}
            </div>
        </motion.article>
    );
}

function FieldPlanGrid({ fields }: { fields: FieldPlan[] }) {
    return (
        <div className="mt-3 overflow-hidden border border-off-white/10 bg-[#070707] text-left">
            <div className="flex items-center justify-between border-b border-off-white/10 px-4 py-2.5">
                <span className="font-mono text-[9px] tracking-[0.18em] text-off-white/45 uppercase">
                    Extraction schema / {fields.length} fields
                </span>
                <span className="size-1.5 animate-pulse rounded-full bg-flare" />
            </div>
            <div className="divide-y divide-off-white/8">
                {fields.map((field, index) => (
                    <div
                        key={`${field.name}-${index}`}
                        className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 sm:grid-cols-[1.1fr_0.55fr_1.5fr]"
                    >
                        <div>
                            <p className="font-mono text-[11px] font-bold text-off-white">
                                {field.name}
                            </p>
                            <p className="mt-1 text-[10px] text-off-white/35 sm:hidden">
                                {field.description}
                            </p>
                        </div>
                        <span className="h-fit border border-flare/30 px-2 py-0.5 font-mono text-[9px] text-flare uppercase">
                            {field.type}
                        </span>
                        <p className="hidden text-xs text-off-white/45 sm:block">
                            {field.description}
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-off-white/10 p-3">
                <button
                    type="button"
                    className="border border-off-white/15 px-3 py-2 font-mono text-[9px] tracking-widest text-off-white/60 uppercase hover:border-off-white/30"
                >
                    Edit fields
                </button>
                <button
                    type="button"
                    className="bg-flare px-3 py-2 font-mono text-[9px] font-bold tracking-widest uppercase hover:bg-red-500"
                >
                    Review schema →
                </button>
            </div>
        </div>
    );
}

function PlanningIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 pl-12 text-off-white/45"
        >
            <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                    <motion.span
                        key={index}
                        className="size-1.5 bg-flare"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
                    />
                ))}
            </div>
            <span className="font-mono text-[10px] tracking-widest uppercase">
                Mapping target structure
            </span>
        </motion.div>
    );
}

function Composer({
    value,
    pending,
    onChange,
    onKeyDown,
    onSubmit,
}: {
    value: string;
    pending: boolean;
    onChange: (value: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-void via-void to-transparent px-4 pb-4 pt-14 sm:px-8 sm:pb-6 lg:px-10">
            <form
                onSubmit={onSubmit}
                className="mx-auto max-w-4xl border border-off-white/15 bg-[#0e0e0e] shadow-2xl focus-within:border-flare/55"
            >
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder="Tell ScrapVerse what to extract..."
                    className="min-h-20 w-full resize-none bg-transparent px-4 pt-4 text-sm text-off-white outline-none placeholder:text-off-white/25 sm:px-5"
                />
                <div className="flex items-center justify-between px-3 pb-3 sm:px-4">
                    <div className="flex items-center gap-3 font-mono text-[9px] text-off-white/25 uppercase">
                        <span className="hidden sm:inline">Enter to deploy</span>
                        <span className="hidden sm:inline">/</span>
                        <span>Shift + Enter for line</span>
                    </div>
                    <button
                        type="submit"
                        disabled={!value.trim() || pending}
                        className="flex items-center gap-2 bg-flare px-4 py-2.5 font-mono text-[10px] font-black tracking-widest uppercase transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-off-white/10 disabled:text-off-white/25"
                    >
                        {pending ? "Planning" : "Plan scrape"}
                        <ArrowIcon />
                    </button>
                </div>
            </form>
            <p className="mx-auto mt-2 max-w-4xl text-center font-mono text-[8px] tracking-wider text-off-white/20 uppercase">
                Review generated selectors before running against any target
            </p>
        </div>
    );
}

function MissionControl({
    open,
    onClose,
    plan,
    showJson,
    onToggleJson,
}: {
    open: boolean;
    onClose: () => void;
    plan?: Message;
    showJson: boolean;
    onToggleJson: () => void;
}) {
    const schema = plan?.fields ?? [];

    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close mission control"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
                />
            ) : null}
            <aside
                className={`fixed inset-y-0 right-0 z-50 flex w-[340px] max-w-[92vw] flex-col bg-[#080808] transition-transform duration-500 xl:static xl:z-auto xl:translate-x-0 ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-off-white/10 px-5">
                    <div>
                        <p className="font-mono text-[9px] tracking-[0.2em] text-flare uppercase">
                            {"// LIVE OUTPUT"}
                        </p>
                        <h2 className="font-heavy text-base uppercase">Mission control</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close mission control"
                        onClick={onClose}
                        className="font-mono text-xs text-off-white/40 xl:hidden"
                    >
                        ESC
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <section className="border-b border-off-white/10 p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-mono text-[9px] text-off-white/35 uppercase">
                                    Preview job / SV-2049
                                </p>
                                <h3 className="mt-1 text-sm font-bold uppercase">
                                    Air-Jordan Watch
                                </h3>
                            </div>
                            <span className="border border-flare/40 bg-flare/10 px-2 py-1 font-mono text-[8px] text-flare uppercase">
                                UI preview
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-px bg-off-white/10">
                            <Metric value="1,284" label="Rows" />
                            <Metric value="98.2%" label="Quality" />
                            <Metric value="02:14" label="Elapsed" />
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 flex justify-between font-mono text-[9px] text-off-white/40 uppercase">
                                <span>Extraction progress</span>
                                <span className="text-flare">72%</span>
                            </div>
                            <div className="h-1 bg-off-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "72%" }}
                                    transition={{ duration: 1.1, ease }}
                                    className="h-full bg-flare"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-off-white/10 p-5">
                        <div className="flex items-center justify-between">
                            <SidebarLabel>Data preview</SidebarLabel>
                            <button
                                type="button"
                                onClick={onToggleJson}
                                className="font-mono text-[9px] text-flare uppercase"
                            >
                                {showJson ? "Table" : "JSON"}
                            </button>
                        </div>

                        {showJson ? (
                            <pre className="mt-4 overflow-x-auto border border-off-white/10 bg-black p-3 font-mono text-[9px] leading-relaxed text-emerald-300">
                                {JSON.stringify(resultRows.slice(0, 2), null, 2)}
                            </pre>
                        ) : (
                            <div className="mt-4 space-y-2">
                                {resultRows.map((row, index) => (
                                    <div
                                        key={row.product}
                                        className="border border-off-white/10 bg-off-white/[0.025] p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="font-mono text-[9px] text-flare">
                                                0{index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold">
                                                    {row.product}
                                                </p>
                                                <p className="mt-1 truncate text-[10px] text-off-white/35">
                                                    {row.color}
                                                </p>
                                            </div>
                                            <span className="font-mono text-xs text-off-white">
                                                {row.price}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="p-5">
                        <SidebarLabel>Latest schema</SidebarLabel>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {schema.length ? (
                                schema.map((field) => (
                                    <span
                                        key={field.name}
                                        className="border border-off-white/12 px-2 py-1 font-mono text-[8px] text-off-white/55 uppercase"
                                    >
                                        {field.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-off-white/30">
                                    Describe a target to generate fields.
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="shrink-0 border-t border-off-white/10 p-4">
                    <button
                        type="button"
                        className="w-full border border-off-white/15 py-3 font-mono text-[10px] font-bold tracking-[0.18em] uppercase transition-colors hover:border-flare hover:text-flare"
                    >
                        Open full results ↗
                    </button>
                </div>
            </aside>
        </>
    );
}

function Metric({ value, label }: { value: string; label: string }) {
    return (
        <div className="bg-[#0d0d0d] px-2 py-3 text-center">
            <p className="font-heavy text-lg">{value}</p>
            <p className="mt-1 font-mono text-[8px] tracking-widest text-off-white/30 uppercase">
                {label}
            </p>
        </div>
    );
}

function SidebarLabel({ children }: { children: ReactNode }) {
    return (
        <p className="font-mono text-[9px] tracking-[0.22em] text-off-white/30 uppercase">
            {"// "}
            {children}
        </p>
    );
}

function MenuIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
            <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="1.5" />
        </svg>
    );
}

function PanelIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
            <rect x="4" y="4" width="16" height="16" strokeWidth="1.5" />
            <path d="M14 4v16" strokeWidth="1.5" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor">
            <path d="M4 10h12M11 5l5 5-5 5" strokeWidth="1.7" />
        </svg>
    );
}
