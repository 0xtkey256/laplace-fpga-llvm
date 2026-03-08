"use client";

import { useEffect, useState } from "react";

interface IRLine {
  text: string;
  removed?: boolean;
  modified?: string;
  pass?: string;
}

const initialIR: IRLine[] = [
  { text: "define void @soy_drought(%ctx* %0) {" },
  { text: "entry:" },
  { text: "  %1 = getelementptr %ctx, ptr %0, i32 0, i32 1" },
  { text: "  %sentiment = load double, ptr %1" },
  { text: "  %2 = getelementptr %ctx, ptr %0, i32 0, i32 2" },
  { text: "  %region_ptr = load ptr, ptr %2" },
  { text: "  %threshold = sitofp i32 -1 to double", removed: true, pass: "Constant Folding" },
  { text: "  %half = fdiv double %threshold, 2.0", removed: true, pass: "Constant Folding" },
  { text: "  %cmp = fcmp olt double %sentiment, -0.500000e+00", modified: "  %cmp = fcmp olt double %sentiment, double -5.000000e-01", pass: "Constant Folding" },
  { text: "  br i1 %cmp, label %check_region, label %exit" },
  { text: "check_region:" },
  { text: "  %3 = call ptr @strdup(ptr %region_ptr)", removed: true, pass: "Dead Code Elim" },
  { text: "  %4 = call i32 @strcmp(ptr %region_ptr, ptr @.str.MT)" },
  { text: "  %5 = icmp eq i32 %4, 0", modified: "  %cmp2 = icmp eq i32 %4, 0", pass: "Instr. Combine" },
  { text: "  br i1 %5, label %emit, label %exit", modified: "  br i1 %cmp2, label %emit, label %exit", pass: "Instr. Combine" },
  { text: "emit:" },
  { text: "  %sigma_ptr = getelementptr %ctx, ptr %0, i32 0, i32 3" },
  { text: "  %sigma = load double, ptr %sigma_ptr" },
  { text: "  %new_sigma = fadd double %sigma, 1.500000e-01" },
  { text: "  store double %new_sigma, ptr %sigma_ptr" },
  { text: "  %mu_ptr = getelementptr %ctx, ptr %0, i32 0, i32 4" },
  { text: "  %mu = load double, ptr %mu_ptr" },
  { text: "  %new_mu = fsub double %mu, 8.000000e-02" },
  { text: "  store double %new_mu, ptr %mu_ptr" },
  { text: "  call void @emit_signal(ptr @.str.LONG, ptr @.str.ZS, double 8.700000e-01)" },
  { text: "  br label %exit" },
  { text: "exit:" },
  { text: "  ret void" },
  { text: "}" },
];

interface LLVMIRViewerProps {
  compiling: boolean;
}

export default function LLVMIRViewer({ compiling }: LLVMIRViewerProps) {
  const [lines, setLines] = useState(initialIR);
  const [activePasses, setActivePasses] = useState<string[]>([]);
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ before: initialIR.length, after: initialIR.length, passes: 0 });

  useEffect(() => {
    if (!compiling) return;

    // Reset
    setLines(initialIR);
    setActivePasses([]);
    setHighlightedLines(new Set());

    // Collect passes in order
    const passes = [
      { name: "Constant Folding", delay: 1200 },
      { name: "Dead Code Elim", delay: 2400 },
      { name: "Instr. Combine", delay: 3600 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    passes.forEach(({ name, delay }) => {
      const t = setTimeout(() => {
        setActivePasses((prev) => [...prev, name]);

        // Find affected lines
        const affected = new Set<number>();
        initialIR.forEach((line, i) => {
          if (line.pass === name) affected.add(i);
        });
        setHighlightedLines(affected);

        // Clear highlights after a moment
        const t2 = setTimeout(() => setHighlightedLines(new Set()), 800);
        timeouts.push(t2);
      }, delay);
      timeouts.push(t);
    });

    // Final stats
    const t = setTimeout(() => {
      const removedCount = initialIR.filter((l) => l.removed).length;
      setStats({
        before: initialIR.length,
        after: initialIR.length - removedCount,
        passes: passes.length,
      });
    }, 4500);
    timeouts.push(t);

    return () => timeouts.forEach(clearTimeout);
  }, [compiling]);

  const isPassApplied = (passName: string) => activePasses.includes(passName);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold text-gray-400">LLVM IR Output</span>
        <div className="flex gap-1.5">
          {["Constant Folding", "Dead Code Elim", "Instr. Combine"].map((pass) => (
            <span
              key={pass}
              className={`text-[7px] font-mono px-1.5 py-0.5 rounded border transition-all duration-300 ${
                isPassApplied(pass)
                  ? "text-purple-400 bg-purple-500/15 border-purple-500/20"
                  : "text-gray-700 border-white/[0.05]"
              }`}
            >
              {pass}
            </span>
          ))}
        </div>
      </div>

      {/* IR Code */}
      <div className="flex-1 bg-black/60 border border-white/[0.08] rounded-xl p-3 overflow-auto font-mono text-[10px] leading-relaxed">
        {lines.map((line, i) => {
          const isRemoved = line.removed && isPassApplied(line.pass || "");
          const isModified = line.modified && isPassApplied(line.pass || "");
          const isHighlighted = highlightedLines.has(i);

          if (isRemoved) {
            return (
              <div
                key={i}
                className="flex transition-all duration-500 opacity-20 line-through"
              >
                <span className="text-gray-800 w-5 text-right mr-2 select-none">{i + 1}</span>
                <span className="text-gray-700">{line.text}</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`flex transition-all duration-300 ${
                isHighlighted ? "ir-highlight" : ""
              }`}
            >
              <span className="text-gray-800 w-5 text-right mr-2 select-none">{i + 1}</span>
              <span className={isModified ? "text-green-400" : "text-gray-500"}>
                {isModified ? line.modified : line.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      {activePasses.length > 0 && (
        <div className="mt-2 flex items-center gap-3 text-[8px] font-mono text-gray-600">
          <span>Instructions: {stats.before} → {stats.after}</span>
          <span>({Math.round(((stats.before - stats.after) / stats.before) * 100)}% reduced)</span>
          <span>{activePasses.length}/{3} passes</span>
        </div>
      )}
    </div>
  );
}
