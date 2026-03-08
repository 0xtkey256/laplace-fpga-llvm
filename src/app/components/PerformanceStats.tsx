"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { target: 18889, label: "FPGA vs CPU Speedup", suffix: "x", color: "text-green-400" },
  { target: 45, label: "10K Path Latency", prefix: "<", suffix: "μs", color: "text-cyan-400" },
  { target: 19, label: "JIT Compile Time", prefix: "<", suffix: "ms", color: "text-purple-400" },
  { target: 2.1, label: "Strategies / sec", suffix: "M", color: "text-yellow-400", decimal: 1 },
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function PerformanceStats() {
  const [values, setValues] = useState(stats.map(() => 0));
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const duration = 2000; // ms
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      setValues(stats.map((s) => s.target * eased));

      if (t < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  return (
    <div ref={ref} className="p-8 rounded-xl bg-white/[0.02] border border-white/10">
      <h2 className="text-lg font-bold text-gray-400 mb-6 font-mono text-center">
        THEORETICAL PERFORMANCE
      </h2>
      <div className="grid grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className={`text-3xl font-bold font-mono ${s.color}`}>
              {s.prefix || ""}
              {s.decimal
                ? values[i].toFixed(s.decimal)
                : Math.round(values[i]).toLocaleString()}
              {s.suffix}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2 uppercase">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
