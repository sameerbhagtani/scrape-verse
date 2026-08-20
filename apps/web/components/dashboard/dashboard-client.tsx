"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

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
    const [actionsOpen, setActionsOpen] = useState(false);
    const [conversationTitle, setConversationTitle] = useState("New scrape");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const hasConversation = messages.length > 0;
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
        <main className="h-dvh min-h-[640px] overflow-hidden bg-black text-white">
            <TopBar
                onOpenSidebar={() => setSidebarOpen(true)}
                onOpenActions={() => setActionsOpen(true)}
            />

            <div className="grid h-[calc(100%-56px)] gap-2 p-2 md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
                <Sidebar
                    open={sidebarOpen}
                    title={conversationTitle}
                    hasConversation={hasConversation}
                    fieldCount={latestFields.length}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={startNewChat}
                />

                <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
                    >
                        <Image
                            src="/images/spider-peek.png"
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-cover object-[center_18%] opacity-90"
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-[#0c0c0c]/55 to-[#0c0c0c]" />
                    </div>

                    <div className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
                        <div className="flex items-center gap-2">
                            <AgentMark />
                            <span className="text-sm font-medium">{conversationTitle}</span>
                        </div>
                        <span className="font-mono text-[9px] tracking-widest text-white/30 uppercase">
                            Auto-plan
                        </span>
                    </div>

                    <div className="relative z-10 min-h-0 flex-1">
                        <div className="absolute inset-0 overflow-y-auto px-4 pb-36 pt-5 sm:px-6">
                            {!hasConversation ? <EmptyState /> : null}

                            <div className="mx-auto flex max-w-2xl flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((message) => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))}
                                </AnimatePresence>
                                {isPlanning ? <ThinkingIndicator /> : null}
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

                <ActionsPanel
                    open={actionsOpen}
                    fields={latestFields}
                    onClose={() => setActionsOpen(false)}
                />
            </div>
        </main>
    );
}

function TopBar({
    onOpenSidebar,
    onOpenActions,
}: {
    onOpenSidebar: () => void;
    onOpenActions: () => void;
}) {
    return (
        <header className="flex h-14 items-center justify-between gap-4 px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    aria-label="Open chats"
                    onClick={onOpenSidebar}
                    className="grid size-8 place-items-center rounded-md text-white/70 hover:bg-white/[0.06] md:hidden"
                >
                    <MenuIcon />
                </button>
                <Link href="/" className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">Agent</p>
                    <p className="hidden truncate text-[11px] text-white/35 sm:block">
                        scraper assistant — live planner
                    </p>
                </Link>
            </div>

            <label className="hidden min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-[#121212] px-3 py-1.5 text-xs text-white/35 lg:flex">
                <SearchIcon />
                <span>Search commands...</span>
                <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px]">
                    ⌘K
                </span>
            </label>

            <div className="flex items-center gap-2">
                <ApiStatus />
                <button
                    type="button"
                    aria-label="Open actions"
                    onClick={onOpenActions}
                    className="grid size-8 place-items-center rounded-md text-white/70 hover:bg-white/[0.06] xl:hidden"
                >
                    <CheckIcon />
                </button>
            </div>
        </header>
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
                    aria-label="Close chats"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 md:hidden"
                />
            ) : null}

            <aside
                className={`fixed inset-y-2 left-2 z-50 flex w-[240px] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c] transition-transform duration-300 md:static md:inset-auto md:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-[120%]"
                }`}
            >
                <div className="flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <ChatIcon />
                        Chats
                    </div>
                    <button
                        type="button"
                        onClick={onNewChat}
                        className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/70 hover:border-flare/40 hover:text-white"
                    >
                        + New
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                    {hasConversation ? (
                        <div className="rounded-lg bg-white/[0.06] px-3 py-3">
                            <p className="truncate text-[13px] font-medium">{title}</p>
                            <p className="mt-1 text-[11px] text-white/35">
                                {messagesLabel(fieldCount)}
                            </p>
                        </div>
                    ) : (
                        <p className="px-3 py-8 text-center text-[12px] leading-relaxed text-white/30">
                            No chats yet. Start one from the composer.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 border-t border-white/[0.07] px-3 py-3">
                    <div className="grid size-8 place-items-center rounded-full bg-flare text-[10px] font-semibold">
                        IS
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">Operator</p>
                        <p className="text-[10px] text-white/30">signed in</p>
                    </div>
                    <Link href="/login" className="text-[10px] text-white/30 hover:text-flare">
                        Exit
                    </Link>
                </div>
            </aside>
        </>
    );
}

function ActionsPanel({
    open,
    fields,
    onClose,
}: {
    open: boolean;
    fields: FieldPlan[];
    onClose: () => void;
}) {
    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close actions"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 xl:hidden"
                />
            ) : null}

            <aside
                className={`fixed inset-y-2 right-2 z-50 flex w-[280px] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c] transition-transform duration-300 xl:static xl:inset-auto xl:translate-x-0 ${
                    open ? "translate-x-0" : "translate-x-[120%]"
                }`}
            >
                <div className="flex h-12 items-center gap-2 px-4 text-sm font-medium">
                    <CheckIcon />
                    Actions
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
                    {fields.length ? (
                        <div className="space-y-2">
                            <p className="text-[11px] text-white/35">
                                Live fields returned by the planner.
                            </p>
                            {fields.map((field) => (
                                <div
                                    key={field.name}
                                    className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-[12px] font-medium">
                                            {field.name}
                                        </span>
                                        <span className="shrink-0 text-[10px] text-flare uppercase">
                                            {field.type}
                                        </span>
                                    </div>
                                    {field.description ? (
                                        <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                                            {field.description}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="pt-16 text-center text-[12px] leading-relaxed text-white/30">
                            Planned fields and run actions appear here after the backend returns a
                            live schema.
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
}

function EmptyState() {
    return (
        <div className="mx-auto max-w-md pb-8 pt-10 text-center">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                What should we scrape?
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
                Describe a target and the data you need. The planner response comes from the live
                API only.
            </p>
        </div>
    );
}

function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className={`flex ${isUser ? "justify-end" : "items-start gap-2"}`}
        >
            {isUser ? (
                <div className="max-w-[82%] rounded-2xl bg-[#3a1010] px-3.5 py-2.5 text-[13px] leading-6 text-white/90">
                    {message.content}
                </div>
            ) : (
                <>
                    <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/50">
                        <AgentMark small />
                    </div>
                    <div className="max-w-[82%] rounded-2xl bg-[#161616] px-3.5 py-2.5 text-[13px] leading-6 text-white/80">
                        <p>{message.content}</p>
                        {message.fields?.length ? <SchemaCard fields={message.fields} /> : null}
                    </div>
                </>
            )}
        </motion.article>
    );
}

function SchemaCard({ fields }: { fields: FieldPlan[] }) {
    return (
        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.08] bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] text-white/40">
                <span>Live extraction plan</span>
                <span className="text-flare">{fields.length} fields</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className="flex items-start justify-between gap-3 px-3 py-2"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-[12px] text-white/80">{field.name}</p>
                            <p className="text-[11px] text-white/35">{field.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-flare uppercase">
                            {field.type}
                        </span>
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
            className="flex items-center gap-2 text-[12px] text-white/40"
        >
            <div className="grid size-6 place-items-center rounded-full border border-white/10">
                <AgentMark small />
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
            Contacting planner
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
        <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-10 sm:px-4">
            <form
                onSubmit={onSubmit}
                className="relative rounded-xl border border-white/[0.1] bg-[#141414] px-3 py-2"
            >
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Ask Agent to scrape anything..."
                    className="max-h-32 min-h-11 w-full resize-none bg-transparent pr-12 text-sm text-white outline-none placeholder:text-white/30"
                />
                <button
                    type="submit"
                    aria-label="Send"
                    disabled={!value.trim() || pending}
                    className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-md bg-flare text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
                >
                    <SendIcon />
                </button>
            </form>
        </div>
    );
}

function ApiStatus() {
    const [online, setOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/health`, { signal: controller.signal })
            .then((response) => setOnline(response.ok))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setOnline(false);
            });
        return () => controller.abort();
    }, []);

    const label = online === null ? "CHECKING" : online ? "CONNECTED" : "OFFLINE";

    return (
        <span className="inline-flex items-center gap-2 rounded-md bg-[#2a0d0d] px-2.5 py-1.5 text-[10px] font-medium tracking-wide text-white/80 uppercase">
            <span
                className={`size-1.5 rounded-full ${
                    online ? "bg-flare" : online === null ? "bg-white/30" : "bg-white/25"
                }`}
            />
            API {label}
        </span>
    );
}

function messagesLabel(fieldCount: number) {
    return fieldCount ? `${fieldCount} fields · current` : "current session";
}

function AgentMark({ small = false }: { small?: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={small ? "size-3.5" : "size-4"}
            fill="none"
            stroke="currentColor"
        >
            <rect x="5" y="7" width="14" height="11" rx="3" strokeWidth="1.6" />
            <path d="M9 12h.01M15 12h.01M9 15h6" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor">
            <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6A1.5 1.5 0 0 1 14.5 13H8l-4 3V5.5Z"
                strokeWidth="1.4"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor">
            <circle cx="10" cy="10" r="6.5" strokeWidth="1.4" />
            <path d="m7.5 10 1.8 1.8 3.2-3.6" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor">
            <circle cx="9" cy="9" r="5" strokeWidth="1.4" />
            <path d="m13 13 3 3" strokeWidth="1.4" strokeLinecap="round" />
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
        <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor">
            <path d="M3.2 10.2 16.4 4.1c.6-.3 1.2.4.9 1L13 16.8a.8.8 0 0 1-1.4.2l-2.6-4.2-4.4.8a.6.6 0 0 1-.7-.8l.3-2.6Z" />
        </svg>
    );
}
