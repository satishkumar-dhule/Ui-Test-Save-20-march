import { useState, useEffect, useRef, useCallback } from "react";
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Menu,
} from "lucide-react";
import type { CodingChallenge, Language } from "@/data/coding";
import type { ReactElement } from "react";
import { progressApi } from "@/services/progressApi";

const DIFF_COLORS: Record<string, string> = {
  easy: "hsl(var(--chart-2))",
  medium: "hsl(var(--chart-3))",
  hard: "hsl(var(--chart-5))",
};

const LANGS: { id: Language; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
];

function renderMd(text: string): ReactElement {
  const lines = text.split("\n");
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return (
          <span key={li}>
            {parts.map((p, pi) => {
              if (p.startsWith("**") && p.endsWith("**"))
                return (
                  <strong key={pi} className="text-foreground">
                    {p.slice(2, -2)}
                  </strong>
                );
              if (p.startsWith("`") && p.endsWith("`"))
                return (
                  <code
                    key={pi}
                    className="px-1 py-0.5 rounded text-xs font-mono"
                    style={{
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--chart-1))",
                    }}
                  >
                    {p.slice(1, -1)}
                  </code>
                );
              return <span key={pi}>{p}</span>;
            })}
            {li < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </span>
  );
}

function MdBlock({ content }: { content: string }) {
  return (
    <div className="text-sm text-foreground leading-relaxed space-y-2">
      {content.split("\n\n").map((para, i) => (
        <p key={i}>{renderMd(para)}</p>
      ))}
    </div>
  );
}

function SimpleCodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (v: string) => void;
  language: Language;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.substring(0, start) + "  " + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg border border-border">
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border"
        style={{ background: "hsl(var(--muted) / 0.5)" }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#ff5f57" }}
        />
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#febc2e" }}
        />
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#28c840" }}
        />
        <span className="ml-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
          {language}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full h-full min-h-[320px] p-4 font-mono text-sm bg-transparent text-foreground resize-none focus:outline-none"
        style={{
          background: "hsl(var(--card))",
          lineHeight: "1.6",
          tabSize: 2,
        }}
        data-testid="coding-editor"
      />
    </div>
  );
}

type RunResult = {
  status: "pass" | "fail" | "error";
  message: string;
  expected?: string;
  got?: string;
};

function runJSCode(
  code: string,
  testCases: { input: string; expected: string }[],
): RunResult[] {
  const results: RunResult[] = [];
  for (const tc of testCases) {
    try {
      const wrappedCode = `
        'use strict';
        ${code}
        return (${tc.input});
      `;
      const fn = new Function(wrappedCode);
      const result = fn();
      const stringResult = JSON.stringify(result);
      if (stringResult === tc.expected) {
        results.push({ status: "pass", message: tc.input });
      } else {
        results.push({
          status: "fail",
          message: tc.input,
          expected: tc.expected,
          got: stringResult,
        });
      }
    } catch (e: any) {
      results.push({ status: "error", message: e.message });
    }
  }
  return results;
}

interface CodingPageProps {
  challenges: CodingChallenge[];
  channelId: string;
  onCodingUpdate?: (
    challengeId: string,
    status: "not_started" | "in_progress" | "completed",
  ) => void;
}

export function CodingPage({
  challenges,
  channelId,
  onCodingUpdate,
}: CodingPageProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState<Language>("javascript");
  const [code, setCode] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showEli5, setShowEli5] = useState(false);
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<
    "problem" | "approach" | "complexity"
  >("problem");

  const active = challenges[activeIdx];

  useEffect(() => {
    setActiveIdx(0);
    setShowSolution(false);
    setRunResults(null);
    setHintIdx(0);
    setShowHints(false);
    setShowEli5(false);
    setActiveTab("problem");
  }, [channelId]);

  useEffect(() => {
    if (active) {
      setCode(active.starterCode[lang] || active.starterCode.javascript);
      setShowSolution(false);
      setRunResults(null);
      setHintIdx(0);
      setShowHints(false);
      setShowEli5(false);
      setActiveTab("problem");
    }
  }, [active?.id, lang]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setActiveIdx((i) =>
        Math.max(0, Math.min(challenges.length - 1, i + dir)),
      );
    },
    [challenges.length],
  );

  const runCode = () => {
    if (!active) return;
    if (lang === "javascript" || lang === "typescript") {
      const results = runJSCode(code, active.testCases);
      setRunResults(results);
      const allPass = results.every((r) => r.status === "pass");
      if (allPass) {
        setSolvedIds((prev) => new Set([...prev, active.id]));
        onCodingUpdate?.(active.id, "completed");
        progressApi.saveCoding(channelId, active.id, "completed");
      } else {
        onCodingUpdate?.(active.id, "in_progress");
        progressApi.saveCoding(channelId, active.id, "in_progress");
      }
    } else {
      setRunResults([
        {
          status: "error",
          message:
            "In-browser execution is only supported for JavaScript. Use an online Python REPL to test your Python solution.",
        },
      ]);
    }
  };

  const reset = () => {
    if (active)
      setCode(active.starterCode[lang] || active.starterCode.javascript);
    setRunResults(null);
    setShowSolution(false);
  };

  if (challenges.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Code2 size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No coding challenges for this channel
        </h3>
        <p className="text-muted-foreground text-sm">
          Try JavaScript, Algorithms, or React channels.
        </p>
      </div>
    );
  }

  const passCount = runResults?.filter((r) => r.status === "pass").length ?? 0;
  const totalTests = active?.testCases.length ?? 0;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Problem sidebar */}
      <div
        className={`sidebar flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card ${sidebarOpen ? "fixed left-0 top-0 h-full z-40 flex w-72" : "hidden md:flex"}`}
        style={{ width: 260 }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Code2 size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Challenges
          </span>
          <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 rounded-full">
            {challenges.length}
          </span>
        </div>

        {/* Solved count */}
        {solvedIds.size > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Solved</span>
              <span>
                {solvedIds.size}/{challenges.length}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(solvedIds.size / challenges.length) * 100}%`,
                  background: "hsl(var(--chart-2))",
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {challenges.map((ch, i) => (
            <button
              key={ch.id}
              data-testid={`coding-sidebar-${ch.id}`}
              onClick={() => {
                setActiveIdx(i);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-l-2 flex items-center gap-2"
              style={{
                borderLeftColor:
                  i === activeIdx ? "hsl(var(--primary))" : "transparent",
                background:
                  i === activeIdx ? "hsl(var(--primary) / 0.06)" : undefined,
              }}
            >
              {solvedIds.has(ch.id) ? (
                <CheckCircle2
                  size={12}
                  style={{ color: "hsl(var(--chart-2))" }}
                  className="shrink-0"
                />
              ) : (
                <div className="w-3 h-3 rounded-full border border-border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: DIFF_COLORS[ch.difficulty] }}
                  >
                    {ch.difficulty}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {ch.category}
                  </span>
                </div>
                <span className="text-xs text-foreground line-clamp-1">
                  {ch.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem description */}
        <div
          className="flex flex-col border-r border-border overflow-hidden"
          style={{ width: "45%", minWidth: 320 }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-2 px-3 border-b border-border bg-card/50 shrink-0"
            style={{ height: 44 }}
          >
            <button
              aria-label="Open challenges list"
              className="mob-menu md:hidden items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-1 flex-1 overflow-x-auto">
              {(["problem", "approach", "complexity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="text-xs px-2.5 py-1 rounded shrink-0 transition-colors capitalize"
                  style={{
                    background:
                      activeTab === tab
                        ? "hsl(var(--primary) / 0.12)"
                        : "transparent",
                    color:
                      activeTab === tab
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                    fontWeight: activeTab === tab ? 600 : 400,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              aria-label="Previous challenge"
              onClick={() => go(-1)}
              disabled={activeIdx === 0}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              aria-label="Next challenge"
              onClick={() => go(1)}
              disabled={activeIdx === challenges.length - 1}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {active && (
              <>
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: DIFF_COLORS[active.difficulty] + "20",
                        color: DIFF_COLORS[active.difficulty],
                      }}
                    >
                      {active.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {active.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      ⏱ ~{active.timeEstimate}min
                    </span>
                    {solvedIds.has(active.id) && (
                      <span
                        className="text-[10px] font-bold flex items-center gap-1"
                        style={{ color: "hsl(var(--chart-2))" }}
                      >
                        <CheckCircle2 size={11} /> Solved
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {active.title}
                  </h2>
                  <div className="flex flex-wrap gap-1">
                    {active.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                {activeTab === "problem" && (
                  <div className="space-y-4">
                    <div>
                      <MdBlock content={active.description} />
                    </div>

                    {/* Constraints */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Constraints
                      </div>
                      <ul className="space-y-1">
                        {active.constraints.map((c, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground flex gap-1.5"
                          >
                            <span className="text-muted-foreground shrink-0">
                              •
                            </span>
                            <code className="font-mono">{c}</code>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Examples */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Examples
                      </div>
                      <div className="space-y-2.5">
                        {active.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border bg-muted/20 p-3"
                          >
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="font-semibold text-muted-foreground">
                                  Input:{" "}
                                </span>
                                <code className="font-mono text-foreground">
                                  {ex.input}
                                </code>
                              </div>
                              <div>
                                <span className="font-semibold text-muted-foreground">
                                  Output:{" "}
                                </span>
                                <code className="font-mono text-foreground">
                                  {ex.output}
                                </code>
                              </div>
                              {ex.explanation && (
                                <div className="text-muted-foreground italic">
                                  {ex.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ELI5 */}
                    <div>
                      <button
                        onClick={() => setShowEli5((o) => !o)}
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors"
                        style={{ color: "hsl(var(--chart-3))" }}
                      >
                        🧒 {showEli5 ? "Hide" : "Show"} ELI5
                      </button>
                      {showEli5 && (
                        <div
                          className="p-3 rounded-lg border text-sm text-foreground leading-relaxed"
                          style={{
                            background: "hsl(var(--chart-3) / 0.08)",
                            borderColor: "hsl(var(--chart-3) / 0.25)",
                          }}
                        >
                          {active.eli5}
                        </div>
                      )}
                    </div>

                    {/* Hints */}
                    <div>
                      <button
                        onClick={() => setShowHints((o) => !o)}
                        className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Lightbulb size={12} />{" "}
                        {showHints
                          ? "Hide hints"
                          : `Show hint (${hintIdx + 1}/${active.hints.length})`}
                      </button>
                      {showHints && (
                        <div className="space-y-2">
                          {active.hints.slice(0, hintIdx + 1).map((h, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg border text-sm text-foreground"
                              style={{
                                borderColor: "hsl(var(--primary) / 0.3)",
                                background: "hsl(var(--primary) / 0.05)",
                              }}
                            >
                              <span className="text-[10px] font-bold text-primary mr-1">
                                Hint {i + 1}:
                              </span>{" "}
                              {h}
                            </div>
                          ))}
                          {hintIdx < active.hints.length - 1 && (
                            <button
                              onClick={() => setHintIdx((n) => n + 1)}
                              className="text-xs text-primary hover:underline"
                            >
                              Next hint →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "approach" && (
                  <div className="space-y-3">
                    <div
                      className="p-4 rounded-lg border text-sm text-foreground leading-relaxed whitespace-pre-line"
                      style={{
                        borderColor: "hsl(var(--primary) / 0.25)",
                        background: "hsl(var(--primary) / 0.05)",
                      }}
                    >
                      <MdBlock content={active.approach} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Related Concepts
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {active.relatedConcepts.map((rc, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                          >
                            {rc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "complexity" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-border bg-card text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Time Complexity
                        </div>
                        <div
                          className="text-xl font-bold font-mono"
                          style={{ color: "hsl(var(--chart-1))" }}
                        >
                          {active.complexity.time}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-card text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Space Complexity
                        </div>
                        <div
                          className="text-xl font-bold font-mono"
                          style={{ color: "hsl(var(--chart-4))" }}
                        >
                          {active.complexity.space}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20 text-sm text-foreground">
                      {active.complexity.explanation}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Editor + Output */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-2 px-3 border-b border-border bg-card/50 shrink-0"
            style={{ height: 44 }}
          >
            {/* Language switcher */}
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  data-testid={`coding-lang-${l.id}`}
                  aria-label={`Switch to ${l.label}`}
                  onClick={() => setLang(l.id)}
                  className="text-[11px] px-2 py-0.5 rounded border transition-colors"
                  style={{
                    borderColor:
                      lang === l.id
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    background:
                      lang === l.id
                        ? "hsl(var(--primary) / 0.12)"
                        : "transparent",
                    color:
                      lang === l.id
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                    fontWeight: lang === l.id ? 600 : 400,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                data-testid="coding-reset-btn"
                aria-label="Reset code to starter"
                onClick={reset}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                <RotateCcw size={11} /> Reset
              </button>
              <button
                aria-label={showSolution ? "Hide solution" : "Show solution"}
                onClick={() => setShowSolution((s) => !s)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors"
                style={{
                  borderColor: showSolution
                    ? "hsl(var(--chart-3) / 0.5)"
                    : "hsl(var(--border))",
                  color: showSolution
                    ? "hsl(var(--chart-3))"
                    : "hsl(var(--muted-foreground))",
                  background: showSolution
                    ? "hsl(var(--chart-3) / 0.1)"
                    : "transparent",
                }}
              >
                {showSolution ? <EyeOff size={11} /> : <Eye size={11} />}
                {showSolution ? "Hide sol." : "Solution"}
              </button>
              <button
                data-testid="coding-run-btn"
                aria-label="Run code"
                onClick={runCode}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition-all"
                style={{ background: "hsl(var(--chart-2))", color: "#000" }}
              >
                <Play size={11} fill="currentColor" /> Run
              </button>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
            {showSolution ? (
              <div className="flex-1 overflow-auto rounded-lg border border-border">
                <div
                  className="px-3 py-2 border-b border-border flex items-center gap-2"
                  style={{ background: "hsl(var(--muted) / 0.5)" }}
                >
                  <Eye size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Solution
                  </span>
                </div>
                <pre
                  className="p-4 text-xs font-mono text-foreground overflow-auto leading-relaxed"
                  style={{ background: "hsl(var(--card))" }}
                >
                  {active?.solution[lang] || active?.solution.javascript}
                </pre>
              </div>
            ) : (
              <SimpleCodeEditor
                value={code}
                onChange={setCode}
                language={lang}
              />
            )}

            {/* Test results */}
            {runResults && (
              <div className="rounded-lg border border-border overflow-hidden shrink-0">
                <div
                  className="flex items-center gap-2 px-3 py-2 border-b border-border"
                  style={{ background: "hsl(var(--muted) / 0.4)" }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Test Results
                  </span>
                  <span
                    className="ml-auto text-[11px] font-bold"
                    style={{
                      color:
                        passCount === totalTests
                          ? "hsl(var(--chart-2))"
                          : "hsl(var(--chart-5))",
                    }}
                  >
                    {passCount}/{totalTests} passed
                  </span>
                </div>
                <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                  {runResults.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs p-2 rounded"
                      style={{
                        background:
                          r.status === "pass"
                            ? "hsl(var(--chart-2) / 0.1)"
                            : r.status === "error"
                              ? "hsl(var(--chart-3) / 0.1)"
                              : "hsl(var(--chart-5) / 0.1)",
                      }}
                    >
                      {r.status === "pass" ? (
                        <CheckCircle2
                          size={13}
                          className="shrink-0 mt-0.5"
                          style={{ color: "hsl(var(--chart-2))" }}
                        />
                      ) : (
                        <XCircle
                          size={13}
                          className="shrink-0 mt-0.5"
                          style={{
                            color:
                              r.status === "error"
                                ? "hsl(var(--chart-3))"
                                : "hsl(var(--chart-5))",
                          }}
                        />
                      )}
                      <div className="flex-1 font-mono">
                        {r.status === "pass" && (
                          <span className="text-foreground">
                            Passed: {r.message}
                          </span>
                        )}
                        {r.status === "fail" && (
                          <div className="space-y-0.5">
                            <div className="text-foreground">{r.message}</div>
                            <div className="text-muted-foreground">
                              Expected:{" "}
                              <span className="text-foreground">
                                {r.expected}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Got:{" "}
                              <span style={{ color: "hsl(var(--chart-5))" }}>
                                {r.got}
                              </span>
                            </div>
                          </div>
                        )}
                        {r.status === "error" && (
                          <span style={{ color: "hsl(var(--chart-3))" }}>
                            Error: {r.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
