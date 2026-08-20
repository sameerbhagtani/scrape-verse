"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

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
    status?: "success" | "error";
};

type PlanResponse = {
    data?: {
        fields?: FieldPlan[];
    };
};

function timestamp() {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
}

export function DashboardClient() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [instruction, setInstruction] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversationTitle, setConversationTitle] = useState("New scrape");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const hasConversation = messages.length > 1;
    const latestFields = useMemo(
        () => [...messages].reverse().find((message) => message.fields?.length)?.fields ?? [],
        [messages],
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isPlanning]);

    function startNewChat() {
        setMessages([]);
        setInstruction("");
        setConversationTitle("New scrape");
        setSidebarOpen(false);
    }

    async function submitInstruction(event?: FormEvent) {
        event?.preventDefault();
        const request = instruction.trim();
        if (!request || isPlanning) return;

        setMessages((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                role: "user",
                timestamp: timestamp(),
                content: request,
            },
        ]);
        setConversationTitle(request.slice(0, 38));
        setInstruction("");
        setIsPlanning(true);

        try {
            const response = await fetch(`${API_URL}/scraper/plan`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ instruction: request }),
            });

            if (!response.ok) throw new Error("Planning request failed");
            const payload = (await response.json()) as PlanResponse;
            const fields = payload.data?.fields?.filter((field) => field.name) ?? [];
            if (!fields.length) throw new Error("Planning API returned no fields");

            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    status: "success",
                    content: `The live planner returned ${fields.length} extraction fields.`,
                    fields,
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    status: "error",
                    content:
                        "I couldn’t reach the scraping API. No fields or results were generated. Check the backend and try again.",
                },
            ]);
        } finally {
            setIsPlanning(false);
        }
    }

    function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submitInstruction();
        }
    }

    return (
        <main className="h-dvh min-h-[620px] overflow-hidden bg-[#050505] text-off-white selection:bg-flare">
            <div className="flex h-full">
                <Sidebar
                    open={sidebarOpen}
                    title={conversationTitle}
                    hasConversation={hasConversation}
                    fieldCount={latestFields.length}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={startNewChat}
                />

                <section className="relative flex min-w-0 flex-1 flex-col">
                    <Header title={conversationTitle} onOpenSidebar={() => setSidebarOpen(true)} />

                    <div className="relative min-h-0 flex-1">
                        <div className="absolute inset-0 overflow-y-auto px-4 pb-40 pt-8 sm:px-8">
                            <div className="mx-auto w-full max-w-3xl">
                                {!hasConversation ? <EmptyState /> : null}

                                <div className="space-y-8">
                                    <AnimatePresence initial={false}>
                                        {messages.map((message) => (
                                            <ChatMessage key={message.id} message={message} />
                                        ))}
                                    </AnimatePresence>
                                    {isPlanning ? <ThinkingIndicator /> : null}
                                    <div ref={messagesEndRef} aria-hidden="true" />
                                </div>
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
            </div>
        </main>
    );
}

function Sidebar({
    open,
    title,
    hasConversation,
    fieldCount,
    onClose,
    onNewChat,
}: {
    open: boolean;
    title: string;
    hasConversation: boolean;
    fieldCount: number;
    onClose: () => void;
    onNewChat: () => void;
}) {
    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 md:hidden"
                />
            ) : null}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.07] bg-[#0b0b0b] transition-transform duration-300 md:static md:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="size-2 bg-flare" />
                        <span className="font-heavy text-sm tracking-[-0.03em] uppercase">
                            ScrapVerse <span className="text-flare">Go</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        onClick={onClose}
                        className="font-mono text-[10px] text-white/35 md:hidden"
                    >
                        ESC
                    </button>
                </div>

                <div className="px-3 py-2">
                    <button
                        type="button"
                        onClick={onNewChat}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06]"
                    >
                        <NewChatIcon />
                        New scrape
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                    <p className="px-3 font-mono text-[9px] tracking-[0.16em] text-white/30 uppercase">
                        Chats
                    </p>
                    <div className="mt-2">
                        <div className="rounded-lg bg-white/[0.055] px-3 py-3">
                            <div className="flex items-start justify-between gap-2">
                                <p className="min-w-0 flex-1 truncate text-sm">{title}</p>
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-flare" />
                            </div>
                            <p className="mt-2 font-mono text-[9px] text-white/30">
                                {hasConversation
                                    ? fieldCount
                                        ? `${fieldCount} LIVE FIELDS`
                                        : "CURRENT SESSION"
                                    : "EMPTY SESSION"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/[0.07] p-3">
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <div className="grid size-8 place-items-center rounded-full bg-flare text-[10px] font-black">
                            OP
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">Operator</p>
                            <p className="font-mono text-[8px] text-white/30">SCRAPVERSE ACCESS</p>
                        </div>
                        <Link
                            href="/login"
                            className="font-mono text-[9px] text-white/30 hover:text-flare"
                        >
                            EXIT
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}

function Header({ title, onOpenSidebar }: { title: string; onOpenSidebar: () => void }) {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
            <button
                type="button"
                aria-label="Open sidebar"
                onClick={onOpenSidebar}
                className="grid size-8 place-items-center rounded-md hover:bg-white/[0.06] md:hidden"
            >
                <MenuIcon />
            </button>

            <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white/55">{title}</p>
            </div>

            <HealthBadge />
        </header>
    );
}

function EmptyState() {
    return (
        <div className="pb-10 pt-[8vh] text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl border border-flare/35 bg-flare/10 font-heavy text-sm text-flare">
                SV
            </div>
            <h1 className="mt-5 font-heavy text-3xl tracking-[-0.04em] sm:text-4xl">
                What should we scrape?
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/40">
                Describe a target and the fields you need. The response will come directly from the
                live scraping planner.
            </p>
        </div>
    );
}

function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className={isUser ? "flex justify-end" : ""}
        >
            {isUser ? (
                <div className="max-w-[85%] sm:max-w-[72%]">
                    <div className="rounded-2xl rounded-br-md bg-flare px-4 py-3 text-sm leading-relaxed text-white">
                        {message.content}
                    </div>
                    <p className="mt-1.5 text-right font-mono text-[8px] text-white/20">
                        {message.timestamp}
                    </p>
                </div>
            ) : (
                <div className="flex max-w-full gap-3">
                    <div
                        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border text-[8px] font-black ${
                            message.status === "error"
                                ? "border-flare/50 bg-flare/10 text-flare"
                                : "border-white/15 bg-white/[0.04] text-white/65"
                        }`}
                    >
                        SV
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">ScrapeVerse</span>
                            {message.status ? (
                                <span
                                    className={`font-mono text-[8px] uppercase ${
                                        message.status === "success"
                                            ? "text-emerald-400"
                                            : "text-flare"
                                    }`}
                                >
                                    {message.status === "success" ? "Live API" : "API error"}
                                </span>
                            ) : null}
                            <span className="font-mono text-[8px] text-white/20">
                                {message.timestamp}
                            </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/75">{message.content}</p>
                        {message.fields?.length ? <SchemaCard fields={message.fields} /> : null}
                    </div>
                </div>
            )}
        </motion.article>
    );
}

function SchemaCard({ fields }: { fields: FieldPlan[] }) {
    return (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <span className="font-mono text-[9px] tracking-[0.14em] text-white/40 uppercase">
                    Live extraction plan
                </span>
                <span className="font-mono text-[9px] text-flare">{fields.length} FIELDS</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto_1.4fr] sm:items-center sm:gap-4"
                    >
                        <span className="font-mono text-[10px] font-semibold text-white/80">
                            {field.name}
                        </span>
                        <span className="w-fit rounded-full border border-flare/25 bg-flare/5 px-2 py-0.5 font-mono text-[8px] text-flare uppercase">
                            {field.type}
                        </span>
                        <span className="text-[11px] text-white/35">{field.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ThinkingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
        >
            <div className="grid size-7 place-items-center rounded-full border border-white/15 text-[8px] font-black text-white/60">
                SV
            </div>
            <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                    <motion.span
                        key={index}
                        className="size-1 rounded-full bg-flare"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 0.85, repeat: Infinity, delay: index * 0.12 }}
                    />
                ))}
            </div>
            <span className="font-mono text-[9px] text-white/30 uppercase">Contacting planner</span>
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
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#050505] via-[#050505] to-transparent px-4 pb-5 pt-12 sm:px-8">
            <form
                onSubmit={onSubmit}
                className="mx-auto max-w-3xl rounded-2xl border border-white/[0.12] bg-[#171717] p-2 shadow-2xl transition-colors focus-within:border-flare/45"
            >
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Ask ScrapVerse to scrape anything"
                    className="max-h-36 min-h-11 w-full resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                    <span className="font-mono text-[8px] text-white/20 uppercase">
                        Shift + Enter for new line
                    </span>
                    <button
                        type="submit"
                        aria-label="Send scraping request"
                        disabled={!value.trim() || pending}
                        className="grid size-9 place-items-center rounded-full bg-flare text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/20"
                    >
                        <SendIcon />
                    </button>
                </div>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center font-mono text-[8px] text-white/15">
                Only live API responses are shown
            </p>
        </div>
    );
}

function NewChatIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor">
            <path d="M10 4v12M4 10h12" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor">
            <path d="M3 5h14M3 10h14M3 15h9" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor">
            <path d="m5 10 5-5 5 5M10 5v10" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    );
}
