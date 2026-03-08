"use client";

import { useState } from "react";

const strategies = [
  {
    name: "Soy Drought",
    tag: "ZS",
    code: `// Schwarzwald Strategy: Soy Drought Detection
signal soy_drought(
  sentiment < -0.5,
  region == "MT",
  source == "local_news"
) {
  adjust sigma += 0.15
  adjust mu    -= 0.08
  emit LONG ZS confidence 0.87
  ttl 48h
}`,
  },
  {
    name: "Copper Strike",
    tag: "HG",
    code: `// Schwarzwald Strategy: Chilean Copper Strike
signal copper_strike(
  sentiment < -0.7,
  region == "Antofagasta",
  keyword == "huelga"
) {
  adjust sigma += 0.22
  adjust mu    -= 0.12
  emit SHORT HG confidence 0.91
  ttl 72h
}`,
  },
  {
    name: "Chip Ban",
    tag: "SOX",
    code: `// Schwarzwald Strategy: Semiconductor Export Ban
signal chip_export_ban(
  sentiment < -0.6,
  region == "JP",
  keyword == "輸出規制"
) {
  adjust sigma += 0.18
  adjust mu    -= 0.10
  emit SHORT SOX confidence 0.83
  ttl 96h
}`,
  },
];

function highlightDSL(code: string) {
  return code.split("\n").map((line, i) => {
    let highlighted = line;

    // Comments
    if (line.trim().startsWith("//")) {
      return (
        <span key={i} className="text-gray-600">
          {line}
        </span>
      );
    }

    // Process tokens
    const parts: JSX.Element[] = [];
    let remaining = line;
    let keyIdx = 0;

    const patterns: [RegExp, string][] = [
      [/\b(signal|adjust|emit|ttl)\b/g, "text-purple-400 font-bold"],
      [/\b(sigma|mu)\b/g, "text-green-400"],
      [/\b(LONG|SHORT)\b/g, "text-yellow-400 font-bold"],
      [/\b(confidence)\b/g, "text-cyan-400"],
      [/(\"[^\"]*\")/g, "text-cyan-400"],
      [/(\b\d+\.?\d*[h]?\b)/g, "text-orange-400"],
      [/([+\-<>=!]+)/g, "text-yellow-400"],
      [/\b(ZS|HG|SOX|MT)\b/g, "text-orange-300"],
    ];

    // Simple approach: render whole line with span replacements
    let result = line;
    const tokens: { start: number; end: number; cls: string }[] = [];

    for (const [pattern, cls] of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(line)) !== null) {
        const overlap = tokens.some(
          (t) =>
            (match!.index >= t.start && match!.index < t.end) ||
            (match!.index + match![0].length > t.start &&
              match!.index + match![0].length <= t.end)
        );
        if (!overlap) {
          tokens.push({ start: match.index, end: match.index + match[0].length, cls });
        }
      }
    }

    tokens.sort((a, b) => a.start - b.start);

    const elements: JSX.Element[] = [];
    let pos = 0;
    for (const token of tokens) {
      if (token.start > pos) {
        elements.push(
          <span key={`${i}-${pos}`} className="text-gray-300">
            {line.slice(pos, token.start)}
          </span>
        );
      }
      elements.push(
        <span key={`${i}-${token.start}`} className={token.cls}>
          {line.slice(token.start, token.end)}
        </span>
      );
      pos = token.end;
    }
    if (pos < line.length) {
      elements.push(
        <span key={`${i}-${pos}`} className="text-gray-300">
          {line.slice(pos)}
        </span>
      );
    }

    return <span key={i}>{elements}</span>;
  });
}

interface DSLEditorProps {
  onCompile: () => void;
}

export default function DSLEditor({ onCompile }: DSLEditorProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const strategy = strategies[activeIdx];
  const lines = highlightDSL(strategy.code);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1.5 mb-3">
        {strategies.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`text-[9px] font-mono px-2 py-1 rounded border transition-colors ${
              activeIdx === i
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-gray-600 border-white/[0.05] bg-transparent hover:border-white/10"
            }`}
          >
            {s.name}
            <span className="ml-1 text-[7px] opacity-50">{s.tag}</span>
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 overflow-auto">
        <pre className="font-mono text-[12px] leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-700 text-right w-6 mr-3 select-none text-[10px] leading-relaxed">
                {i + 1}
              </span>
              {line}
            </div>
          ))}
          <div className="flex">
            <span className="text-gray-700 text-right w-6 mr-3 select-none text-[10px]">
              {lines.length + 1}
            </span>
            <span className="typing-cursor text-green-400">▎</span>
          </div>
        </pre>
      </div>

      {/* Compile button */}
      <button
        onClick={onCompile}
        className="mt-3 self-end px-4 py-2 text-[10px] font-mono font-bold bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/25 transition-colors glow-green"
      >
        ▶ COMPILE
      </button>
    </div>
  );
}
