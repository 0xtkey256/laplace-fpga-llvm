"use client";

import { useEffect, useRef, useState } from "react";

function generateBrownianMotion(
  startPrice: number,
  days: number,
  mu: number,
  sigma: number,
  paths: number
): number[][] {
  const dt = 1 / 252;
  const results: number[][] = [];
  for (let p = 0; p < paths; p++) {
    const path = [startPrice];
    for (let i = 1; i < days; i++) {
      const randomShock =
        Math.sqrt(dt) *
        (Math.sqrt(-2 * Math.log(Math.random())) *
          Math.cos(2 * Math.PI * Math.random()));
      const drift = (mu - 0.5 * sigma * sigma) * dt;
      const diffusion = sigma * randomShock;
      path.push(path[i - 1] * Math.exp(drift + diffusion));
    }
    results.push(path);
  }
  return results;
}

export default function ParallelPathsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const [fpgaDone, setFpgaDone] = useState(false);
  const [cpuDone, setCpuDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const NUM_PATHS = 48;
    const DAYS = 60;
    const paths = generateBrownianMotion(100, DAYS, 0.1, 0.28, NUM_PATHS);

    const allPrices = paths.flat();
    const minP = Math.min(...allPrices) * 0.98;
    const maxP = Math.max(...allPrices) * 1.02;

    const pad = { top: 40, bottom: 35, left: 20, right: 20 };
    const halfW = W / 2;
    const gap = 20;
    const chartH = H - pad.top - pad.bottom;

    // FPGA: all paths advance together
    // CPU: one path at a time, fully drawn before next
    let fpgaStep = 0;
    let cpuPathIdx = 0;
    let cpuStep = 0;
    const fpgaSpeed = 1; // steps per frame
    const cpuSpeed = 3; // faster per-path but sequential

    let fpgaFinished = false;
    let cpuFinished = false;
    let fpgaCycles = 0;
    let cpuCycles = 0;

    const xScale = (i: number, offsetX: number, chartW: number) =>
      offsetX + pad.left + (i / (DAYS - 1)) * (chartW - pad.left - pad.right);
    const yScale = (p: number) =>
      pad.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

    const drawPath = (
      path: number[],
      steps: number,
      color: string,
      offsetX: number,
      chartW: number
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      const limit = Math.min(steps, path.length);
      for (let i = 0; i < limit; i++) {
        const x = xScale(i, offsetX, chartW);
        const y = yScale(path[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // Divider
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(halfW, 10);
      ctx.lineTo(halfW, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Headers
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
      ctx.fillText("FPGA (Parallel)", halfW / 2, 20);
      ctx.fillStyle = "rgba(100, 100, 255, 0.8)";
      ctx.fillText("CPU (Sequential)", halfW + halfW / 2, 20);

      // Sub-headers
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
      ctx.fillText(`${NUM_PATHS} paths @ 200MHz`, halfW / 2, 33);
      ctx.fillStyle = "rgba(100, 100, 255, 0.4)";
      ctx.fillText(`${NUM_PATHS} paths @ 3.5GHz`, halfW + halfW / 2, 33);

      // Grid lines for both sides
      for (let side = 0; side < 2; side++) {
        const offsetX = side * halfW;
        const chartW = halfW;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
          const y = pad.top + (i / 4) * chartH;
          ctx.beginPath();
          ctx.moveTo(offsetX + pad.left, y);
          ctx.lineTo(offsetX + chartW - pad.right, y);
          ctx.stroke();
        }
      }

      // FPGA side: all paths advance simultaneously
      if (!fpgaFinished) {
        fpgaStep += fpgaSpeed;
        fpgaCycles++;
        if (fpgaStep >= DAYS) {
          fpgaFinished = true;
          setFpgaDone(true);
        }
      }
      for (const path of paths) {
        drawPath(path, fpgaStep, "rgba(34, 197, 94, 0.12)", 0, halfW);
      }

      // FPGA done flash
      if (fpgaFinished) {
        ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, halfW - 4, H - 4);
      }

      // CPU side: one path fully, then next
      if (!cpuFinished) {
        cpuStep += cpuSpeed;
        cpuCycles++;
        if (cpuStep >= DAYS) {
          cpuPathIdx++;
          cpuStep = 0;
          if (cpuPathIdx >= NUM_PATHS) {
            cpuFinished = true;
            setCpuDone(true);
          }
        }
      }
      // Draw completed CPU paths
      for (let i = 0; i < Math.min(cpuPathIdx, NUM_PATHS); i++) {
        drawPath(paths[i], DAYS, "rgba(100, 100, 255, 0.08)", halfW, halfW);
      }
      // Draw current CPU path in progress
      if (cpuPathIdx < NUM_PATHS) {
        drawPath(paths[cpuPathIdx], cpuStep, "rgba(100, 100, 255, 0.35)", halfW, halfW);
      }

      // CPU done flash
      if (cpuFinished) {
        ctx.strokeStyle = "rgba(100, 100, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(halfW + 2, 2, halfW - 4, H - 4);
      }

      // Progress bars at bottom
      const barY = H - 18;
      const barH = 4;
      // FPGA progress
      const fpgaPct = Math.min(fpgaStep / DAYS, 1);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(pad.left, barY, halfW - pad.left - pad.right - gap, barH);
      ctx.fillStyle = fpgaFinished ? "rgba(34, 197, 94, 0.6)" : "rgba(34, 197, 94, 0.3)";
      ctx.fillRect(pad.left, barY, (halfW - pad.left - pad.right - gap) * fpgaPct, barH);

      // CPU progress
      const cpuPct = Math.min((cpuPathIdx + cpuStep / DAYS) / NUM_PATHS, 1);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(halfW + pad.left, barY, halfW - pad.left - pad.right, barH);
      ctx.fillStyle = cpuFinished ? "rgba(100, 100, 255, 0.6)" : "rgba(100, 100, 255, 0.3)";
      ctx.fillRect(halfW + pad.left, barY, (halfW - pad.left - pad.right) * cpuPct, barH);

      // Cycle counters
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = fpgaFinished ? "rgba(34, 197, 94, 0.7)" : "rgba(34, 197, 94, 0.4)";
      ctx.fillText(fpgaFinished ? `✓ ${fpgaCycles} cycles` : `${fpgaCycles} cycles`, pad.left, barY - 5);
      ctx.fillStyle = cpuFinished ? "rgba(100, 100, 255, 0.7)" : "rgba(100, 100, 255, 0.4)";
      ctx.fillText(
        cpuFinished ? `✓ ${cpuCycles} cycles` : `${cpuCycles} cycles`,
        halfW + pad.left,
        barY - 5
      );

      if (!fpgaFinished || !cpuFinished) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ minHeight: 300 }}
      />
      {fpgaDone && !cpuDone && (
        <div className="absolute top-12 left-4 px-2 py-1 rounded bg-green-500/15 border border-green-500/20">
          <span className="text-[10px] font-mono text-green-400 font-bold">FPGA COMPLETE</span>
          <span className="text-[9px] font-mono text-gray-500 ml-2">waiting for CPU...</span>
        </div>
      )}
    </div>
  );
}
