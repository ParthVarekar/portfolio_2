"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Cpu,
  LifeBuoy,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import type { ChatCompletionMessageParam, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { MODEL_ID } from "@/lib/machine/model";
import { freshMemory, plan, type Memory, type Turn } from "@/lib/brain";
import type { ChatMessage, MachineMode, MachinePhase, Source } from "@/lib/machine/types";
import { useMachineSupport } from "@/lib/machine/useMachineSupport";
import { DotMatrix } from "@/components/hero/DotMatrix";

const HOME_SUGGESTIONS = [
  "What is H.A.L.O?",
  "Why should I hire Parth?",
  "What are COSTA's results?",
  "What has Parth built?",
];

const PAGE_SUGGESTIONS = [
  "What is H.A.L.O?",
  "How does Susurrus work?",
  "What did BioRadar prove?",
  "Why should I hire Parth?",
  "Where does Parth study?",
  "How do I contact him?",
];

/** How many earlier turns the brain may look at for a follow-up. */
const HISTORY_TURNS = 6;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatEta(progress: number, elapsed: number) {
  if (progress <= 0.02 || progress >= 0.99) return progress >= 0.99 ? "Almost there" : "Estimating…";
  const seconds = Math.max(1, Math.round((elapsed * (1 - progress)) / progress));
  if (seconds > 120) return "A few minutes left";
  return `~${seconds}s left`;
}

function SourceChip({ source }: { source: Source }) {
  const content = (
    <>
      {source.label}
      <ArrowUpRight size={9} aria-hidden="true" />
    </>
  );
  // pages on this site open in place; everything else in a new tab
  return source.url.startsWith("/") && !source.url.endsWith(".pdf") ? (
    <Link className="source-chip" href={source.url}>
      {content}
    </Link>
  ) : (
    <a className="source-chip" href={source.url} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

type MachineHook = { ask: (question: string) => Promise<string>; reset: () => void; mode: () => MachineMode };

export function Machine({
  variant = "home",
  showHeader = true,
  embedded = false,
  compact = false,
  autoWake = false,
  onPhaseChange,
  onProgress,
}: {
  variant?: "home" | "page";
  showHeader?: boolean;
  /** render as a panel that lives inside another section (no <section> wrapper) */
  embedded?: boolean;
  /** compact fit: drop the rail and the notes, keep the chat — for swapping a hero card into the machine */
  compact?: boolean;
  /** start loading the model as soon as support has been detected — the dock mounts on the user's click */
  autoWake?: boolean;
  /** report engine phase transitions to a parent */
  onPhaseChange?: (phase: MachinePhase) => void;
  /** report download progress (0-1) to a parent */
  onProgress?: (progress: number) => void;
}) {
  const support = useMachineSupport();
  const [mode, setMode] = useState<MachineMode>("local");
  const [phase, setPhase] = useState<MachinePhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [webEnabled, setWebEnabled] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const cancelledRef = useRef(false);
  const abortedRef = useRef(false);
  const busyRef = useRef(false);
  const typingRef = useRef<number | null>(null);
  const memoryRef = useRef<Memory>(freshMemory());
  const historyRef = useRef<Turn[]>([]);
  const modeRef = useRef<MachineMode>("local");
  const webRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  modeRef.current = mode;
  webRef.current = webEnabled;

  const suggestions = variant === "page" ? PAGE_SUGGESTIONS : HOME_SUGGESTIONS;

  const autoWakeRef = useRef(false);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onProgressRef = useRef(onProgress);
  onPhaseChangeRef.current = onPhaseChange;
  onProgressRef.current = onProgress;

  useEffect(() => {
    onPhaseChangeRef.current?.(phase);
  }, [phase]);

  useEffect(() => {
    onProgressRef.current?.(progress);
  }, [progress]);

  useEffect(() => {
    if (!autoWake || autoWakeRef.current) return;
    if (support === "checking") return;
    autoWakeRef.current = true;
    void wake();
    // wake is recreated each render; the ref guarantees a single kick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoWake, support]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      workerRef.current?.terminate();
      if (typingRef.current) window.clearInterval(typingRef.current);
    };
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, phase]);

  const forget = () => {
    memoryRef.current = freshMemory();
    historyRef.current = [];
  };

  const startInstant = () => {
    cancelledRef.current = true;
    workerRef.current?.terminate();
    workerRef.current = null;
    engineRef.current = null;
    if (typingRef.current) window.clearInterval(typingRef.current);
    setMode("instant");
    setPhase("ready");
    setError(null);
    setMessages([]);
    forget();
    setInput("");
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 40);
  };

  const wake = async () => {
    if (support === "instant") {
      startInstant();
      return;
    }
    if (support !== "webgpu" || phase === "loading") return;

    cancelledRef.current = false;
    setMode("local");
    setError(null);
    setPhase("loading");
    setProgress(0);
    setStatusText("Starting the worker…");
    setElapsed(0);

    try {
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      if (cancelledRef.current) return;

      const worker = new Worker(new URL("../../lib/machine/worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      // Qwen2.5-0.5B-Instruct-q4f16_1-MLC ships in web-llm's prebuilt list,
      // so the engine resolves it from the default app config.
      const engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          if (cancelledRef.current) return;
          setProgress(report.progress);
          setStatusText(report.text);
          setElapsed(report.timeElapsed);
        },
      });

      if (cancelledRef.current) {
        await engine.unload().catch(() => undefined);
        worker.terminate();
        return;
      }

      // The first generation compiles the GPU pipelines (tens of seconds on
      // some machines). Pay that here, behind the loader, not on the
      // visitor's first question.
      setStatusText("Warming up the GPU…");
      await engine.chat.completions
        .create({ messages: [{ role: "user", content: "Hi" }], max_tokens: 2, temperature: 0 })
        .catch(() => undefined);
      if (cancelledRef.current) {
        await engine.unload().catch(() => undefined);
        worker.terminate();
        return;
      }

      engineRef.current = engine;
      setProgress(1);
      setStatusText("Model ready.");
      setPhase("ready");
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
    } catch (cause) {
      if (cancelledRef.current) return;
      setPhase("error");
      setError(cause instanceof Error ? cause.message : "The model could not start on this device.");
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    workerRef.current?.terminate();
    workerRef.current = null;
    engineRef.current = null;
    setPhase("idle");
    setProgress(0);
    setStatusText("");
    setElapsed(0);
    setError(null);
  };

  const retry = () => {
    setError(null);
    setPhase("idle");
    if (support === "instant") startInstant();
    else void wake();
  };

  const stop = () => {
    if (typingRef.current) {
      window.clearInterval(typingRef.current);
      typingRef.current = null;
    }
    abortedRef.current = true;
    engineRef.current?.interruptGenerate();
    busyRef.current = false;
    setPhase("ready");
  };

  const resetChat = () => {
    stop();
    setMessages([]);
    forget();
    setInput("");
  };

  const patch = (id: string, change: Partial<ChatMessage>) =>
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, ...change } : message)),
    );

  /** Reveal a finished answer at reading speed, so instant replies don't just appear. */
  const typeOut = (id: string, text: string) =>
    new Promise<void>((resolve) => {
      let index = 0;
      typingRef.current = window.setInterval(() => {
        index = Math.min(text.length, index + 4);
        patch(id, { content: text.slice(0, index) });
        if (index >= text.length) {
          if (typingRef.current) window.clearInterval(typingRef.current);
          typingRef.current = null;
          resolve();
        }
      }, 12);
    });

  /**
   * Ask the machine. Resolves with the final answer text. `once.web` looks
   * this one question up without switching Web mode on for the rest.
   */
  const ask = async (raw: string, once?: { web?: boolean }): Promise<string> => {
    const question = raw.trim();
    if (!question || busyRef.current) return "";
    const live = modeRef.current === "local" && engineRef.current !== null;
    if (modeRef.current === "local" && !live) return "";

    busyRef.current = true;
    abortedRef.current = false;
    const assistantId = newId();
    setMessages((previous) => [
      ...previous,
      { id: newId(), role: "user", content: question },
      { id: assistantId, role: "assistant", content: "", sources: [] },
    ]);
    setInput("");
    setPhase("generating");

    let answer = "";
    try {
      const next = await plan(question, {
        memory: memoryRef.current,
        history: historyRef.current,
        live,
        web: once?.web ?? webRef.current,
      });
      memoryRef.current = next.memory;
      patch(assistantId, { sources: next.sources, check: next.check });

      if (next.kind === "reply") {
        answer = next.text;
        await typeOut(assistantId, answer);
      } else {
        let streamed = "";
        const stream = await engineRef.current!.chat.completions.create({
          messages: next.messages as ChatCompletionMessageParam[],
          stream: true,
          ...next.sampling,
        });
        for await (const chunk of stream) {
          if (abortedRef.current) break;
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;
          streamed += delta;
          patch(assistantId, { content: next.preview(streamed) });
        }
        answer = abortedRef.current ? next.preview(streamed).trim() : next.finish(streamed);
        patch(assistantId, { content: answer });
      }
    } catch {
      if (!abortedRef.current) {
        answer =
          "The machine stopped mid-answer. Ask again, or reset the chat if it keeps happening.";
        patch(assistantId, { content: answer, error: true });
      }
    }

    if (answer && !abortedRef.current) {
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, content: question },
        { role: "assistant" as const, content: answer },
      ].slice(-HISTORY_TURNS);
    }
    busyRef.current = false;
    setPhase("ready");
    return answer;
  };

  // development only: lets a test script drive the real chat path
  const hookRef = useRef<MachineHook | null>(null);
  hookRef.current = { ask, reset: resetChat, mode: () => modeRef.current };
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const target = window as unknown as { __machine?: MachineHook };
    target.__machine = {
      ask: (question) => hookRef.current!.ask(question),
      reset: () => hookRef.current!.reset(),
      mode: () => hookRef.current!.mode(),
    };
    return () => {
      delete target.__machine;
    };
  }, []);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === "generating") {
      stop();
      return;
    }
    void ask(input);
  };

  const busy = phase === "loading" || phase === "generating";
  const inputDisabled = phase !== "ready" && phase !== "generating";
  const phaseLabel =
    phase === "loading"
      ? `Loading ${Math.round(progress * 100)}%`
      : phase === "generating"
        ? "Thinking"
        : phase === "error"
          ? "Error"
          : phase === "ready"
            ? mode === "instant"
              ? "Instant answers"
              : "Ready"
            : "Idle";

  const orbState =
    phase === "loading"
      ? "loading"
      : phase === "generating"
        ? "generating"
        : phase === "ready"
          ? mode === "instant"
            ? "demo"
            : "ready"
          : "idle";

  const chatFoot =
    phase === "loading"
      ? "Downloading the model once. You can cancel at any time."
      : phase === "error"
        ? "The model did not start. Instant answers still work."
        : phase === "idle"
          ? "Nothing is downloading until you wake the machine."
          : mode === "instant"
            ? webEnabled
              ? "Instant answers from Parth's notes · Wikipedia for general questions."
              : "Instant answers from Parth's notes · no model needed."
            : webEnabled
              ? "Running on your GPU · general questions may search Wikipedia."
              : "Running on your GPU · this conversation never leaves the tab.";

  const panel = (
    <>
      <div className="machine-panel">
        <div className="machine-head">
          <div className="machine-title">The machine</div>
          <div className="machine-head-right">
            {compact ? null : (
              <>
                <span className="pill pill--outline">Local</span>
                <span className="pill pill--outline">Qwen2.5 · 0.5B</span>
                <span className="pill pill--outline">4K context</span>
              </>
            )}
            <button
              type="button"
              className="machine-web"
              data-on={webEnabled}
              onClick={() => setWebEnabled((value) => !value)}
              aria-pressed={webEnabled}
              title={
                webEnabled
                  ? "Web on — general questions can look things up on Wikipedia (only the question is sent)"
                  : "Web off — the machine never touches the network"
              }
              aria-label={
                webEnabled
                  ? "Web mode on. Press to turn off."
                  : "Web mode off. Press to let general questions search Wikipedia."
              }
            >
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
              </svg>
              Web
            </button>
            <span className="pill pill--outline">
              <span
                className={`status-dot ${
                  phase === "error"
                    ? "status-dot--coral"
                    : phase === "ready" || phase === "generating"
                      ? "status-dot--lime"
                      : "status-dot--blue"
                }`}
                aria-hidden="true"
              />
              {phaseLabel}
            </span>
          </div>
        </div>

        <div className="machine-body">
          <div className="chat-panel">
            <div className="chat-scroll" ref={scrollRef} aria-live="polite" aria-busy={busy}>
              {phase === "idle" ? (
                <div className="chat-empty">
                  <div className="chat-empty-orb" aria-hidden="true" data-loop />
                  <h3>Ask me about Parth.</h3>
                  <p>
                    {support === "instant"
                      ? "This browser can't run the model (it needs WebGPU), so I'll answer instantly from Parth's notes instead — no download."
                      : "A real language model, running on your GPU. It knows Parth's projects, skills and story, and loads only when you ask."}
                  </p>
                  <div className="hero-actions" style={{ marginTop: 2, justifyContent: "center" }}>
                    <button
                      type="button"
                      className="btn btn--lime btn--sm"
                      onClick={() => void wake()}
                      disabled={support === "checking"}
                    >
                      <Sparkles size={14} aria-hidden="true" />
                      {support === "instant" ? "Start instant answers" : "Wake the machine"}
                    </button>
                    {support !== "instant" ? (
                      <button type="button" className="btn btn--white btn--sm" onClick={startInstant}>
                        Instant answers
                      </button>
                    ) : null}
                  </div>
                  <p className="chat-disclaimer">
                    ~265 MB one-time download · runs on your GPU · nothing you type leaves this tab
                  </p>
                </div>
              ) : null}

              {phase === "loading" ? (
                <div className="loader">
                  <div className="loader-head">
                    <div>
                      <div className="loader-title">Waking the machine…</div>
                      <div className="loader-sub">Qwen2.5 0.5B · ~265 MB · cached after the first load</div>
                    </div>
                    <span className="pill pill--soft">{Math.round(progress * 100)}%</span>
                  </div>
                  <DotMatrix className="loader-matrix" lit={Math.round(progress * 55)} total={55} />
                  <div
                    className="loader-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    aria-label="Model download progress"
                  >
                    <div className="loader-fill" style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }} />
                  </div>
                  <div className="loader-meta">
                    <span>{statusText || "Preparing the runtime…"}</span>
                    <strong>{formatEta(progress, elapsed)}</strong>
                  </div>
                  <div className="loader-actions">
                    <button type="button" className="btn btn--white btn--sm" onClick={cancel}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={startInstant}>
                      Instant answers instead
                    </button>
                  </div>
                </div>
              ) : null}

              {phase === "error" ? (
                <div className="loader">
                  <div className="loader-error">{error || "The model could not start on this device."}</div>
                  <p className="loader-sub">
                    Your device may not have enough GPU memory, or the download was interrupted.
                    Instant answers from Parth&apos;s notes always work.
                  </p>
                  <div className="loader-actions">
                    <button type="button" className="btn btn--lime btn--sm" onClick={retry}>
                      Try again
                    </button>
                    <button type="button" className="btn btn--white btn--sm" onClick={startInstant}>
                      Instant answers instead
                    </button>
                  </div>
                </div>
              ) : null}

              {(phase === "ready" || phase === "generating") && messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-orb" aria-hidden="true" data-loop />
                  <h3>Ask me about Parth.</h3>
                  <p>
                    {mode === "instant"
                      ? "Instant answers, picked from Parth's notes — no model needed."
                      : "The model is awake. Ask about a project, his skills, or anything else."}
                  </p>
                  <div className="suggestions" aria-label="Suggested questions">
                    {suggestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        className="suggestion"
                        onClick={() => void ask(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {(phase === "ready" || phase === "generating") && messages.length > 0 ? (
                <div className="chat-messages">
                  {messages.map((message, index) => {
                    const streaming =
                      message.role === "assistant" && phase === "generating" && index === messages.length - 1;
                    return (
                      <div
                        key={message.id}
                        className={`msg ${message.role === "user" ? "msg--user" : "msg--assistant"}`}
                      >
                        {message.role === "assistant" ? (
                          <div className="msg-role">
                            <span className="status-dot status-dot--lime" aria-hidden="true" />
                            Machine · {mode === "instant" ? "instant" : "on your GPU"}
                          </div>
                        ) : null}
                        <div className={`msg-text${message.error ? " msg-text--error" : ""}`}>
                          {message.content ? (
                            <>
                              {message.content}
                              {streaming ? <span className="caret" aria-hidden="true" /> : null}
                            </>
                          ) : (
                            <span className="thinking" aria-label="Thinking">
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>
                        {((message.sources && message.sources.length > 0) || message.check) && !streaming ? (
                          <div className="source-chips">
                            {message.sources?.map((source) => (
                              <SourceChip key={`${source.label}-${source.url}`} source={source} />
                            ))}
                            {message.check ? (
                              <button
                                type="button"
                                className="source-chip source-chip--check"
                                disabled={phase === "generating"}
                                onClick={() => {
                                  const question = message.check!;
                                  patch(message.id, { check: undefined });
                                  void ask(question, { web: true });
                                }}
                              >
                                <Search size={10} aria-hidden="true" />
                                Look it up on Wikipedia
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <form className="chat-compose" onSubmit={onSubmit}>
              <input
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  phase === "idle"
                    ? "Wake the machine to type…"
                    : phase === "loading"
                      ? "Loading the model…"
                      : phase === "error"
                        ? "The machine is not running…"
                        : "Ask about Parth, a project, or anything…"
                }
                aria-label="Ask the machine a question"
                disabled={inputDisabled}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="send"
                suppressHydrationWarning
              />
              {phase === "generating" ? (
                <button type="button" className="chat-send chat-send--stop" onClick={stop} aria-label="Stop">
                  <Square size={13} fill="currentColor" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="chat-send"
                  disabled={inputDisabled || !input.trim()}
                  aria-label="Send question"
                >
                  <Send size={16} aria-hidden="true" />
                </button>
              )}
            </form>

            <div className="chat-foot">
              <span
                className={`status-dot ${
                  phase === "error"
                    ? "status-dot--coral"
                    : mode === "instant" || phase === "idle"
                      ? "status-dot--blue"
                      : "status-dot--lime"
                }`}
                aria-hidden="true"
              />
              {chatFoot}
            </div>
          </div>

          {compact ? null : (
            <aside className="machine-rail" aria-label="Machine details">
              <div className="rail-core">
                <span className="rail-orb" data-state={orbState} aria-hidden="true" />
                <div>
                  <div className="rail-state">
                    {phase === "error"
                      ? "Offline"
                      : phase === "loading"
                        ? "Loading"
                        : phase === "generating"
                          ? "Thinking"
                          : phase === "ready"
                            ? mode === "instant"
                              ? "Instant"
                              : "Ready"
                            : "Idle"}
                  </div>
                  <div className="rail-sub">
                    {phase === "idle" ? "Nothing loaded" : phase === "error" ? "Notes ready" : "In your browser"}
                  </div>
                </div>
              </div>

              <div className="rail-divider" />

              <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="rail-row">
                  <dt>Model</dt>
                  <dd>Qwen2.5 · 0.5B</dd>
                </div>
                <div className="rail-row">
                  <dt>Runtime</dt>
                  <dd>WebGPU</dd>
                </div>
                <div className="rail-row">
                  <dt>Context</dt>
                  <dd>4,096 tokens</dd>
                </div>
                <div className="rail-row">
                  <dt>Download</dt>
                  <dd>~265 MB</dd>
                </div>
              </dl>

              <div className="rail-divider" />

              <p className="rail-note">
                Code works out what you&apos;re asking and hands the model the two or three facts that
                answer it. The model writes the reply on your GPU; nothing you type leaves this tab.
              </p>

              <div className="rail-actions">
                <button
                  type="button"
                  className="rail-link"
                  onClick={resetChat}
                  disabled={messages.length === 0}
                  style={messages.length === 0 ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                >
                  Reset chat
                  <RotateCcw size={13} aria-hidden="true" />
                </button>
                <Link className="rail-link" href="/colophon">
                  How it works
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>

      {compact ? null : (
        <div className="machine-notes">
          <article className="note-card">
            <h3>
              <span className="note-icon">
                <Cpu size={14} aria-hidden="true" />
              </span>
              What runs
            </h3>
            <p>
              Qwen2.5 0.5B, 4-bit, through WebLLM and WebGPU in a Web Worker. Under a gigabyte of GPU
              memory and a 4,096-token context.
            </p>
          </article>
          <article className="note-card">
            <h3>
              <span className="note-icon">
                <ShieldCheck size={14} aria-hidden="true" />
              </span>
              What leaves
            </h3>
            <p>
              Nothing you type, once the model is cached. No cookies, no chat storage. With Web on,
              only a general question is sent to Wikipedia.
            </p>
          </article>
          <article className="note-card">
            <h3>
              <span className="note-icon">
                <LifeBuoy size={14} aria-hidden="true" />
              </span>
              What if it can&apos;t
            </h3>
            <p>
              Without WebGPU, the machine answers instantly from the same notes. The rest of the site never
              depends on it.
            </p>
          </article>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div
        className={compact ? "machine-dock machine-dock--compact" : "machine-dock"}
        id="machine"
        role="region"
        aria-label="The machine — a language model running in your browser"
      >
        {panel}
      </div>
    );
  }

  return (
    <section className={showHeader ? "section" : ""} id="machine" aria-labelledby="machine-title">
      <div className={showHeader ? "shell" : ""}>
        {showHeader ? (
          <div className="section-head">
            <div className="section-head-copy">
              <h2 className="section-title" id="machine-title">
                Wake it up.
              </h2>
              <p className="section-sub">
                A real 0.5B language model in your browser. Ask about Parth and his work; every answer
                shows where it came from.
              </p>
            </div>
            <Link className="section-link" href="/machine">
              Open the machine
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <h2 className="sr-only" id="machine-title">
            The machine
          </h2>
        )}

        {panel}
      </div>
    </section>
  );
}
