"use client";

import { useEffect, useRef, useState } from "react";

const BARS = [
  { label: "FPGA", sublabel: "Xilinx Alveo U250", value: 45, unit: "μs", color: "rgba(34, 197, 94, 0.8)", glow: "rgba(34, 197, 94, 0.4)" },
  { label: "GPU", sublabel: "NVIDIA A100", value: 1200, unit: "μs", color: "rgba(56, 189, 248, 0.8)", glow: "rgba(56, 189, 248, 0.3)" },
  { label: "CPU", sublabel: "Intel Xeon 8380", value: 850000, unit: "μs", color: "rgba(248, 113, 113, 0.6)", glow: "rgba(248, 113, 113, 0.2)" },
];

export default function LatencyChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const [speedups, setSpeedups] = useState({ gpuVsFpga: 0, cpuVsFpga: 0 });

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

    const pad = { top: 30, right: 140, bottom: 40, left: 140 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barGap = 16;
    const barH = (chartH - barGap * (BARS.length - 1)) / BARS.length;

    // Log scale: min = 10μs, max = 1,000,000μs
    const logMin = Math.log10(10);
    const logMax = Math.log10(1000000);
    const xScale = (v: number) =>
      pad.left + ((Math.log10(v) - logMin) / (logMax - logMin)) * chartW;

    let progress = 0;
    const duration = 90; // frames

    const draw = () => {
      progress = Math.min(progress + 1, duration);
      const t = easeOutCubic(progress / duration);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // Grid lines (powers of 10)
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      for (let exp = 1; exp <= 6; exp++) {
        const x = xScale(Math.pow(10, exp));
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, H - pad.bottom);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        const labels: Record<number, string> = {
          1: "10μs",
          2: "100μs",
          3: "1ms",
          4: "10ms",
          5: "100ms",
          6: "1s",
        };
        ctx.fillText(labels[exp] || "", x, H - pad.bottom + 15);
      }

      // Scale label
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LOG SCALE", W / 2, H - 5);

      // Bars
      BARS.forEach((bar, i) => {
        const y = pad.top + i * (barH + barGap);
        const targetX = xScale(bar.value);
        const currentW = (targetX - pad.left) * t;

        // Bar background
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.fillRect(pad.left, y, chartW, barH);

        // Animated bar
        ctx.shadowColor = bar.glow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bar.color;
        const r = 3;
        const bw = Math.max(currentW, r * 2);
        ctx.beginPath();
        ctx.roundRect(pad.left, y + 2, bw, barH - 4, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Left labels
        ctx.textAlign = "right";
        ctx.fillStyle = bar.color;
        ctx.font = "bold 13px monospace";
        ctx.fillText(bar.label, pad.left - 12, y + barH / 2 - 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "8px monospace";
        ctx.fillText(bar.sublabel, pad.left - 12, y + barH / 2 + 12);

        // Right value
        ctx.textAlign = "left";
        ctx.fillStyle = bar.color;
        ctx.font = "bold 12px monospace";
        const displayVal = bar.value >= 1000
          ? `${(bar.value / 1000).toFixed(bar.value >= 100000 ? 0 : 1)}ms`
          : `${bar.value}μs`;
        ctx.fillText(displayVal, pad.left + currentW + 8, y + barH / 2 + 4);
      });

      // Speedup annotations
      if (t > 0.5) {
        const annotAlpha = (t - 0.5) * 2;
        // FPGA vs CPU
        ctx.fillStyle = `rgba(34, 197, 94, ${annotAlpha * 0.7})`;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `${Math.round(18889 * t).toLocaleString()}x faster`,
          W - pad.right + 12,
          pad.top + barH / 2 + 4
        );

        // FPGA vs GPU
        ctx.fillStyle = `rgba(56, 189, 248, ${annotAlpha * 0.5})`;
        ctx.font = "10px monospace";
        ctx.fillText(
          `${Math.round(26.7 * t)}x`,
          W - pad.right + 12,
          pad.top + barH + barGap + barH / 2 + 4
        );

        setSpeedups({
          gpuVsFpga: Math.round(26.7 * t),
          cpuVsFpga: Math.round(18889 * t),
        });
      }

      if (progress < duration) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    // Trigger on scroll into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          progress = 0;
          draw();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ minHeight: 220 }}
    />
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
