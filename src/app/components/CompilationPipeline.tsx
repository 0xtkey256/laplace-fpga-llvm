"use client";

import { useEffect, useState } from "react";

const stages = [
  {
    name: "DSL Source",
    icon: "{ }",
    color: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/30",
    activeGlow: "purple",
    time: "< 1ms",
    snippet: `signal soy_drought(
  sentiment < -0.5,
  region == "MT"
) { ... }`,
  },
  {
    name: "AST Parse",
    icon: "🌳",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    activeGlow: "blue",
    time: "0.3ms",
    snippet: `{
  type: "Signal",
  name: "soy_drought",
  conditions: [
    { op: "<", field: "sentiment", val: -0.5 },
    { op: "==", field: "region", val: "MT" }
  ],
  actions: [ ... ]
}`,
  },
  {
    name: "LLVM IR",
    icon: "⚙",
    color: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    activeGlow: "cyan",
    time: "2.8ms",
    snippet: `define void @soy_drought(%ctx* %0) {
entry:
  %sent = load double, ptr gep(%0, 0, 1)
  %cmp = fcmp olt double %sent, -0.5
  br i1 %cmp, label %check, label %exit
check:
  %reg = load ptr, ptr gep(%0, 0, 2)
  ...
}`,
  },
  {
    name: "Optimize",
    icon: "⚡",
    color: "from-green-500/20 to-green-600/10",
    border: "border-green-500/30",
    activeGlow: "green",
    time: "14.7ms",
    snippet: `; 3 passes applied:
;   - Dead Code Elimination
;   - Constant Folding
;   - Instruction Combining
; Instructions: 24 → 18 (-25%)
define void @soy_drought(%ctx* %0) {
  ...optimized IR...
}`,
  },
  {
    name: "Native x86",
    icon: "🔧",
    color: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/30",
    activeGlow: "yellow",
    time: "0.9ms",
    snippet: `soy_drought:
  mov   rax, [rdi+0x8]
  ucomisd xmm0, [rip+.LC0]
  jae   .exit
  mov   rcx, [rdi+0x10]
  cmp   dword [rcx], 0x4D54
  jne   .exit
  ; emit signal...
  ret`,
  },
];

interface CompilationPipelineProps {
  compiling: boolean;
  onComplete: () => void;
}

export default function CompilationPipeline({
  compiling,
  onComplete,
}: CompilationPipelineProps) {
  const [activeStage, setActiveStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    if (!compiling) {
      setActiveStage(-1);
      setCompletedStages([]);
      return;
    }

    let stage = 0;
    setActiveStage(0);
    setCompletedStages([]);

    const interval = setInterval(() => {
      stage++;
      if (stage >= stages.length) {
        setActiveStage(-1);
        setCompletedStages(stages.map((_, i) => i));
        clearInterval(interval);
        setTimeout(onComplete, 500);
      } else {
        setActiveStage(stage);
        setCompletedStages((prev) => [...prev, stage - 1]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [compiling, onComplete]);

  return (
    <div className="space-y-3">
      {/* Pipeline stages */}
      <div className="flex items-start gap-1">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-start flex-1 min-w-0">
            {/* Stage card */}
            <div
              className={`flex-1 min-w-0 rounded-lg p-2.5 bg-gradient-to-b ${stage.color} border ${
                activeStage === i
                  ? `${stage.border} stage-active`
                  : completedStages.includes(i)
                  ? stage.border
                  : "border-white/[0.05]"
              } transition-all duration-300`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{stage.icon}</span>
                <span className="text-[9px] font-mono font-bold text-gray-300 truncate">
                  {stage.name}
                </span>
              </div>

              {/* Snippet - show when active or completed */}
              {(activeStage === i || completedStages.includes(i)) && (
                <div className="mt-1.5 bg-black/40 rounded-md p-1.5 overflow-hidden">
                  <pre className="text-[7px] font-mono text-gray-500 leading-tight whitespace-pre-wrap break-all">
                    {stage.snippet}
                  </pre>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[7px] font-mono text-gray-600">{stage.time}</span>
                {activeStage === i && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-live" />
                )}
                {completedStages.includes(i) && (
                  <span className="text-[7px] font-mono text-green-400">✓</span>
                )}
              </div>
            </div>

            {/* Arrow */}
            {i < stages.length - 1 && (
              <div className="flex items-center px-1 mt-5">
                <span
                  className={`text-[10px] transition-colors duration-300 ${
                    completedStages.includes(i)
                      ? "text-green-500"
                      : "text-gray-700"
                  }`}
                >
                  →
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total time */}
      {completedStages.length === stages.length && (
        <div className="text-center animate-fade-in">
          <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            ✓ Compiled in 18.7ms — Strategy HOT
          </span>
        </div>
      )}
    </div>
  );
}
