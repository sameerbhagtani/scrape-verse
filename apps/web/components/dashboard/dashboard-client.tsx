"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
    type FormEvent,
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type { ApiResponse, FieldPlan, ScraperPlanResponse } from "@scrape-verse/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
const ease = [0.19, 1, 0.22, 1] as const;
const CHATS_WIDTH = 288;

type Message = {
    id: string;
    role: "agent" | "user";
    content: string;
    timestamp: string;
    fields?: FieldPlan[];
    status?: "success" | "error";
};

type ChatSession = {
    id: string;
    title: string;
    messages: Message[];
};

type PlanResponse = ApiResponse<ScraperPlanResponse>;

function timestamp() {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
}

function useSlideDrawer(open: boolean, setOpen: (open: boolean) => void, width: number) {
    const [drag, setDrag] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const draggingRef = useRef(false);
    const originX = useRef(0);
    const dragRef = useRef(0);
    const openRef = useRef(open);
    openRef.current = open;

    const x = (open ? 0 : -width) + drag;

    function onPointerDown(event: PointerEvent<HTMLElement>) {
        draggingRef.current = true;
        setIsDragging(true);
        originX.current = event.clientX;
        dragRef.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent<HTMLElement>) {
        if (!draggingRef.current) return;
        const delta = event.clientX - originX.current;
        const next = openRef.current
            ? Math.min(0, Math.max(-width, delta))
            : Math.min(width, Math.max(0, delta));
        dragRef.current = next;
        setDrag(next);
    }

    function onPointerUp() {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        const current = dragRef.current;
        const shouldOpen = openRef.current
            ? Math.abs(current) < width * 0.32
            : current > width * 0.32;
        setOpen(shouldOpen);
        setDrag(0);
        dragRef.current = 0;
        setIsDragging(false);
    }

    return { x, isDragging, onPointerDown, onPointerMove, onPointerUp };
}

export function DashboardClient() {
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [instruction, setInstruction] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = chats.find((chat) => chat.id === activeId) ?? null;
    const messages = activeChat?.messages ?? [];
    const conversationTitle = activeChat?.title ?? "New scrape";
    const hasConversation = messages.length > 0;
    const latestFields = useMemo(
        () => [...messages].reverse().find((message) => message.fields?.length)?.fields ?? [],
        [messages],
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isPlanning]);

    function startNewChat() {
        const id = crypto.randomUUID();
        setChats((current) => [{ id, title: "New scrape", messages: [] }, ...current]);
        setActiveId(id);
        setInstruction("");
    }

    function selectChat(id: string) {
        setActiveId(id);
        setInstruction("");
    }

    function patchActive(
        chatId: string,
        updater: (messages: Message[]) => Message[],
        title?: string,
    ) {
        setChats((current) => {
            const exists = current.some((chat) => chat.id === chatId);
            if (!exists) {
                return [
                    {
                        id: chatId,
                        title: title ?? "New scrape",
                        messages: updater([]),
                    },
                    ...current,
                ];
            }

            return current.map((chat) =>
                chat.id === chatId
                    ? {
                          ...chat,
                          title: title ?? chat.title,
                          messages: updater(chat.messages),
                      }
                    : chat,
            );
        });
    }

    async function submitInstruction(event?: FormEvent) {
        event?.preventDefault();
        const request = instruction.trim();
        if (!request || isPlanning) return;

        const chatId = activeId ?? crypto.randomUUID();
        if (!activeId) setActiveId(chatId);

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            timestamp: timestamp(),
            content: request,
        };

        patchActive(chatId, (current) => [...current, userMessage], request.slice(0, 38));
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

            patchActive(chatId, (current) => [
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
            patchActive(chatId, (current) => [
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
        <main
            data-dashboard-shell
            className="relative h-full w-full overflow-hidden bg-black text-white"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
                <Image
                    src="/images/spider-verse-bg.png"
                    alt=""
                    fill
                    priority
                    unoptimized
                    sizes="100vw"
                    className="dashboard-screen-bg object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/25" />
            </div>

            <TopBar
                chatsOpen={sidebarOpen}
                title={conversationTitle}
                onToggleChats={() => setSidebarOpen((current) => !current)}
            />

            <section className="absolute inset-0 z-10 flex min-h-0 flex-col">
                <div className="relative min-h-0 flex-1">
                    {!hasConversation ? (
                        <div className="absolute inset-0 flex items-center justify-center px-6">
                            <EmptyState />
                        </div>
                    ) : (
                        <div className="absolute inset-0 overflow-y-auto px-5 pb-4 pt-20 sm:px-8">
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((message) => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))}
                                </AnimatePresence>
                                {isPlanning ? <ThinkingIndicator /> : null}
                                <div ref={messagesEndRef} aria-hidden="true" />
                            </div>
                        </div>
                    )}
                </div>

                <Composer
                    value={instruction}
                    pending={isPlanning}
                    onChange={setInstruction}
                    onKeyDown={handleComposerKeyDown}
                    onSubmit={submitInstruction}
                />
            </section>

            <Sidebar
                open={sidebarOpen}
                chats={chats}
                activeId={activeId}
                fieldCount={latestFields.length}
                onOpen={() => setSidebarOpen(true)}
                onClose={() => setSidebarOpen(false)}
                onNewChat={startNewChat}
                onSelectChat={selectChat}
                onOpenActions={() => setActionsOpen(true)}
            />

            <ActionsPanel
                open={actionsOpen}
                fields={latestFields}
                onClose={() => setActionsOpen(false)}
            />
        </main>
    );
}

function TopBar({
    chatsOpen,
    title,
    onToggleChats,
}: {
    chatsOpen: boolean;
    title: string;
    onToggleChats: () => void;
}) {
    return (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex h-16 items-center justify-between gap-4 bg-transparent px-4 pt-1 sm:px-6">
            <div className="pointer-events-auto flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    aria-label={chatsOpen ? "Hide chats" : "Show chats"}
                    onClick={onToggleChats}
                    className="grid size-9 place-items-center rounded-full text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] hover:bg-white/10"
                >
                    <MenuIcon />
                </button>
                <Link href="/" className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.75)]">
                        Agent
                    </p>
                    <p className="hidden truncate text-[11px] text-white/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:block">
                        scraper assistant — live planner
                    </p>
                </Link>
            </div>

            <div className="pointer-events-auto flex min-w-0 items-center gap-3">
                <div className="hidden min-w-0 items-center gap-2 sm:flex">
                    <AgentMark />
                    <span className="truncate text-sm text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.75)]">
                        {title}
                    </span>
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[9px] tracking-widest text-white/70 uppercase backdrop-blur-[2px]">
                    Auto-plan
                </span>
            </div>
        </header>
    );
}

function Sidebar({
    open,
    chats,
    activeId,
    fieldCount,
    onOpen,
    onClose,
    onNewChat,
    onSelectChat,
    onOpenActions,
}: {
    open: boolean;
    chats: ChatSession[];
    activeId: string | null;
    fieldCount: number;
    onOpen: () => void;
    onClose: () => void;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onOpenActions: () => void;
}) {
    const [query, setQuery] = useState("");
    const { x, isDragging, onPointerDown, onPointerMove, onPointerUp } = useSlideDrawer(
        open,
        (next) => (next ? onOpen() : onClose()),
        CHATS_WIDTH,
    );
    const visibleChats = chats.filter((chat) =>
        chat.title.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close chats"
                    onClick={onClose}
                    className="fixed inset-0 top-16 z-40 bg-black/25"
                />
            ) : null}

            <aside
                style={{
                    width: CHATS_WIDTH,
                    transform: `translateX(${x}px)`,
                    transition: isDragging
                        ? "none"
                        : "transform 280ms cubic-bezier(0.19, 1, 0.22, 1)",
                }}
                className={`glass-panel fixed top-16 bottom-0 left-0 z-50 flex h-auto min-h-0 flex-col overflow-hidden border-r text-white ${
                    open ? "" : "pointer-events-none"
                }`}
            >
                <div className="relative z-20 flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <ChatIcon />
                        Chats
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onNewChat();
                            }}
                            className="glass-chip rounded-md px-2 py-1 text-[11px] text-white hover:bg-white/20"
                        >
                            + New
                        </button>
                        <button
                            type="button"
                            aria-label="Hide chats"
                            onClick={onClose}
                            className="grid size-7 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="px-3 pb-3">
                    <label className="glass-chip flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/55">
                        <SearchIcon />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search chats..."
                            className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
                        />
                    </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                    {visibleChats.length ? (
                        <div className="space-y-1">
                            {visibleChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() => onSelectChat(chat.id)}
                                    className={`w-full rounded-lg px-3 py-3 text-left ${
                                        chat.id === activeId
                                            ? "glass-chip-active"
                                            : "hover:bg-white/10"
                                    }`}
                                >
                                    <p className="truncate text-[13px] font-medium text-white">
                                        {chat.title}
                                    </p>
                                    <p className="mt-1 text-[11px] text-white/50">
                                        {chat.messages.length
                                            ? `${chat.messages.length} messages`
                                            : "empty"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="px-3 py-8 text-center text-[12px] leading-relaxed text-white/50">
                            No chats yet. Tap + New to start one.
                        </p>
                    )}
                </div>

                <div className="space-y-2 border-t border-white/15 px-3 py-3">
                    <ApiStatus />
                    <button
                        type="button"
                        onClick={onOpenActions}
                        className="glass-chip flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] text-white hover:bg-white/20"
                    >
                        <span className="inline-flex items-center gap-2">
                            <CheckIcon />
                            Actions
                        </span>
                        {fieldCount ? (
                            <span className="grid min-w-4 place-items-center rounded-full bg-flare px-1 text-[9px] text-white">
                                {fieldCount}
                            </span>
                        ) : null}
                    </button>
                </div>

                <div className="flex items-center gap-3 border-t border-white/15 px-3 py-3">
                    <div className="grid size-8 place-items-center rounded-full bg-flare text-[10px] font-semibold text-white">
                        IS
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white">Operator</p>
                        <p className="text-[10px] text-white/50">signed in</p>
                    </div>
                    <Link href="/login" className="text-[10px] text-white/50 hover:text-white">
                        Exit
                    </Link>
                </div>

                <div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="absolute top-12 right-0 bottom-0 z-10 w-2 cursor-ew-resize touch-none"
                />
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
                    className="fixed inset-0 top-16 z-40 bg-black/25"
                />
            ) : null}

            <aside
                className={`glass-panel fixed top-16 bottom-0 right-0 z-50 flex h-auto w-[19rem] min-h-0 flex-col overflow-hidden border-l text-white transition-transform duration-300 ${
                    open ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
            >
                <div className="flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckIcon />
                        Actions
                    </div>
                    <button
                        type="button"
                        aria-label="Close actions"
                        onClick={onClose}
                        className="grid size-7 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
                    {fields.length ? (
                        <div className="space-y-2">
                            <p className="text-[11px] text-white/50">
                                Live fields returned by the planner.
                            </p>
                            {fields.map((field) => (
                                <div key={field.name} className="glass-chip rounded-lg px-3 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-[12px] font-medium">
                                            {field.name}
                                        </span>
                                        <span className="shrink-0 text-[10px] text-flare uppercase">
                                            {field.type}
                                        </span>
                                    </div>
                                    {field.description ? (
                                        <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                                            {field.description}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="pt-16 text-center text-[12px] leading-relaxed text-white/50">
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
        <div className="max-w-xl px-4 text-center">
            <h1 className="text-4xl font-medium tracking-tight [text-shadow:0_2px_28px_rgba(0,0,0,0.9)] sm:text-5xl">
                What should we scrape?
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/85 [text-shadow:0_1px_16px_rgba(0,0,0,0.8)] sm:text-base">
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
                <div className="glass-chip max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 text-white">
                    {message.content}
                </div>
            ) : (
                <>
                    <div className="glass-chip mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white/70">
                        <AgentMark small />
                    </div>
                    <div className="glass-chip max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 text-white/90">
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
        <div className="glass-chip mt-3 overflow-hidden rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] text-white/50">
                <span>Live extraction plan</span>
                <span className="text-flare">{fields.length} fields</span>
            </div>
            <div className="divide-y divide-white/10">
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className="flex items-start justify-between gap-3 px-3 py-2"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-[12px] text-white">{field.name}</p>
                            <p className="text-[11px] text-white/50">{field.description}</p>
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
            className="flex items-center gap-2 text-[12px] text-white/80"
        >
            <div className="glass-chip grid size-6 place-items-center rounded-full text-white/80">
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
        <div className="shrink-0 px-4 pb-5 pt-3 sm:px-8">
            <form onSubmit={onSubmit} className="glass-panel relative rounded-xl border px-3 py-2">
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Ask Agent to scrape anything..."
                    className="max-h-32 min-h-11 w-full resize-none bg-transparent pr-12 text-sm text-white outline-none placeholder:text-white/45"
                />
                <button
                    type="submit"
                    aria-label="Send"
                    disabled={!value.trim() || pending}
                    className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-md bg-flare text-white disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/30"
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
        <span className="glass-chip inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium tracking-wide text-white/80 uppercase">
            <span
                className={`size-1.5 rounded-full ${
                    online ? "bg-flare" : online === null ? "bg-white/40" : "bg-white/35"
                }`}
            />
            API {label}
        </span>
    );
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
