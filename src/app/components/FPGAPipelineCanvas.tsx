"use client";

import { useEffect, useRef, useState } from "react";

const STAGES = ["RNG", "Box-Muller", "GBM Step", "Accumulator"];
const LANES = 8;
const STAGE_COLORS = [
  "rgba(34, 197, 94, 0.7)",   // green
  "rgba(56, 189, 248, 0.7)",  // cyan
  "rgba(168, 85, 247, 0.7)",  // purple
  "rgba(250, 204, 21, 0.7)",  // yellow
];

export default function FPGAPipelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const [cycles, setCycles] = useState(0);
  const [throughput, setThroughput] = useState(0);

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

    const pad = { top: 50, right: 30, bottom: 30, left: 30 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const stageW = chartW / STAGES.length;
    const laneH = chartH / LANES;

    let tick = 0;
    const packetSpeed = 0.008; // fraction of stage per frame

    // Each packet: { lane, stageProgress (0-4), alive }
    type Packet = { lane: number; progress: number; id: number };
    let packets: Packet[] = [];
    let nextId = 0;
    let completedPaths = 0;

    const spawnPacket = (lane: number) => {
      packets.push({ lane, progress: 0, id: nextId++ });
    };

    // Initial staggered spawn
    for (let l = 0; l < LANES; l++) {
      packets.push({ lane: l, progress: l * 0.5, id: nextId++ });
    }

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // Stage columns
      for (let s = 0; s < STAGES.length; s++) {
        const x = pad.left + s * stageW;

        // Stage background
        ctx.fillStyle = `rgba(255, 255, 255, ${s % 2 === 0 ? 0.01 : 0.015})`;
        ctx.fillRect(x, pad.top, stageW, chartH);

        // Stage border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, pad.top, stageW, chartH);

        // Stage header
        ctx.fillStyle = STAGE_COLORS[s];
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(STAGES[s], x + stageW / 2, pad.top - 12);

        // Stage number
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px monospace";
        ctx.fillText(`Stage ${s + 1}`, x + stageW / 2, pad.top - 26);
      }

      // Lane separators
      for (let l = 0; l <= LANES; l++) {
        const y = pad.top + l * laneH;
        ctx.strokeStyle = "rgba(34, 197, 94, 0.04)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
      }

      // Lane labels
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      for (let l = 0; l < LANES; l++) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillText(`P${l}`, pad.left - 6, pad.top + l * laneH + laneH / 2 + 3);
      }

      // Connection lines (horizontal through each lane)
      for (let l = 0; l < LANES; l++) {
        const y = pad.top + l * laneH + laneH / 2;
        ctx.strokeStyle = "rgba(34, 197, 94, 0.06)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Update & draw packets
      const toRemove: number[] = [];
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        p.progress += packetSpeed;

        if (p.progress >= STAGES.length) {
          toRemove.push(i);
          completedPaths++;
          continue;
        }

        const currentStage = Math.floor(p.progress);
        const stageT = p.progress - currentStage;

        const x = pad.left + (currentStage + stageT) * stageW;
        const y = pad.top + p.lane * laneH + laneH / 2;
        const radius = 4;

        // Glow
        const color = STAGE_COLORS[Math.min(currentStage, 3)];
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner bright dot
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        // Trail
        const trailLen = stageW * 0.3;
        const grad = ctx.createLinearGradient(x - trailLen, y, x, y);
        grad.addColorStop(0, "rgba(34, 197, 94, 0)");
        grad.addColorStop(1, color.replace("0.7", "0.25"));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.max(pad.left, x - trailLen), y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Remove completed & respawn
      for (let i = toRemove.length - 1; i >= 0; i--) {
        const lane = packets[toRemove[i]].lane;
        packets.splice(toRemove[i], 1);
        spawnPacket(lane);
      }

      // Output merge animation on right side
      const outX = W - pad.right + 5;
      const mergeGlow = Math.sin(tick * 0.05) * 0.3 + 0.5;
      ctx.shadowColor = "rgba(250, 204, 21, 0.6)";
      ctx.shadowBlur = 15 * mergeGlow;
      ctx.fillStyle = `rgba(250, 204, 21, ${0.3 + mergeGlow * 0.4})`;
      ctx.beginPath();
      ctx.arc(outX, pad.top + chartH / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(250, 204, 21, 0.5)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("OUT", outX, pad.top + chartH / 2 + 18);

      // Stats overlay
      setCycles(tick);
      setThroughput(completedPaths);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ minHeight: 340 }}
      />
      <div className="absolute top-3 right-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-600">CYCLES</span>
          <span className="text-[11px] font-mono font-bold text-green-400">{cycles}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-600">PATHS</span>
          <span className="text-[11px] font-mono font-bold text-yellow-400">{throughput}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-live" />
          <span className="text-[8px] font-mono text-green-400">200MHz</span>
        </div>
      </div>
    </div>
  );
}
