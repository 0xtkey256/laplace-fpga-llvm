"use client";

import { useEffect, useRef, useState } from "react";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "compile";
}

interface HotStrategy {
  name: string;
  compileTime: string;
  invocations: number;
  avgLatency: string;
}

const strategyPool = [
  { name: "soy_drought_v3", commodity: "ZS", compileMs: "18.7" },
  { name: "copper_strike_v2", commodity: "HG", compileMs: "14.2" },
  { name: "chip_ban_v1", commodity: "SOX", compileMs: "21.3" },
  { name: "coffee_frost_v1", commodity: "KC", compileMs: "16.8" },
  { name: "wheat_flood_v2", commodity: "ZW", compileMs: "19.1" },
  { name: "palm_oil_fire_v1", commodity: "CPO", compileMs: "15.5" },
];

function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + "." + String(now.getMilliseconds()).padStart(3, "0");
}

export default function JITDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hotStrategies, setHotStrategies] = useState<HotStrategy[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentlyCompiling, setCurrentlyCompiling] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const poolIdx = useRef(0);
  const invocationTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const compileStrategy = () => {
      const strategy = strategyPool[poolIdx.current % strategyPool.length];
      poolIdx.current++;

      // Add to queue
      setQueue((prev) => [...prev, strategy.name]);
      setLogs((prev) => [
        ...prev,
        { time: getTimestamp(), message: `Received: ${strategy.name}`, type: "info" },
      ]);

      // Compile sequence
      setTimeout(() => {
        setCurrentlyCompiling(strategy.name);
        setQueue((prev) => prev.filter((s) => s !== strategy.name));
        setLogs((prev) => [
          ...prev,
          { time: getTimestamp(), message: `Parsing DSL... OK (0.3ms)`, type: "compile" },
        ]);
      }, 400);

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          { time: getTimestamp(), message: `Generating LLVM IR... OK (2.8ms)`, type: "compile" },
        ]);
      }, 800);

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          { time: getTimestamp(), message: `Running optimization passes... OK (${strategy.compileMs}ms)`, type: "compile" },
        ]);
      }, 1400);

      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          { time: getTimestamp(), message: `Emitting x86_64 native code... OK (0.9ms)`, type: "compile" },
        ]);
      }, 1800);

      setTimeout(() => {
        setCurrentlyCompiling(null);
        setLogs((prev) => [
          ...prev,
          {
            time: getTimestamp(),
            message: `Strategy HOT → ${strategy.name} [${strategy.commodity}]`,
            type: "success",
          },
        ]);
        setHotStrategies((prev) => [
          {
            name: strategy.name,
            compileTime: `${strategy.compileMs}ms`,
            invocations: 0,
            avgLatency: `${(Math.random() * 40 + 20).toFixed(0)}ns`,
          },
          ...prev,
        ]);
      }, 2200);
    };

    // Start first compile quickly
    const t1 = setTimeout(compileStrategy, 500);
    // Then every 4 seconds
    const interval = setInterval(compileStrategy, 4000);

    return () => {
      clearTimeout(t1);
      clearInterval(interval);
      invocationTimers.current.forEach(clearTimeout);
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Tick up invocations
  useEffect(() => {
    const interval = setInterval(() => {
      setHotStrategies((prev) =>
        prev.map((s) => ({
          ...s,
          invocations: s.invocations + Math.floor(Math.random() * 50 + 10),
        }))
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 min-h-[280px]">
      {/* Strategy Queue */}
      <div className="flex flex-col">
        <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-2">
          Incoming Queue
        </h3>
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {queue.length === 0 && !currentlyCompiling && (
            <p className="text-[9px] font-mono text-gray-700 italic">Waiting for strategies...</p>
          )}
          {currentlyCompiling && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-yellow-500/5 border border-yellow-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 signal-live" />
              <span className="text-[9px] font-mono text-yellow-400">{currentlyCompiling}</span>
              <span className="text-[7px] font-mono text-gray-600 ml-auto">COMPILING</span>
            </div>
          )}
          {queue.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white/[0.02] border border-white/[0.05]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 skeleton-pulse" />
              <span className="text-[9px] font-mono text-gray-400">{name}</span>
              <span className="text-[7px] font-mono text-gray-700 ml-auto">QUEUED</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compiler Log */}
      <div className="flex flex-col">
        <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-2">
          Compiler Output
        </h3>
        <div
          ref={logRef}
          className="flex-1 bg-black/60 border border-white/[0.08] rounded-lg p-2 overflow-y-auto"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex gap-1.5 mb-0.5">
              <span className="text-[8px] font-mono text-gray-700 flex-shrink-0">
                [{log.time}]
              </span>
              <span
                className={`text-[8px] font-mono ${
                  log.type === "success"
                    ? "text-green-400 font-bold"
                    : log.type === "compile"
                    ? "text-cyan-400/70"
                    : "text-gray-500"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
          <span className="typing-cursor text-green-400 text-[10px]">▎</span>
        </div>
      </div>

      {/* Hot Strategies */}
      <div className="flex flex-col">
        <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-2">
          Hot Strategies
        </h3>
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {hotStrategies.length === 0 && (
            <p className="text-[9px] font-mono text-gray-700 italic">No compiled strategies yet...</p>
          )}
          {hotStrategies.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="px-2 py-1.5 rounded bg-green-500/5 border border-green-500/15 animate-fade-in"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] font-mono text-green-400 font-bold">{s.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[7px] font-mono text-gray-600">
                <span>compile: {s.compileTime}</span>
                <span>calls: {s.invocations.toLocaleString()}</span>
                <span>lat: {s.avgLatency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
