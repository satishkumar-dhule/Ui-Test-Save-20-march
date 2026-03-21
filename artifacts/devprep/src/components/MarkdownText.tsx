import type { ReactNode } from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
  compact?: boolean;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded text-[0.8em] font-mono"
          style={{
            background: "hsl(var(--muted))",
            color: "hsl(var(--chart-1))",
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

type Block =
  | { type: "code"; lang: string; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "para"; text: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().replace(/^```/, "").trim() || "code";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      if (codeLines.length > 0) {
        blocks.push({ type: "code", lang, lines: codeLines });
      }
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          text: match[2],
        });
        i++;
        continue;
      }
    }

    if (/^[-*]\s/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.trim() !== "") {
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^[-*]\s/.test(lines[i].trimStart()) &&
        !/^\d+\.\s/.test(lines[i].trimStart()) &&
        !/^#{1,3}\s/.test(lines[i]) &&
        !lines[i].trimStart().startsWith("```")
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "para", text: paraLines.join(" ") });
      continue;
    }

    i++;
  }

  return blocks;
}

export function MarkdownText({ content, className = "", compact = false }: MarkdownTextProps) {
  const blocks = parseBlocks(content);
  const gap = compact ? "space-y-1.5" : "space-y-2.5";

  return (
    <div className={`text-sm leading-relaxed ${gap} ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="text-xs font-mono rounded-lg p-3 overflow-x-auto border border-border leading-relaxed"
              style={{ background: "hsl(var(--muted) / 0.6)" }}
            >
              <code style={{ color: "hsl(var(--foreground))" }}>
                {block.lines.join("\n")}
              </code>
            </pre>
          );
        }

        if (block.type === "heading") {
          const cls =
            block.level === 1
              ? "text-base font-bold text-foreground"
              : block.level === 2
                ? "text-sm font-bold text-foreground"
                : "text-xs font-bold text-muted-foreground uppercase tracking-wide";
          return (
            <p key={idx} className={cls}>
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx} className="space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2 text-sm text-foreground leading-relaxed">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx} className="space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2 text-sm text-foreground leading-relaxed">
                  <span className="shrink-0 font-mono text-xs font-bold mt-0.5" style={{ color: "hsl(var(--primary))", minWidth: "1.2rem" }}>
                    {ii + 1}.
                  </span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="text-sm text-foreground leading-relaxed">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
