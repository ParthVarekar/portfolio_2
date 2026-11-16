"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Cpu,
  LifeBuoy,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import type { ChatCompletionMessageParam, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { MODEL_ID, BROWSER_MODEL } from "@/lib/machine/model";
import { hasPortfolioSignal, isEvidenceQuestion, isFollowUpQuestion, projectInQuestion, retrieve, topFactHit, weakAnswerCheck } from "@/lib/rag";
import { buildMessages, REFUSAL } from "@/lib/rag/prompt";
import { matchDemo } from "@/lib/machine/demo";
import type { ChatMessage, MachineMode, MachinePhase, Source } from "@/lib/machine/types";
import { useMachineSupport } from "@/lib/machine/useMachineSupport";
import { DotMatrix } from "@/components/hero/DotMatrix";

const HOME_SUGGESTIONS = [
  "What is H.A.L.O?",
  "How does Susurrus work?",
  "What did BioRadar prove?",
  "How do you test your systems?",
];

const PAGE_SUGGESTIONS = [
  "What is H.A.L.O?",
  "How does Susurrus work?",
  "What did BioRadar prove?",
  "How does COSTA find the beacon?",
  "What is this page running?",
  "What client work have you done?",
];

/** Undo the 135M tokenizer's habit of spacing out acronyms. */
function cleanAnswer(text: string): string {
  return text
    .replace(/\bH\.\s*A\.\s*L\.\s*O\.?/gi, "H.A.L.O ")
    .replace(/\bY\.\s*O\.\s*L\.\s*O\.?/gi, "YOLO ")
    .replace(/\bR\.\s*F\s*-\s*D\.\s*E\.\s*T\.\s*R\.?/gi, "RF-DETR ")
    .replace(/\bE\.\s*D\.\s*D\.?/gi, "EDD ")
    .replace(/\bQ\.\s*WEN3-VL\b/gi, "Qwen3-VL ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1");
}

/** True if the answer is a verbatim span of the notes — then the note itself is the cleaner answer. */
function notesContain(notes: Array<{ text: string }>, text: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const t = norm(text);
  if (t.length < 30) return false;
  return notes.some((note) => norm(note.text).includes(t));
}

/**
 * The 135M sometimes treats the prompt as a document to continue and echoes
 * the scaffold back ("KEY FACTS", "[1] …", "OPTIONS:", "END OF QUESTION").
 * Drop those lines so only the answer survives.
 */
const SCAFFOLD_LINE = /^(?:\[?\d+\]?\s*)?(?:KEY FACTS|NOTES|QUESTION|SUBJECT|OPTIONS?|END OF QUESTION|ANSWER)\b/i;
const SCAFFOLD_ONLY = /^(?:options|answers?|question|notes|key facts)\s*:?\s*$/i;
const NOTE_HEADER = /^[^\n—]{0,90}\s—\s[\w .&-]{0,70}$/;
const PROMPT_ECHO = /^(prefer note \[\d+\]|answer in one or two short sentences|name the project)/i;
const ENUM_SPAM = /(\[\d+\][^\n]{0,120}){2,}/;

function stripScaffold(text: string): string {
  return text
    .split("\n")
    .filter((raw) => {
      const line = raw.trim();
      if (!line) return false;
      if (SCAFFOLD_ONLY.test(line)) return false;
      if (SCAFFOLD_LINE.test(line)) return false;
      if (NOTE_HEADER.test(line)) return false;
      if (PROMPT_ECHO.test(line)) return false;
      if (ENUM_SPAM.test(line)) return false;
      if (/^\[\d+\]\s/.test(line)) return false;
      return true;
    })
    .join("\n")
    .replace(/^["“]|["”]$/g, "")
    .trim();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.label}|${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatEta(progress: number, elapsed: number) {
  if (progress <= 0.02 || progress >= 0.99) return progress >= 0.99 ? "Almost there" : "Estimating…";
  const seconds = Math.max(1, Math.round((elapsed * (1 - progress)) / progress));
  if (seconds > 120) return "A few minutes left";
  return `~${seconds}s left`;
}

export function Machine({
  variant = "home",
  showHeader = true,
  embedded = false,
  autoWake = false,
  onPhaseChange,
  onProgress,
}: {
  variant?: "home" | "page";
  showHeader?: boolean;
  /** render as a panel that lives inside another section (no <section> wrapper) */
  embedded?: boolean;
  /** start loading the model as soon as support has been detected — the dock mounts on the user's click */
  autoWake?: boolean;
  /** report engine phase transitions to a parent (the hero's windmill gauge) */
  onPhaseChange?: (phase: MachinePhase) => void;
  /** report download progress (0-1) so the parent can light its own gauge */
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

  const workerRef = useRef<Worker | null>(null);
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const cancelledRef = useRef(false);
  const abortedRef = useRef(false);
  const demoTimerRef = useRef<number | null>(null);
  const lastProjectRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, phase]);

  const startDemo = () => {
    cancelledRef.current = true;
    workerRef.current?.terminate();
    workerRef.current = null;
    engineRef.current = null;
    if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    setMode("demo");
    setPhase("ready");
    setError(null);
    setMessages([]);
    lastProjectRef.current = null;
    setInput("");
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  const wake = async () => {
    if (support === "demo") {
      startDemo();
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
      const { CreateWebWorkerMLCEngine, prebuiltAppConfig } = await import(
        "@mlc-ai/web-llm"
      );
      if (cancelledRef.current) return;

      const worker = new Worker(new URL("../../lib/machine/worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      const engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          if (cancelledRef.current) return;
          setProgress(report.progress);
          setStatusText(report.text);
          setElapsed(report.timeElapsed);
        },
        appConfig: {
          ...prebuiltAppConfig,
          model_list: [...prebuiltAppConfig.model_list, BROWSER_MODEL],
        },
      });

      if (cancelledRef.current) {
        await engine.unload().catch(() => undefined);
        worker.terminate();
        return;
      }

      engineRef.current = engine;
      setProgress(1);
      setStatusText("Model ready.");
      setPhase("ready");
      window.setTimeout(() => inputRef.current?.focus(), 80);
    } catch (cause) {
      if (cancelledRef.current) return;
      setPhase("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "The model could not start on this device.",
      );
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
    if (support === "demo") startDemo();
    else void wake();
  };

  const stop = () => {
    if (mode === "demo") {
      if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
      setPhase("ready");
      return;
    }
    abortedRef.current = true;
    engineRef.current?.interruptGenerate();
    setPhase("ready");
  };

  const resetChat = () => {
    if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    demoTimerRef.current = null;
    if (mode === "local" && engineRef.current) {
      engineRef.current.resetChat().catch(() => undefined);
    }
    setMessages([]);
    lastProjectRef.current = null;
    setInput("");
    if (phase !== "idle" && phase !== "loading" && phase !== "error") setPhase("ready");
  };

  const askDemo = (question: string) => {
    if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);

    const user: ChatMessage = { id: newId(), role: "user", content: question };
    const assistantId = newId();
    const match = matchDemo(question);
    const answer = match?.answer ?? REFUSAL;
    const sources = match?.sources ?? [];

    setMessages((previous) => [
      ...previous,
      user,
      { id: assistantId, role: "assistant", content: "", sources },
    ]);
    setInput("");
    setPhase("generating");

    let index = 0;
    demoTimerRef.current = window.setInterval(() => {
      index = Math.min(answer.length, index + 3);
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, content: answer.slice(0, index) } : message,
        ),
      );
      if (index >= answer.length) {
        if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        setPhase("ready");
      }
    }, 14);
  };

  const ask = async (raw: string) => {
    const question = raw.trim();
    if (!question) return;
    if (mode === "demo") {
      askDemo(question);
      return;
    }

    const engine = engineRef.current;
    if (!engine || phase === "generating") return;

    abortedRef.current = false;
    const user: ChatMessage = { id: newId(), role: "user", content: question };
    const assistantId = newId();
    const followUp =
      lastProjectRef.current &&
      isFollowUpQuestion(question) &&
      !projectInQuestion(question);
    const subject = followUp ? (lastProjectRef.current ?? undefined) : undefined;
    const retrievalQuery = followUp ? `${subject} ${question}` : question;
    const retrieved = hasPortfolioSignal(question) ? retrieve(retrievalQuery, 3) : [];
    const sources = dedupeSources(
      retrieved.map((item) => ({ label: item.chunk.source, url: item.chunk.url })),
    );

    if (retrieved[0]) lastProjectRef.current = retrieved[0].chunk.project;

    setMessages((previous) => [
      ...previous,
      user,
      { id: assistantId, role: "assistant", content: "", sources },
    ]);
    setInput("");
    setPhase("generating");

    if (retrieved.length === 0) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: REFUSAL, sources: [] }
            : message,
        ),
      );
      setPhase("ready");
      return;
    }

    const prompt = buildMessages(
      question,
      retrieved.map((item) => item.chunk),
      subject,
    );

    let answer = "";
    try {
      const stream = await engine.chat.completions.create({
        messages: prompt as ChatCompletionMessageParam[],
        stream: true,
        temperature: 0,
        top_p: 0.9,
        max_tokens: 120,
        repetition_penalty: 1.12,
      });

      for await (const chunk of stream) {
        if (abortedRef.current) break;
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (!delta) continue;
        answer += delta;
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? { ...message, content: stripScaffold(cleanAnswer(answer)) }
              : message,
          ),
        );
      }

      const topInfo = retrieved[0];
      const stripped = stripScaffold(answer);
      if (!stripped && !abortedRef.current) {
        // The model only echoed the scaffold — fall back to the note itself.
        const evidence = topInfo && isEvidenceQuestion(question);
        const fallback = evidence
          ? `The notes show: ${topInfo.chunk.facts?.replace(/\.?$/, "")}.`
          : topInfo?.chunk.text.split(/(?<=[.!?])\s+/)[0] ?? REFUSAL;
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? { ...message, content: fallback }
              : message,
          ),
        );
      } else if (topInfo && !abortedRef.current) {
        const facts = isEvidenceQuestion(question) ? topInfo.chunk.facts : undefined;
        let replacement: string | null = null;
        if (facts && !topFactHit(stripped, facts)) {
          // The 135M latched onto prose instead of the facts — say the facts.
          replacement = `The notes show: ${facts.replace(/\.?$/, "")}.`;
        } else if (!facts) {
          const words = stripped.split(/\s+/).filter((word) => /[a-z]/i.test(word)).length;
          if (words < 6) {
            // The model gave up — say note [1] instead.
            replacement = topInfo.chunk.text.split(/(?<=[.!?])\s+/)[0].trim();
          } else if (notesContain(retrieved.map((r) => r.chunk), stripped)) {
            // A verbatim echo of a note — say the note's opening instead.
            replacement = topInfo.chunk.text.split(/(?<=[.!?])\s+/)[0].trim();
          } else {
            replacement = weakAnswerCheck(stripped, topInfo.chunk);
          }
        }
        if (replacement) {
          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantId
                ? { ...message, content: replacement as string }
                : message,
            ),
          );
        }
      }
      setPhase("ready");
    } catch {
      if (abortedRef.current) {
        setPhase("ready");
        return;
      }
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "The machine stopped mid-answer. Try again, or switch to demo mode from the rail.",
                error: true,
              }
            : message,
        ),
      );
      setPhase("ready");
    }
  };

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
        ? "Generating"
        : phase === "error"
          ? "Error"
          : phase === "ready"
            ? mode === "demo"
              ? "Demo ready"
              : "Ready"
            : "Idle";

  const orbState =
    phase === "loading"
      ? "loading"
      : phase === "generating"
        ? "generating"
        : phase === "ready"
          ? mode === "demo"
            ? "demo"
            : "ready"
          : "idle";

  const chatFoot =
    phase === "loading"
      ? "Downloading model shards. You can cancel at any time."
      : phase === "error"
        ? "The machine did not start. Demo mode is still available."
        : phase === "idle"
          ? "The model has not been loaded. Nothing is downloading."
          : mode === "demo"
            ? "Demo mode — pre-written answers, not live inference."
            : phase === "generating"
              ? "Streaming from your GPU · 0 bytes of this conversation sent."
              : "Running locally · 0 bytes of this conversation sent.";

  const panel = (
    <>
        <div className="machine-panel">
          <div className="machine-head">
            <div className="machine-title">The machine</div>
            <div className="machine-head-right">
              <span className="pill pill--outline">Local</span>
              <span className="pill pill--outline">SmolLM2 · 135M</span>
              <span className="pill pill--outline">4K context</span>
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
              <div
                className="chat-scroll"
                ref={scrollRef}
                aria-live="polite"
                aria-busy={busy}
              >
                {phase === "idle" ? (
                  <div className="chat-empty">
                    <div className="chat-empty-orb" aria-hidden="true" data-loop />
                    <h3>Ask me about the work.</h3>
                    <p>
                      {support === "demo"
                        ? "This browser can't run the local model (WebGPU or f16 shaders missing), so the demo uses pre-written answers. The rest of the site works exactly the same."
                        : "I answer from Parth's notes, not the internet. The model loads only when you ask it to."}
                    </p>
                    <div className="hero-actions" style={{ marginTop: 2, justifyContent: "center" }}>
                      <button
                        type="button"
                        className="btn btn--lime btn--sm"
                        onClick={() => void wake()}
                        disabled={support === "checking"}
                      >
                        <Sparkles size={14} aria-hidden="true" />
                        {support === "demo" ? "Try the demo" : "Wake the machine"}
                      </button>
                      {support !== "demo" ? (
                        <button type="button" className="btn btn--white btn--sm" onClick={startDemo}>
                          Use demo mode
                        </button>
                      ) : null}
                    </div>
                    <div className="suggestions" aria-label="Suggested questions">
                      {suggestions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          className="suggestion"
                          disabled
                          title="Wake the machine first"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                    <p className="chat-disclaimer">
                      ~78 MB one-time download · runs on your GPU · nothing leaves this tab
                    </p>
                  </div>
                ) : null}

                {phase === "loading" ? (
                  <div className="loader">
                    <div className="loader-head">
                      <div>
                        <div className="loader-title">Waking the machine…</div>
                        <div className="loader-sub">
                          SmolLM2 135M · ~78 MB · cached after the first load
                        </div>
                      </div>
                      <span className="pill pill--soft">{Math.round(progress * 100)}%</span>
                    </div>
                    <DotMatrix
                      className="loader-matrix"
                      lit={Math.round(progress * 55)}
                      total={55}
                    />
                    <div
                      className="loader-bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress * 100)}
                      aria-label="Model download progress"
                    >
                      <div
                        className="loader-fill"
                        style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }}
                      />
                    </div>
                    <div className="loader-meta">
                      <span>{statusText || "Preparing the runtime…"}</span>
                      <strong>{formatEta(progress, elapsed)}</strong>
                    </div>
                    <div className="loader-actions">
                      <button type="button" className="btn btn--white btn--sm" onClick={cancel}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={startDemo}>
                        Use demo instead
                      </button>
                    </div>
                  </div>
                ) : null}

                {phase === "error" ? (
                  <div className="loader">
                    <div className="loader-error">
                      {error || "The model could not start on this device."}
                    </div>
                    <p className="loader-sub">
                      Your device may not have enough GPU memory, or the download was
                      interrupted. The demo is a complete, clearly labelled fallback.
                    </p>
                    <div className="loader-actions">
                      <button type="button" className="btn btn--lime btn--sm" onClick={retry}>
                        Try again
                      </button>
                      <button type="button" className="btn btn--white btn--sm" onClick={startDemo}>
                        Use demo instead
                      </button>
                    </div>
                  </div>
                ) : null}

                {(phase === "ready" || phase === "generating") && messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-orb" aria-hidden="true" data-loop />
                    <h3>Ask me about the work.</h3>
                    <p>
                      {mode === "demo"
                        ? "Demo mode — the answers are pre-written, not live inference."
                        : "The model is loaded. Ask about a project, a decision, or how I work."}
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
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`msg ${message.role === "user" ? "msg--user" : "msg--assistant"}`}
                      >
                        {message.role === "assistant" ? (
                          <div className="msg-role">
                            <span
                              className="status-dot status-dot--lime"
                              aria-hidden="true"
                            />
                            Machine · {mode === "demo" ? "demo" : "local"}
                          </div>
                        ) : null}
                        <div className={`msg-text${message.error ? " msg-text--error" : ""}`}>
                          {message.content ? (
                            <>
                              {message.content}
                              {message.role === "assistant" && phase === "generating" ? (
                                <span className="caret" aria-hidden="true" />
                              ) : null}
                            </>
                          ) : (
                            <span className="thinking" aria-label="Generating">
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>
                        {message.sources && message.sources.length > 0 ? (
                          <div className="source-chips">
                            {message.sources.map((source) => (
                              <a
                                key={`${source.label}-${source.url}`}
                                className="source-chip"
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.label}
                                <ArrowUpRight size={9} aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
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
                          : mode === "demo"
                            ? "Ask a sample question…"
                            : "Ask about a project, a decision, or how I work…"
                  }
                  aria-label="Ask the machine a question"
                  disabled={inputDisabled}
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  suppressHydrationWarning
                />
                {phase === "generating" ? (
                  <button
                    type="button"
                    className="chat-send chat-send--stop"
                    onClick={stop}
                    aria-label="Stop generating"
                  >
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
                      : mode === "demo" || phase === "idle"
                        ? "status-dot--blue"
                        : "status-dot--lime"
                  }`}
                  aria-hidden="true"
                />
                {chatFoot}
              </div>
            </div>

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
                          ? "Working"
                          : phase === "ready"
                            ? mode === "demo"
                              ? "Demo"
                              : "Ready"
                            : "Idle"}
                  </div>
                  <div className="rail-sub">
                    {phase === "idle" ? "Nothing loaded" : phase === "error" ? "Demo available" : "In your browser"}
                  </div>
                </div>
              </div>

              <div className="rail-divider" />

              <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="rail-row">
                  <dt>Model</dt>
                  <dd>SmolLM2 · 135M</dd>
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
                  <dd>~78 MB</dd>
                </div>
              </dl>

              <div className="rail-divider" />

              <p className="rail-note">
                The model runs in a Web Worker. Your conversation stays in this tab, and the
                page never sends it anywhere.
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
                <Link className="rail-link" href="/colophon#machine">
                  How it works
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </div>

        <div className="machine-notes">
          <article className="note-card">
            <h3>
              <span className="note-icon">
                <Cpu size={14} aria-hidden="true" />
              </span>
              What runs
            </h3>
            <p>
              SmolLM2 135M, 4-bit, through WebLLM and WebGPU in a Web Worker. About 100 MB
              of GPU memory and a 4,096-token context.
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
              Nothing after the model is cached. No analytics, no cookies, no chat storage.
              The conversation lives in this tab and disappears on reload.
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
              If WebGPU or the download fails, the machine switches to a clearly labelled
              demo. The rest of the site never depends on it.
            </p>
          </article>
        </div>
    </>
  );

  if (embedded) {
    return (
      <div
        className="machine-dock"
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
              <span className="section-label">
                <span className="status-dot status-dot--lime" aria-hidden="true" />
                II — The machine
              </span>
              <h2 className="section-title" id="machine-title">
                Wake it up.
              </h2>
              <p className="section-sub">
                A real 135M language model in your browser. Ask about the work; the answer is grounded
                in a small set of notes and shows its sources.
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
