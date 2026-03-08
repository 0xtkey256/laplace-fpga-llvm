"use client";

import { useState, useCallback } from "react";
import CircuitBackground from "./components/CircuitBackground";
import FPGAPipelineCanvas from "./components/FPGAPipelineCanvas";
import ParallelPathsCanvas from "./components/ParallelPathsCanvas";
import LatencyChart from "./components/LatencyChart";
import DSLEditor from "./components/DSLEditor";
import CompilationPipeline from "./components/CompilationPipeline";
import LLVMIRViewer from "./components/LLVMIRViewer";
import JITDemo from "./components/JITDemo";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import PerformanceStats from "./components/PerformanceStats";

export default function Home() {
  const [compiling, setCompiling] = useState(false);

  const handleCompile = useCallback(() => {
    setCompiling(true);
  }, []);

  const handleCompileComplete = useCallback(() => {
    setTimeout(() => setCompiling(false), 2000);
  }, []);

  return (
    <main className="min-h-screen forest-bg">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-3 border-b border-white/[0.05] bg-black/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <a
            href="https://ai-hedge-fund-one.vercel.app"
            className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-white">Laplace</span>
            <span className="text-green-400">Lattice</span>
          </a>
          <span className="text-[9px] font-mono text-green-400/60 border border-green-500/20 px-1.5 py-0.5 rounded">
            FPGA/LLVM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-gray-500">
            Taiki Nakamura · Infrastructure
          </span>
          <a
            href="https://ai-hedge-fund-one.vercel.app/dashboard"
            className="text-[9px] font-mono px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <CircuitBackground />
        <div className="relative max-w-6xl mx-auto px-6 z-10">
          <div className="animate-fade-in">
            <div className="inline-block mb-4 px-3 py-1 text-xs font-mono text-green-400 border border-green-500/30 rounded-full bg-green-500/10">
              YC Hackathon 2026 · Execution Layer
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">The Execution</span>
              <br />
              <span className="text-green-400">Layer</span>
            </h1>
            <p className="text-sm font-mono text-gray-500 mb-2">
              powered by <span className="text-green-400">FPGA</span> +{" "}
              <span className="text-purple-400">LLVM</span>
            </p>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed">
              Hardware-accelerated Monte Carlo simulation meets JIT-compiled
              trading strategies. From{" "}
              <span className="text-green-400 font-semibold">signal to trade</span>{" "}
              in microseconds.
            </p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg animate-fade-in-delay-2">
            <div>
              <div className="text-3xl font-bold text-green-400">18,889x</div>
              <div className="text-xs text-gray-500 font-mono mt-1">FPGA SPEEDUP</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">&lt;50μs</div>
              <div className="text-xs text-gray-500 font-mono mt-1">10K PATH LATENCY</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">&lt;20ms</div>
              <div className="text-xs text-gray-500 font-mono mt-1">JIT COMPILE TIME</div>
            </div>
          </div>
        </div>
      </section>

      {/* FPGA Pipeline */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">FPGA Pipeline Architecture</h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          RNG → Box-Muller → GBM Step → Accumulator · 8 parallel lanes @ 200MHz
        </p>
        <div className="card p-4">
          <FPGAPipelineCanvas />
        </div>
        <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/10">
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            <span className="text-green-400 font-bold">How it works:</span>{" "}
            Each lane is a fully pipelined Monte Carlo path generator. Data packets (colored dots)
            flow through 4 stages in parallel — while lane 0 accumulates its result, lane 7 is still
            generating random numbers. This achieves near-100% hardware utilization and produces
            one complete path per clock cycle per lane.
          </p>
        </div>
      </section>

      {/* Parallel vs Sequential */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">
          Why FPGA Wins: Parallel vs Sequential
        </h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          Same 48 Monte Carlo paths · FPGA runs all simultaneously · CPU runs one at a time
        </p>
        <div className="card p-4">
          <ParallelPathsCanvas />
        </div>
      </section>

      {/* Latency */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">Latency Comparison</h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          10,000 Monte Carlo paths · Geometric Brownian Motion · Log scale
        </p>
        <div className="card p-4">
          <LatencyChart />
        </div>
      </section>

      {/* LLVM Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">LLVM JIT Strategy Compiler</h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          Custom DSL → AST → LLVM IR → Optimized → Native x86/ARM · Click COMPILE to see the pipeline
        </p>
        <div className="grid lg:grid-cols-2 gap-6">
          <DSLEditor onCompile={handleCompile} />
          <LLVMIRViewer compiling={compiling} />
        </div>
        <div className="mt-6">
          <CompilationPipeline
            compiling={compiling}
            onComplete={handleCompileComplete}
          />
        </div>
      </section>

      {/* JIT Demo */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">Runtime JIT Compilation</h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          Strategies arrive in real-time → compiled to native code → deployed hot · Zero downtime
        </p>
        <div className="card p-4">
          <JITDemo />
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">Combined Architecture</h2>
        <p className="text-gray-500 mb-8 text-sm font-mono">
          Software (LLVM JIT) ↔ Hardware (FPGA Fabric) via PCIe Gen4
        </p>
        <ArchitectureDiagram />
      </section>

      {/* Performance Stats */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <PerformanceStats />
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 text-center">
        <div className="text-gray-600 text-xs font-mono">
          Built at YC Hackathon Tokyo 2026 · Laplace Lattice · Taiki Nakamura
        </div>
      </footer>
    </main>
  );
}
