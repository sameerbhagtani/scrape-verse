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
    mode?: "live" | "error";
};

type Job = {
    id: string;
    name: string;
    target: string;
    fieldCount: number;
};

type PlanResponse = {
    success?: boolean;
    data?: {
        fields?: FieldPlan[];
    };
};

const initialMessages: Message[] = [
    {
        id: "system-ready",
        role: "agent",
        timestamp: "READY",
        content:
            "ScrapeVerse node online. Tell me what website to inspect and what data you need. I’ll turn the request into a reviewable extraction plan.",
    },
];

function timestamp() {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
}

export function DashboardClient() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [instruction, setInstruction] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [conversationTitle, setConversationTitle] = useState("New scrape");
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
        setConversationTitle(request.slice(0, 42));

        let fields: FieldPlan[];

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
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    mode: "error",
                    content:
                        "I couldn’t reach the scrape planning API. No schema was generated. Check the backend connection and try again.",
                },
            ]);
            setIsPlanning(false);
            return;
        }

        const target = request.match(/https?:\/\/([^/\s]+)/i)?.[1] ?? "Target pending";
        const agentMessage: Message = {
            id: crypto.randomUUID(),
            role: "agent",
            timestamp: timestamp(),
            mode: "live",
            content: `Plan received from the scrape engine. I mapped ${fields.length} fields for review.`,
            fields,
        };

        setMessages((current) => [...current, agentMessage]);
        setJobs((current) => [
            {
                id: `PLAN-${Date.now().toString(36).toUpperCase()}`,
                name: request.slice(0, 28).toUpperCase(),
                target,
                fieldCount: fields.length,
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

    function startNewConversation() {
        setMessages(initialMessages);
        setJobs([]);
        setInstruction("");
        setConversationTitle("New scrape");
        setLeftOpen(false);
    }

    return (
        <main className="relative h-dvh min-h-[680px] overflow-hidden bg-void text-off-white selection:bg-flare">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:36px_36px]" />
            <div className="pointer-events-none absolute -top-48 left-[35%] h-96 w-96 rounded-full bg-flare/15 blur-[140px]" />

            <div className="relative z-10 grid h-full lg:grid-cols-[280px_minmax(0,1fr)_340px]">
                <DashboardSidebar
                    jobs={jobs}
                    conversationTitle={conversationTitle}
                    open={leftOpen}
                    onClose={() => setLeftOpen(false)}
                    onNewConversation={startNewConversation}
                />

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
                                        {conversationTitle}
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
                    job={jobs[0]}
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
    conversationTitle,
    open,
    onClose,
    onNewConversation,
}: {
    jobs: Job[];
    conversationTitle: string;
    open: boolean;
    onClose: () => void;
    onNewConversation: () => void;
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
                        onClick={onNewConversation}
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
                        <div className="flex w-full items-start justify-between border-l-2 border-flare bg-off-white/7 px-3 py-3 text-left">
                            <span className="max-w-[180px] truncate text-sm">
                                {conversationTitle}
                            </span>
                            <span className="pt-0.5 font-mono text-[9px] text-off-white/30">
                                NOW
                            </span>
                        </div>
                    </div>

                    <div className="mt-8">
                        <SidebarLabel>Scrape jobs</SidebarLabel>
                        <div className="mt-3 space-y-2">
                            {jobs.length ? (
                                jobs.slice(0, 4).map((job) => (
                                    <button
                                        type="button"
                                        key={job.id}
                                        className="w-full border border-off-white/10 bg-off-white/[0.025] p-3 text-left transition-colors hover:border-off-white/25"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-[9px] text-off-white/35">
                                                {job.id}
                                            </span>
                                            <span className="size-1.5 rounded-full bg-flare" />
                                        </div>
                                        <p className="mt-2 truncate font-mono text-[11px] font-bold tracking-wide">
                                            {job.name}
                                        </p>
                                        <div className="mt-2 flex justify-between font-mono text-[9px] text-off-white/35">
                                            <span>{job.target}</span>
                                            <span>{job.fieldCount} fields</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="border border-dashed border-off-white/10 px-3 py-4 font-mono text-[9px] leading-relaxed text-off-white/25 uppercase">
                                    No plans yet. Send a real scraping request to create one.
                                </p>
                            )}
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
                                        message.mode === "live" ? "text-emerald-400" : "text-flare"
                                    }
                                >
                                    / {message.mode === "live" ? "API PLAN" : "API ERROR"}
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
            <p className="border-t border-off-white/10 px-4 py-3 font-mono text-[9px] text-off-white/30 uppercase">
                Schema returned by the live planning API
            </p>
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
                        <span className="hidden sm:inline">Enter to plan</span>
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
                Review planned fields before generating selectors
            </p>
        </div>
    );
}

function MissionControl({
    open,
    onClose,
    plan,
    job,
}: {
    open: boolean;
    onClose: () => void;
    plan?: Message;
    job?: Job;
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
                    {job && schema.length ? (
                        <>
                            <section className="border-b border-off-white/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-mono text-[9px] text-off-white/35 uppercase">
                                            {job.id}
                                        </p>
                                        <h3 className="mt-1 truncate text-sm font-bold uppercase">
                                            {job.name}
                                        </h3>
                                        <p className="mt-2 truncate font-mono text-[9px] text-off-white/35">
                                            {job.target}
                                        </p>
                                    </div>
                                    <span className="shrink-0 border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 font-mono text-[8px] text-emerald-400 uppercase">
                                        API plan
                                    </span>
                                </div>
                                <div className="mt-5 border border-off-white/10 bg-off-white/[0.025] p-4">
                                    <p className="font-heavy text-3xl text-flare">
                                        {schema.length}
                                    </p>
                                    <p className="mt-1 font-mono text-[9px] tracking-widest text-off-white/30 uppercase">
                                        Fields returned by backend
                                    </p>
                                </div>
                            </section>

                            <section className="p-5">
                                <SidebarLabel>Live schema</SidebarLabel>
                                <div className="mt-4 space-y-2">
                                    {schema.map((field) => (
                                        <div
                                            key={field.name}
                                            className="border border-off-white/10 bg-off-white/[0.025] p-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="truncate font-mono text-[10px] font-bold">
                                                    {field.name}
                                                </span>
                                                <span className="font-mono text-[8px] text-flare uppercase">
                                                    {field.type}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-[10px] leading-relaxed text-off-white/35">
                                                {field.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="grid min-h-full place-items-center p-8 text-center">
                            <div>
                                <div className="mx-auto grid size-12 place-items-center border border-dashed border-off-white/20 font-mono text-flare">
                                    00
                                </div>
                                <h3 className="mt-5 font-heavy text-lg uppercase">No live plan</h3>
                                <p className="mt-2 max-w-56 text-xs leading-relaxed text-off-white/35">
                                    Send a scraping instruction. This panel only displays data
                                    returned by the backend.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 border-t border-off-white/10 p-4">
                    <p className="text-center font-mono text-[9px] leading-relaxed text-off-white/25 uppercase">
                        Run controls unlock when the backend exposes execution and results APIs.
                    </p>
                </div>
            </aside>
        </>
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
