"use client";

import { useEffect, useRef } from "react";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      return { w: rect.width, h: rect.height };
    };

    const dims = resize();
    if (!dims) return;
    const { w: W, h: H } = dims;

    // Generate circuit grid
    const spacing = 40;
    const nodes: { x: number; y: number }[] = [];
    for (let x = 0; x < W; x += spacing) {
      for (let y = 0; y < H; y += spacing) {
        nodes.push({ x, y });
      }
    }

    // Generate some random connections
    const connections: { from: number; to: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // Connect to right neighbor
      const rightIdx = nodes.findIndex((o) => o.x === n.x + spacing && o.y === n.y);
      if (rightIdx >= 0 && Math.random() > 0.5) connections.push({ from: i, to: rightIdx });
      // Connect to bottom neighbor
      const bottomIdx = nodes.findIndex((o) => o.x === n.x && o.y === n.y + spacing);
      if (bottomIdx >= 0 && Math.random() > 0.6) connections.push({ from: i, to: bottomIdx });
    }

    // Pulses traveling along connections
    type Pulse = { connIdx: number; progress: number; speed: number };
    const pulses: Pulse[] = [];
    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      for (const conn of connections) {
        const a = nodes[conn.from];
        const b = nodes[conn.to];
        ctx.strokeStyle = "rgba(34, 197, 94, 0.03)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.fillStyle = "rgba(34, 197, 94, 0.04)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn pulses
      if (tick % 15 === 0 && pulses.length < 8) {
        pulses.push({
          connIdx: Math.floor(Math.random() * connections.length),
          progress: 0,
          speed: 0.01 + Math.random() * 0.02,
        });
      }

      // Draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) {
          pulses.splice(i, 1);
          continue;
        }

        const conn = connections[pulse.connIdx];
        const a = nodes[conn.from];
        const b = nodes[conn.to];
        const x = a.x + (b.x - a.x) * pulse.progress;
        const y = a.y + (b.y - a.y) * pulse.progress;

        ctx.shadowColor = "rgba(34, 197, 94, 0.5)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(34, 197, 94, ${0.3 + Math.sin(pulse.progress * Math.PI) * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
