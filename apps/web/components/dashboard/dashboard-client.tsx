"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    type FormEvent,
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    ApiResponse,
    FieldPlan,
    QualityMetrics,
    SchemaField,
    ScraperConfig,
    ScraperLog,
    ScraperPlanResponse,
    ScraperRunResult,
    ScraperStatus,
    User,
} from "@scrape-verse/types";
import { useAuth } from "~/providers/auth-provider";

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
    targetUrl?: string;
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
    const router = useRouter();
    const { user, logout, isLoading, isAuthenticated } = useAuth();
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated || !user) {
            router.replace("/login");
            return;
        }
        if (!user.isVerified) {
            router.replace(`/verify?email=${encodeURIComponent(user.email)}`);
        }
    }, [isLoading, isAuthenticated, user, router]);
    const [instruction, setInstruction] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [resultsTab, setResultsTab] = useState<"data" | "quality" | "healing" | "logs">("data");

    const [savedScrapers, setSavedScrapers] = useState<ScraperConfig[]>([]);
    const [activeScraper, setActiveScraper] = useState<ScraperConfig | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [lastRunResult, setLastRunResult] = useState<ScraperRunResult | null>(null);
    const [scrapedDataItems, setScrapedDataItems] = useState<Record<string, any>[]>([]);
    const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);
    const [htmlOverride, setHtmlOverride] = useState("");
    const [targetUrlInput, setTargetUrlInput] = useState("https://books.toscrape.com");
    const [scraperNameInput, setScraperNameInput] = useState("Product Catalog Scraper");
    const [itemSelectorInput, setItemSelectorInput] = useState(".product_pod");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = chats.find((chat) => chat.id === activeId) ?? null;
    const messages = activeChat?.messages ?? [];
    const conversationTitle = activeChat?.title ?? "New scrape";
    const hasConversation = messages.length > 0;
    const latestFields = useMemo(
        () => [...messages].reverse().find((message) => message.fields?.length)?.fields ?? [],
        [messages],
    );

    const loadScrapers = async () => {
        try {
            const res = await fetch(`${API_URL}/scraper`);
            if (res.ok) {
                const data = (await res.json()) as ApiResponse<ScraperConfig[]>;
                if (data.data) {
                    setSavedScrapers(data.data);
                    if (!activeScraper && data.data.length > 0 && data.data[0]) {
                        setActiveScraper(data.data[0]);
                    }
                }
            }
        } catch {}
    };

    useEffect(() => {
        void loadScrapers();
    }, []);

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

        const urlMatch = request.match(/https?:\/\/[^\s]+/i);
        if (urlMatch && urlMatch[0]) {
            setTargetUrlInput(urlMatch[0]);
        }

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
                    content: `The AI planner generated ${fields.length} extraction fields for your request. You can now deploy and test this scraper.`,
                    fields,
                },
            ]);
            setActionsOpen(true);
        } catch {
            patchActive(chatId, (current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    status: "error",
                    content:
                        "I couldn't reach the scraping API. Ensure the backend server is running and try again.",
                },
            ]);
        } finally {
            setIsPlanning(false);
        }
    }

    async function deployScraper() {
        if (!latestFields.length || isDeploying) return;
        setIsDeploying(true);

        try {
            const schemaRes = await fetch(`${API_URL}/scraper/schema`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ fields: latestFields }),
            });

            let fullFields: SchemaField[] = latestFields.map((f) => ({
                name: f.name,
                type: (f.type as any) || "string",
                selector: `.${f.name}`,
                required: f.required ?? true,
                description: f.description,
            }));

            if (schemaRes.ok) {
                const schemaData = (await schemaRes.json()) as ApiResponse<SchemaField[]>;
                if (schemaData.data) fullFields = schemaData.data;
            }

            const createRes = await fetch(`${API_URL}/scraper`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name: scraperNameInput || "Autonomous Scraper",
                    collectorId: `col_${Date.now()}`,
                    targetUrl: targetUrlInput || "https://books.toscrape.com",
                    itemContainerSelector: itemSelectorInput || "",
                    fields: fullFields,
                    deduplicationStrategy: fullFields
                        .filter(
                            (f) =>
                                f.name.toLowerCase().includes("url") ||
                                f.name.toLowerCase().includes("title") ||
                                f.name.toLowerCase().includes("name"),
                        )
                        .map((f) => f.name),
                }),
            });

            if (!createRes.ok) throw new Error("Failed to create scraper");
            const createData = (await createRes.json()) as ApiResponse<ScraperConfig>;

            if (createData.data) {
                setActiveScraper(createData.data);
                setSavedScrapers((prev) => [createData.data!, ...prev]);
                patchActive(activeId || "default", (current) => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        role: "agent",
                        timestamp: timestamp(),
                        status: "success",
                        content: `Scraper "${createData.data?.name}" deployed successfully (ID: ${createData.data?._id})! Ready to execute live scrape.`,
                    },
                ]);
            }
        } catch (err) {
            patchActive(activeId || "default", (current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    status: "error",
                    content: `Scraper deployment failed: ${(err as Error).message}`,
                },
            ]);
        } finally {
            setIsDeploying(false);
        }
    }

    async function triggerRun(scraperId?: string) {
        const id = scraperId || activeScraper?._id;
        if (!id || isRunning) return;

        setIsRunning(true);
        try {
            const res = await fetch(`${API_URL}/scraper/${id}/run`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    htmlOverride: htmlOverride.trim() || undefined,
                }),
            });

            const data = (await res.json()) as ApiResponse<ScraperRunResult>;
            if (data.data) {
                setLastRunResult(data.data);
                if (data.data.scrapedItems) {
                    setScrapedDataItems(data.data.scrapedItems);
                }
                setResultsOpen(true);
                setResultsTab("data");

                void loadScraperDetails(id);

                patchActive(activeId || "default", (current) => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        role: "agent",
                        timestamp: timestamp(),
                        status: data.data?.success ? "success" : "error",
                        content: `Scraper execution completed: extracted ${data.data?.scrapedItemsCount ?? 0} records with Quality Score ${((data.data?.log?.qualityScore ?? 0) * 100).toFixed(1)}%.`,
                    },
                ]);
            }
        } catch (err) {
            patchActive(activeId || "default", (current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    timestamp: timestamp(),
                    status: "error",
                    content: `Scrape run failed: ${(err as Error).message}`,
                },
            ]);
        } finally {
            setIsRunning(false);
        }
    }

    async function loadScraperDetails(id: string) {
        try {
            const [scraperRes, logsRes, dataRes] = await Promise.all([
                fetch(`${API_URL}/scraper/${id}`),
                fetch(`${API_URL}/scraper/${id}/logs`),
                fetch(`${API_URL}/scraper/${id}/data`),
            ]);

            if (scraperRes.ok) {
                const scData = (await scraperRes.json()) as ApiResponse<ScraperConfig>;
                if (scData.data) setActiveScraper(scData.data);
            }
            if (logsRes.ok) {
                const logData = (await logsRes.json()) as ApiResponse<ScraperLog[]>;
                if (logData.data) setScraperLogs(logData.data);
            }
            if (dataRes.ok) {
                const dtData = (await dataRes.json()) as ApiResponse<{ items: any[] }>;
                if (dtData.data?.items) setScrapedDataItems(dtData.data.items);
            }
        } catch {}
    }

    async function triggerRollback(version: string) {
        if (!activeScraper?._id) return;
        try {
            const res = await fetch(`${API_URL}/scraper/${activeScraper._id}/rollback`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ version }),
            });

            if (res.ok) {
                const data = (await res.json()) as ApiResponse<ScraperConfig>;
                if (data.data) {
                    setActiveScraper(data.data);
                    void loadScraperDetails(data.data._id);
                    patchActive(activeId || "default", (current) => [
                        ...current,
                        {
                            id: crypto.randomUUID(),
                            role: "agent",
                            timestamp: timestamp(),
                            status: "success",
                            content: `Scraper configuration rolled back to version ${version}.`,
                        },
                    ]);
                }
            }
        } catch {}
    }

    function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submitInstruction();
        }
    }

    if (isLoading || !isAuthenticated || !user?.isVerified) {
        return (
            <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-void font-mono text-xs text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full border-2 border-flare border-t-transparent animate-spin" />
                    <p className="tracking-widest uppercase text-white/70">
                        {isLoading
                            ? "AUTHENTICATING MULTIVERSE NODE..."
                            : "VERIFYING CREDENTIALS..."}
                    </p>
                </div>
            </main>
        );
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
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <TopBar
                chatsOpen={sidebarOpen}
                title={conversationTitle}
                activeScraper={activeScraper}
                onToggleChats={() => setSidebarOpen((current) => !current)}
                onOpenResults={() => setResultsOpen(true)}
            />

            <section className="absolute inset-0 z-10 flex min-h-0 flex-col">
                <div className="relative min-h-0 flex-1">
                    {!hasConversation ? (
                        <div className="absolute inset-0 flex items-center justify-center px-6">
                            <EmptyState
                                onSelectPreset={(sample) => {
                                    setInstruction(sample);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 overflow-y-auto px-5 pb-4 pt-20 sm:px-8">
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((message) => (
                                        <ChatMessage
                                            key={message.id}
                                            message={message}
                                            onDeployClick={() => setActionsOpen(true)}
                                        />
                                    ))}
                                </AnimatePresence>
                                {isPlanning ? (
                                    <ThinkingIndicator text="Planning extraction schema" />
                                ) : null}
                                {isRunning ? (
                                    <ThinkingIndicator text="Extracting data & checking self-healing" />
                                ) : null}
                                <div ref={messagesEndRef} aria-hidden="true" />
                            </div>
                        </div>
                    )}
                </div>

                <Composer
                    value={instruction}
                    pending={isPlanning || isRunning}
                    onChange={setInstruction}
                    onKeyDown={handleComposerKeyDown}
                    onSubmit={submitInstruction}
                />
            </section>

            <Sidebar
                open={sidebarOpen}
                chats={chats}
                activeId={activeId}
                savedScrapers={savedScrapers}
                activeScraper={activeScraper}
                fieldCount={latestFields.length}
                user={user}
                onLogout={logout}
                onOpen={() => setSidebarOpen(true)}
                onClose={() => setSidebarOpen(false)}
                onNewChat={startNewChat}
                onSelectChat={selectChat}
                onSelectScraper={(sc) => {
                    setActiveScraper(sc);
                    void loadScraperDetails(sc._id);
                    setActionsOpen(true);
                }}
                onOpenActions={() => setActionsOpen(true)}
            />

            <ActionsPanel
                open={actionsOpen}
                fields={latestFields}
                activeScraper={activeScraper}
                isDeploying={isDeploying}
                isRunning={isRunning}
                targetUrl={targetUrlInput}
                scraperName={scraperNameInput}
                itemSelector={itemSelectorInput}
                htmlOverride={htmlOverride}
                onTargetUrlChange={setTargetUrlInput}
                onScraperNameChange={setScraperNameInput}
                onItemSelectorChange={setItemSelectorInput}
                onHtmlOverrideChange={setHtmlOverride}
                onDeploy={deployScraper}
                onRun={() => void triggerRun()}
                onOpenResults={() => setResultsOpen(true)}
                onClose={() => setActionsOpen(false)}
            />

            <ResultsPanel
                open={resultsOpen}
                tab={resultsTab}
                scraper={activeScraper}
                items={scrapedDataItems}
                lastRun={lastRunResult}
                logs={scraperLogs}
                onTabChange={setResultsTab}
                onRollback={triggerRollback}
                onClose={() => setResultsOpen(false)}
            />
        </main>
    );
}

function TopBar({
    chatsOpen,
    title,
    activeScraper,
    onToggleChats,
    onOpenResults,
}: {
    chatsOpen: boolean;
    title: string;
    activeScraper: ScraperConfig | null;
    onToggleChats: () => void;
    onOpenResults: () => void;
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
                        ScrapeVerse Agent
                    </p>
                    <p className="hidden truncate text-[11px] text-white/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:block">
                        Autonomous Self-Healing Scraper
                    </p>
                </Link>
            </div>

            <div className="pointer-events-auto flex min-w-0 items-center gap-3">
                {activeScraper ? (
                    <button
                        type="button"
                        onClick={onOpenResults}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs backdrop-blur-md hover:bg-white/10"
                    >
                        <span
                            className={`size-2 rounded-full ${getStatusColor(activeScraper.status)}`}
                        />
                        <span className="font-mono text-[11px] text-white/90">
                            {activeScraper.name} ({activeScraper.currentVersion})
                        </span>
                    </button>
                ) : null}

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
    savedScrapers,
    activeScraper,
    fieldCount,
    user,
    onLogout,
    onOpen,
    onClose,
    onNewChat,
    onSelectChat,
    onSelectScraper,
    onOpenActions,
}: {
    open: boolean;
    chats: ChatSession[];
    activeId: string | null;
    savedScrapers: ScraperConfig[];
    activeScraper: ScraperConfig | null;
    fieldCount: number;
    user: User | null;
    onLogout: () => void;
    onOpen: () => void;
    onClose: () => void;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onSelectScraper: (sc: ScraperConfig) => void;
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
                    className="fixed inset-0 top-16 z-40 bg-black/35 backdrop-blur-xs"
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
                        Chats & Scrapers
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
                            placeholder="Search..."
                            className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
                        />
                    </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                    {savedScrapers.length > 0 ? (
                        <div className="mb-4">
                            <p className="px-2 pb-1 text-[10px] font-mono tracking-wider text-flare uppercase">
                                Deployed Scrapers
                            </p>
                            <div className="space-y-1">
                                {savedScrapers.map((sc) => (
                                    <button
                                        key={sc._id}
                                        type="button"
                                        onClick={() => onSelectScraper(sc)}
                                        className={`w-full rounded-lg px-3 py-2 text-left transition-all ${
                                            sc._id === activeScraper?._id
                                                ? "glass-chip-active border-flare/40"
                                                : "hover:bg-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-[12px] font-medium text-white">
                                                {sc.name}
                                            </p>
                                            <span
                                                className={`text-[9px] font-mono uppercase ${getStatusTextColor(sc.status)}`}
                                            >
                                                {sc.currentVersion}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-[10px] text-white/40 font-mono">
                                            {sc.targetUrl}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <p className="px-2 pb-1 text-[10px] font-mono tracking-wider text-white/40 uppercase">
                            Recent Chats
                        </p>
                        {visibleChats.length ? (
                            <div className="space-y-1">
                                {visibleChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        type="button"
                                        onClick={() => onSelectChat(chat.id)}
                                        className={`w-full rounded-lg px-3 py-2 text-left ${
                                            chat.id === activeId
                                                ? "glass-chip-active"
                                                : "hover:bg-white/10"
                                        }`}
                                    >
                                        <p className="truncate text-[12px] font-medium text-white">
                                            {chat.title}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-white/50">
                                            {chat.messages.length
                                                ? `${chat.messages.length} messages`
                                                : "empty"}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="px-3 py-4 text-center text-[11px] leading-relaxed text-white/40">
                                No chat history yet.
                            </p>
                        )}
                    </div>
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
                            Scraper Controls
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
                        {user?.name
                            ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                            : "SV"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white">
                            {user?.name || "ScrapeVerse Operator"}
                        </p>
                        <p className="truncate text-[10px] text-white/50">
                            {user?.email || "Connected"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void onLogout();
                            window.location.href = "/login";
                        }}
                        className="text-[10px] text-white/50 hover:text-white cursor-pointer"
                    >
                        Exit
                    </button>
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
    activeScraper,
    isDeploying,
    isRunning,
    targetUrl,
    scraperName,
    itemSelector,
    htmlOverride,
    onTargetUrlChange,
    onScraperNameChange,
    onItemSelectorChange,
    onHtmlOverrideChange,
    onDeploy,
    onRun,
    onOpenResults,
    onClose,
}: {
    open: boolean;
    fields: FieldPlan[];
    activeScraper: ScraperConfig | null;
    isDeploying: boolean;
    isRunning: boolean;
    targetUrl: string;
    scraperName: string;
    itemSelector: string;
    htmlOverride: string;
    onTargetUrlChange: (val: string) => void;
    onScraperNameChange: (val: string) => void;
    onItemSelectorChange: (val: string) => void;
    onHtmlOverrideChange: (val: string) => void;
    onDeploy: () => void;
    onRun: () => void;
    onOpenResults: () => void;
    onClose: () => void;
}) {
    const [overrideOpen, setOverrideOpen] = useState(false);

    return (
        <>
            {open ? (
                <button
                    type="button"
                    aria-label="Close actions"
                    onClick={onClose}
                    className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-xs"
                />
            ) : null}

            <aside
                className={`glass-panel fixed top-16 bottom-0 right-0 z-50 flex h-auto w-[22rem] min-h-0 flex-col overflow-hidden border-l text-white transition-transform duration-300 ${
                    open ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
            >
                <div className="flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckIcon />
                        Scraper Controls
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

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                    {activeScraper ? (
                        <div className="glass-chip rounded-xl p-3.5 space-y-3 border-flare/30">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-white">
                                    {activeScraper.name}
                                </span>
                                <span
                                    className={`text-[10px] font-mono font-bold uppercase ${getStatusTextColor(activeScraper.status)}`}
                                >
                                    {activeScraper.status} ({activeScraper.currentVersion})
                                </span>
                            </div>

                            <p className="text-[11px] font-mono text-white/50 truncate">
                                {activeScraper.targetUrl}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-white/70">
                                <div className="bg-black/30 p-2 rounded">
                                    <p className="text-white/40">Total Runs</p>
                                    <p className="text-sm font-bold text-white">
                                        {activeScraper.totalRuns || 0}
                                    </p>
                                </div>
                                <div className="bg-black/30 p-2 rounded">
                                    <p className="text-white/40">Avg Quality</p>
                                    <p className="text-sm font-bold text-flare">
                                        {((activeScraper.averageQualityScore || 1) * 100).toFixed(
                                            0,
                                        )}
                                        %
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={onRun}
                                    disabled={isRunning}
                                    className="w-full bg-flare text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-flare/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isRunning ? (
                                        <span>Executing Scraper...</span>
                                    ) : (
                                        <>
                                            <PlayIcon />
                                            <span>Run Scraper Now</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={onOpenResults}
                                    className="w-full glass-chip py-2 rounded-lg text-xs text-white/80 hover:bg-white/10 transition-all"
                                >
                                    View Data & Quality Report
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {fields.length > 0 ? (
                        <div className="glass-chip rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white">
                                    Deploy New Configuration
                                </span>
                                <span className="text-[10px] text-flare uppercase font-mono">
                                    {fields.length} Fields Planned
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div>
                                    <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">
                                        Target Website URL
                                    </label>
                                    <input
                                        type="url"
                                        value={targetUrl}
                                        onChange={(e) => onTargetUrlChange(e.target.value)}
                                        placeholder="https://example.com/items"
                                        className="w-full bg-black/40 border border-white/15 px-2.5 py-1.5 text-xs text-white rounded font-mono outline-none focus:border-flare/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">
                                        Scraper Name
                                    </label>
                                    <input
                                        type="text"
                                        value={scraperName}
                                        onChange={(e) => onScraperNameChange(e.target.value)}
                                        placeholder="E-commerce Scraper"
                                        className="w-full bg-black/40 border border-white/15 px-2.5 py-1.5 text-xs text-white rounded outline-none focus:border-flare/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">
                                        Item Container Selector (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={itemSelector}
                                        onChange={(e) => onItemSelectorChange(e.target.value)}
                                        placeholder=".product-card"
                                        className="w-full bg-black/40 border border-white/15 px-2.5 py-1.5 text-xs text-white rounded font-mono outline-none focus:border-flare/50"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onDeploy}
                                disabled={isDeploying || !targetUrl}
                                className="w-full bg-flare text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-flare/90 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isDeploying ? "Deploying..." : "Save & Deploy Scraper"}
                            </button>
                        </div>
                    ) : null}

                    <div className="glass-chip rounded-xl p-3">
                        <button
                            type="button"
                            onClick={() => setOverrideOpen(!overrideOpen)}
                            className="flex w-full items-center justify-between text-xs text-white/70 hover:text-white"
                        >
                            <span>HTML Override (Test Mode)</span>
                            <span>{overrideOpen ? "▲" : "▼"}</span>
                        </button>

                        {overrideOpen ? (
                            <div className="mt-2 space-y-2">
                                <p className="text-[10px] text-white/40">
                                    Paste raw HTML snippet to test extraction or simulate
                                    self-healing locally without hitting external networks.
                                </p>
                                <textarea
                                    value={htmlOverride}
                                    onChange={(e) => onHtmlOverrideChange(e.target.value)}
                                    rows={4}
                                    placeholder="<html>...</html>"
                                    className="w-full bg-black/40 border border-white/15 p-2 text-[11px] font-mono text-white rounded outline-none"
                                />
                            </div>
                        ) : null}
                    </div>

                    {fields.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-[11px] font-mono text-white/50 uppercase">
                                Planned Fields
                            </p>
                            {fields.map((field) => (
                                <div key={field.name} className="glass-chip rounded-lg px-3 py-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-medium text-white">
                                            {field.name}
                                        </span>
                                        <span className="text-[10px] text-flare uppercase font-mono">
                                            {field.type}
                                        </span>
                                    </div>
                                    {field.description ? (
                                        <p className="mt-0.5 text-[10px] text-white/50">
                                            {field.description}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </aside>
        </>
    );
}

function ResultsPanel({
    open,
    tab,
    scraper,
    items,
    lastRun,
    logs,
    onTabChange,
    onRollback,
    onClose,
}: {
    open: boolean;
    tab: "data" | "quality" | "healing" | "logs";
    scraper: ScraperConfig | null;
    items: Record<string, any>[];
    lastRun: ScraperRunResult | null;
    logs: ScraperLog[];
    onTabChange: (tab: "data" | "quality" | "healing" | "logs") => void;
    onRollback: (version: string) => void;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const qualityScore = lastRun?.log?.qualityScore ?? scraper?.averageQualityScore ?? 1;
    const qualityMetrics: QualityMetrics = lastRun?.log?.qualityMetrics ?? {
        completeness: 1,
        validity: 1,
        duplicates: 1,
        schemaMatch: 1,
    };

    function copyJson() {
        navigator.clipboard.writeText(JSON.stringify(items, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease }}
                        className="glass-panel relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border text-white shadow-2xl"
                    >
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-6">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-sm text-white">
                                    {scraper?.name || "Scraper Results"}
                                </h3>
                                <span
                                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getStatusBadgeClass(scraper?.status || "HEALTHY")}`}
                                >
                                    {scraper?.status || "HEALTHY"} (
                                    {scraper?.currentVersion || "v1"})
                                </span>
                            </div>

                            <button
                                type="button"
                                aria-label="Close"
                                onClick={onClose}
                                className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex border-b border-white/10 px-6 gap-6 text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => onTabChange("data")}
                                className={`py-3 border-b-2 transition-colors ${
                                    tab === "data"
                                        ? "border-flare text-flare"
                                        : "border-transparent text-white/60 hover:text-white"
                                }`}
                            >
                                Scraped Data ({items.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange("quality")}
                                className={`py-3 border-b-2 transition-colors ${
                                    tab === "quality"
                                        ? "border-flare text-flare"
                                        : "border-transparent text-white/60 hover:text-white"
                                }`}
                            >
                                Quality Score ({(qualityScore * 100).toFixed(0)}%)
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange("healing")}
                                className={`py-3 border-b-2 transition-colors ${
                                    tab === "healing"
                                        ? "border-flare text-flare"
                                        : "border-transparent text-white/60 hover:text-white"
                                }`}
                            >
                                Self-Healing & Versions
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange("logs")}
                                className={`py-3 border-b-2 transition-colors ${
                                    tab === "logs"
                                        ? "border-flare text-flare"
                                        : "border-transparent text-white/60 hover:text-white"
                                }`}
                            >
                                Run Logs ({logs.length})
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            {tab === "data" ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white/60 font-mono">
                                            Extracted {items.length} records from{" "}
                                            {scraper?.targetUrl}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={copyJson}
                                            className="glass-chip px-3 py-1 text-xs rounded text-white/80 hover:bg-white/20"
                                        >
                                            {copied ? "Copied JSON!" : "Copy JSON"}
                                        </button>
                                    </div>

                                    {items.length > 0 ? (
                                        <div className="space-y-3">
                                            {items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="glass-chip rounded-xl p-3.5 space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                                                        <span>Item #{idx + 1}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                        {Object.entries(item).map(([k, v]) => (
                                                            <div
                                                                key={k}
                                                                className="bg-black/30 p-2 rounded"
                                                            >
                                                                <span className="text-white/40 text-[10px] font-mono block uppercase">
                                                                    {k}
                                                                </span>
                                                                <span className="text-white break-words">
                                                                    {String(v)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="pt-20 text-center text-sm text-white/40">
                                            No scraped records yet. Click "Run Scraper Now" to
                                            extract data.
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {tab === "quality" ? (
                                <div className="space-y-6">
                                    <div className="glass-chip p-6 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-mono text-white/50 uppercase">
                                                Deterministic Quality Score
                                            </p>
                                            <h2 className="text-4xl font-black text-white mt-1">
                                                {(qualityScore * 100).toFixed(1)}%
                                            </h2>
                                            <p className="text-xs text-white/60 mt-1">
                                                Based on completeness, data validity, deduplication,
                                                and schema adherence.
                                            </p>
                                        </div>
                                        <div className="size-20 rounded-full border-4 border-flare/80 flex items-center justify-center text-lg font-bold">
                                            {(qualityScore * 100).toFixed(0)}%
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="glass-chip p-4 rounded-xl space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-white/60">
                                                    Completeness (40%)
                                                </span>
                                                <span className="font-mono text-white">
                                                    {(
                                                        (qualityMetrics.completeness ?? 1) * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-flare h-full rounded-full"
                                                    style={{
                                                        width: `${(qualityMetrics.completeness ?? 1) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="glass-chip p-4 rounded-xl space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-white/60">
                                                    Validity (40%)
                                                </span>
                                                <span className="font-mono text-white">
                                                    {((qualityMetrics.validity ?? 1) * 100).toFixed(
                                                        0,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-flare h-full rounded-full"
                                                    style={{
                                                        width: `${(qualityMetrics.validity ?? 1) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="glass-chip p-4 rounded-xl space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-white/60">
                                                    Deduplication (10%)
                                                </span>
                                                <span className="font-mono text-white">
                                                    {(
                                                        (qualityMetrics.duplicates ?? 1) * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-flare h-full rounded-full"
                                                    style={{
                                                        width: `${(qualityMetrics.duplicates ?? 1) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="glass-chip p-4 rounded-xl space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-white/60">
                                                    Schema Match (10%)
                                                </span>
                                                <span className="font-mono text-white">
                                                    {(
                                                        (qualityMetrics.schemaMatch ?? 1) * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-flare h-full rounded-full"
                                                    style={{
                                                        width: `${(qualityMetrics.schemaMatch ?? 1) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {tab === "healing" ? (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-mono font-bold text-flare uppercase tracking-wider">
                                            Active Field Selectors ({scraper?.currentVersion})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {scraper?.fields?.map((f) => (
                                                <div
                                                    key={f.name}
                                                    className="glass-chip p-3 rounded-lg space-y-1"
                                                >
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span>{f.name}</span>
                                                        <span className="text-[10px] font-mono text-white/50">
                                                            {f.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-mono text-flare bg-black/30 p-1.5 rounded truncate">
                                                        {f.selector}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <h4 className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider">
                                            Version History & Rollback
                                        </h4>

                                        {scraper?.versionHistory &&
                                        scraper.versionHistory.length > 0 ? (
                                            <div className="space-y-2">
                                                {scraper.versionHistory.map((vh) => (
                                                    <div
                                                        key={vh.version}
                                                        className="glass-chip p-3 rounded-lg flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-xs font-mono text-white">
                                                                    {vh.version}
                                                                </span>
                                                                <span className="text-[10px] text-white/40">
                                                                    {new Date(
                                                                        vh.createdAt || "",
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-white/60 mt-0.5">
                                                                {vh.reason ||
                                                                    "Auto-healed configuration archive"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => onRollback(vh.version)}
                                                            className="glass-chip px-3 py-1.5 text-xs text-flare hover:bg-flare/20 rounded font-medium transition-all cursor-pointer"
                                                        >
                                                            Rollback to {vh.version}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-white/40">
                                                No previous versions. Current version is{" "}
                                                {scraper?.currentVersion || "v1"}.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {tab === "logs" ? (
                                <div className="space-y-3">
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <div
                                                key={log._id}
                                                className="glass-chip p-3.5 rounded-xl space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`size-2 rounded-full ${getStatusColor(log.status)}`}
                                                        />
                                                        <span className="text-xs font-bold uppercase">
                                                            {log.status}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-white/40">
                                                            {new Date(
                                                                log.timestamp,
                                                            ).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-flare">
                                                        Quality:{" "}
                                                        {((log.qualityScore || 0) * 100).toFixed(0)}
                                                        %
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/60 bg-black/30 p-2 rounded">
                                                    <div>
                                                        Total Items:{" "}
                                                        <span className="text-white">
                                                            {log.totalItems}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Valid Items:{" "}
                                                        <span className="text-white">
                                                            {log.validItems}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Duration:{" "}
                                                        <span className="text-white">
                                                            {log.durationMs}ms
                                                        </span>
                                                    </div>
                                                </div>

                                                {log.healingAttempted ? (
                                                    <div className="bg-flare/10 border border-flare/30 p-2 rounded text-[11px] text-flare">
                                                        ⚡ Self-Healing was triggered for this
                                                        execution run.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pt-20 text-center text-sm text-white/40">
                                            No execution logs recorded yet.
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function EmptyState({ onSelectPreset }: { onSelectPreset: (preset: string) => void }) {
    const presets = [
        "Scrape books with title, price, stock availability, and rating from https://books.toscrape.com",
        "Scrape e-commerce items with productName, price, customerRating, and productUrl",
        "Scrape news headlines with title, author, date, and articleLink",
    ];

    return (
        <div className="max-w-xl px-4 text-center">
            <h1 className="text-4xl font-medium tracking-tight [text-shadow:0_2px_28px_rgba(0,0,0,0.9)] sm:text-5xl">
                What should we scrape?
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/85 [text-shadow:0_1px_16px_rgba(0,0,0,0.8)] sm:text-base">
                Describe your target website and required fields. Our AI will plan schemas, generate
                selectors, and autonomously heal when websites break.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-left">
                {presets.map((preset, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectPreset(preset)}
                        className="glass-chip rounded-xl p-3 text-xs text-white/80 hover:bg-white/20 transition-all flex items-center justify-between gap-2"
                    >
                        <span className="truncate">{preset}</span>
                        <span className="text-flare">→</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ChatMessage({ message, onDeployClick }: { message: Message; onDeployClick: () => void }) {
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
                        {message.fields?.length ? (
                            <SchemaCard fields={message.fields} onDeployClick={onDeployClick} />
                        ) : null}
                    </div>
                </>
            )}
        </motion.article>
    );
}

function SchemaCard({ fields, onDeployClick }: { fields: FieldPlan[]; onDeployClick: () => void }) {
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
                        <span className="shrink-0 text-[10px] text-flare uppercase font-mono">
                            {field.type}
                        </span>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-white/10 bg-white/5">
                <button
                    type="button"
                    onClick={onDeployClick}
                    className="w-full bg-flare text-white py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-flare/90 transition-all cursor-pointer"
                >
                    Configure & Deploy Scraper →
                </button>
            </div>
        </div>
    );
}

function ThinkingIndicator({ text = "Contacting planner" }: { text?: string }) {
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
            {text}
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
                    placeholder="Describe what you want to scrape (e.g. Scrape book titles and prices from https://books.toscrape.com)..."
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

function getStatusColor(status?: ScraperStatus | string): string {
    switch (status) {
        case "HEALTHY":
        case "healthy":
            return "bg-emerald-500";
        case "WARNING":
        case "warning":
            return "bg-amber-500";
        case "DEGRADED":
        case "degraded":
            return "bg-orange-500";
        case "BROKEN":
        case "broken":
            return "bg-rose-500";
        case "HEALING":
        case "healing":
            return "bg-blue-500 animate-pulse";
        default:
            return "bg-emerald-500";
    }
}

function getStatusTextColor(status?: ScraperStatus | string): string {
    switch (status) {
        case "HEALTHY":
        case "healthy":
            return "text-emerald-400";
        case "WARNING":
        case "warning":
            return "text-amber-400";
        case "DEGRADED":
        case "degraded":
            return "text-orange-400";
        case "BROKEN":
        case "broken":
            return "text-rose-400";
        case "HEALING":
        case "healing":
            return "text-blue-400";
        default:
            return "text-emerald-400";
    }
}

function getStatusBadgeClass(status: ScraperStatus | string): string {
    switch (status) {
        case "HEALTHY":
            return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
        case "WARNING":
            return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
        case "DEGRADED":
            return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
        case "BROKEN":
            return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
        case "HEALING":
            return "bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse";
        default:
            return "bg-emerald-500/20 text-emerald-300";
    }
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

function PlayIcon() {
    return (
        <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor">
            <polygon points="6,4 16,10 6,16" />
        </svg>
    );
}
