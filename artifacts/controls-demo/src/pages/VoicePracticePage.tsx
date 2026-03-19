import { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Star,
  CheckCircle2,
} from "lucide-react";
import type { VoicePrompt } from "@/data/voicePractice";
import { progressApi } from "@/services/progressApi";

const DIFF_EMOJI: Record<string, string> = {
  beginner: "🟢",
  intermediate: "🟡",
  advanced: "🔴",
};
const TYPE_COLOR: Record<string, string> = {
  technical: "hsl(var(--primary))",
  behavioral: "hsl(var(--chart-2))",
  scenario: "hsl(var(--chart-3))",
  explain: "hsl(var(--chart-4))",
};

type RecordPhase = "idle" | "countdown" | "recording" | "done";

interface VoicePracticePageProps {
  prompts: VoicePrompt[];
  channelId: string;
  onVoicePractice?: (promptId: string, rating: number | null) => void;
}

export function VoicePracticePage({
  prompts,
  channelId,
  onVoicePractice,
}: VoicePracticePageProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [rating, setRating] = useState(0);
  const [keyPointsOpen, setKeyPointsOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [srSupported, setSrSupported] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cdRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSrSupported(!!SR);
  }, []);

  useEffect(() => {
    setActiveIdx(0);
    setPhase("idle");
    setTranscript("");
    setRating(0);
    setKeyPointsOpen(false);
    setOrder(prompts.map((_, i) => i));
  }, [channelId, prompts]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const displayPrompts = order.map((i) => prompts[i]).filter(Boolean);
  const active = displayPrompts[activeIdx];

  const go = useCallback((dir: 1 | -1) => {
    stopRecording();
    setActiveIdx((i) => {
      const max = displayPrompts.length - 1;
      return Math.max(0, Math.min(max, i + dir));
    });
    setPhase("idle");
    setElapsed(0);
    setTranscript("");
    setRating(0);
    setKeyPointsOpen(false);
  }, []);

  const doShuffle = () => {
    const arr = prompts.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setActiveIdx(0);
    setShuffle(true);
    setPhase("idle");
    setElapsed(0);
    setTranscript("");
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cdRef.current) clearInterval(cdRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    let cd = 3;
    cdRef.current = setInterval(() => {
      cd--;
      setCountdown(cd);
      if (cd <= 0) {
        clearInterval(cdRef.current!);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    setPhase("recording");
    setElapsed(0);
    setTranscript("");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let full = "";
        for (let i = 0; i < e.results.length; i++) {
          full += e.results[i][0].transcript + " ";
        }
        setTranscript(full.trim());
      };
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stop = () => {
    stopRecording();
    setPhase("done");
  };

  const retry = () => {
    stopRecording();
    setPhase("idle");
    setElapsed(0);
    setTranscript("");
    setRating(0);
  };

  const rateAndNext = (r: number) => {
    if (active) {
      setRatings((prev) => ({ ...prev, [active.id]: r }));
      onVoicePractice?.(active.id, r);
      progressApi.saveVoice(channelId, active.id, r);
    }
    setRating(r);
    if (activeIdx < displayPrompts.length - 1) {
      setTimeout(() => go(1), 500);
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const timerCircumference = 2 * Math.PI * 50;
  const timerPct = active ? Math.min(elapsed / active.timeLimit, 1) : 0;

  if (prompts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Volume2 size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No voice prompts for this channel
        </h3>
        <p className="text-muted-foreground text-sm">
          Try JavaScript, React, or System Design channels.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card ${sidebarOpen ? "fixed left-0 top-0 h-full z-40 flex w-72" : "hidden md:flex"}`}
        style={{ width: 260 }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Volume2 size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Prompts</span>
          <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 rounded-full">
            {displayPrompts.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayPrompts.map((p, i) => (
            <button
              key={p.id}
              data-testid={`voice-sidebar-${p.id}`}
              onClick={() => {
                stopRecording();
                setActiveIdx(i);
                setPhase("idle");
                setElapsed(0);
                setTranscript("");
                setRating(0);
                setKeyPointsOpen(false);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 transition-colors hover:bg-muted/50 border-l-2 flex items-start gap-2"
              style={{
                borderLeftColor:
                  i === activeIdx ? "hsl(var(--primary))" : "transparent",
                background:
                  i === activeIdx ? "hsl(var(--primary) / 0.06)" : undefined,
              }}
            >
              <span className="text-base shrink-0">
                {DIFF_EMOJI[p.difficulty]}
              </span>
              <div className="flex-1 min-w-0">
                {ratings[p.id] && (
                  <div className="flex gap-0.5 mb-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={8}
                        fill={
                          si < ratings[p.id] ? "hsl(var(--chart-3))" : "none"
                        }
                        style={{ color: "hsl(var(--chart-3))" }}
                      />
                    ))}
                  </div>
                )}
                <p className="text-xs text-foreground line-clamp-2 leading-snug">
                  {p.prompt}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                #{i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <button
            aria-label="Open prompt list"
            className="mob-menu md:hidden items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          <button
            onClick={
              shuffle
                ? () => {
                    setOrder(prompts.map((_, i) => i));
                    setShuffle(false);
                  }
                : doShuffle
            }
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors"
            style={{ color: shuffle ? "hsl(var(--primary))" : undefined }}
          >
            <Shuffle size={12} /> {shuffle ? "Shuffled" : "Shuffle"}
          </button>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeIdx + 1} / {displayPrompts.length}
          </span>
          <button
            aria-label="Previous prompt"
            onClick={() => go(-1)}
            disabled={activeIdx === 0}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Next prompt"
            onClick={() => go(1)}
            disabled={activeIdx === displayPrompts.length - 1}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {active && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Prompt card */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {active.domain}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      background: TYPE_COLOR[active.type] + "20",
                      color: TYPE_COLOR[active.type],
                    }}
                  >
                    {active.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {DIFF_EMOJI[active.difficulty]} {active.difficulty}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ⏱ {active.timeLimit}s
                  </span>
                </div>
                <p className="text-[17px] font-bold text-foreground leading-snug">
                  {active.prompt}
                </p>
              </div>

              {/* Countdown */}
              {phase === "countdown" && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div
                    data-testid="voice-countdown"
                    className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl font-black"
                    style={{
                      borderColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {countdown}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Get ready to speak...
                  </p>
                </div>
              )}

              {/* Recording panel */}
              {(phase === "recording" ||
                phase === "done" ||
                phase === "idle") && (
                <div className="flex flex-col items-center gap-5 py-4">
                  {/* Circular timer SVG */}
                  <div className="relative">
                    <svg width={120} height={120} className="-rotate-90">
                      <circle
                        cx={60}
                        cy={60}
                        r={50}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth={6}
                      />
                      <circle
                        cx={60}
                        cy={60}
                        r={50}
                        fill="none"
                        stroke={
                          phase === "recording"
                            ? "hsl(var(--chart-5))"
                            : "hsl(var(--primary))"
                        }
                        strokeWidth={6}
                        strokeDasharray={`${timerCircumference}`}
                        strokeDashoffset={`${timerCircumference * (1 - timerPct)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono text-foreground">
                        {mm}:{ss}
                      </span>
                      {phase === "recording" && (
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "hsl(var(--chart-5))" }}
                        >
                          ● REC
                        </span>
                      )}
                      {phase === "idle" && (
                        <span className="text-[10px] text-muted-foreground">
                          Ready
                        </span>
                      )}
                      {phase === "done" && (
                        <span className="text-[10px] text-muted-foreground">
                          Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  {phase === "idle" &&
                    (srSupported ? (
                      <button
                        data-testid="voice-start-btn"
                        onClick={startCountdown}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                        style={{
                          background: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                        }}
                      >
                        Start
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted/30 text-center">
                        <p className="text-sm text-foreground">
                          Speech Recognition is not supported in this browser.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please use Google Chrome for voice practice features.
                        </p>
                      </div>
                    ))}
                  {phase === "recording" && (
                    <button
                      data-testid="voice-stop-btn"
                      onClick={stop}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
                      style={{
                        background: "hsl(var(--chart-5) / 0.15)",
                        color: "hsl(var(--chart-5))",
                        border: "1.5px solid hsl(var(--chart-5) / 0.5)",
                      }}
                    >
                      Stop
                    </button>
                  )}
                  {phase === "done" && (
                    <button
                      data-testid="voice-retry-btn"
                      onClick={retry}
                      className="px-5 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Your response
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                  </p>
                </div>
              )}

              {/* Key Points */}
              <div className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setKeyPointsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span>📌 Key Points to Cover</span>
                  <span className="text-muted-foreground text-xs">
                    {keyPointsOpen ? "▲" : "▼"}
                  </span>
                </button>
                {keyPointsOpen && (
                  <div className="px-4 pb-4 space-y-1.5 bg-card/50">
                    {active.keyPoints.map((kp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="shrink-0 mt-0.5"
                          style={{ color: "hsl(var(--chart-2))" }}
                        />
                        <span className="text-sm text-foreground">{kp}</span>
                      </div>
                    ))}
                    {active.followUp && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Follow-up:{" "}
                        </span>
                        <span className="text-xs text-foreground">
                          {active.followUp}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Self-rating */}
              {phase === "done" && (
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm font-semibold text-foreground">
                    Rate your response
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        data-testid={`voice-star-${s}`}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          fill={s <= rating ? "hsl(var(--chart-3))" : "none"}
                          style={{ color: "hsl(var(--chart-3))" }}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <button
                      onClick={() => rateAndNext(rating)}
                      className="px-5 py-1.5 rounded-lg text-sm font-bold"
                      style={{
                        background: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                      }}
                    >
                      Next →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
