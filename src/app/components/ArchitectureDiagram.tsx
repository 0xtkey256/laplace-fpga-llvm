"use client";

const softwareLayer = [
  { name: "DSL Editor", desc: "Strategy authoring", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/25" },
  { name: "LLVM Compiler", desc: "IR generation + optimization", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/25" },
  { name: "Strategy Cache", desc: "Hot code management", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/25" },
  { name: "Signal Router", desc: "Parameter dispatch", color: "from-green-500/20 to-green-600/10", border: "border-green-500/25" },
];

const hardwareLayer = [
  { name: "RNG Engine", desc: "Mersenne Twister", color: "from-green-500/20 to-green-600/10", border: "border-green-500/25" },
  { name: "Box-Muller", desc: "Normal distribution", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/25" },
  { name: "GBM Pipeline", desc: "8 parallel lanes", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/25" },
  { name: "Accumulator", desc: "Path statistics", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/25" },
];

export default function ArchitectureDiagram() {
  return (
    <div className="space-y-3">
      {/* Software Layer */}
      <div className="relative rounded-xl border border-purple-500/15 p-4 bg-purple-500/[0.02]">
        <div className="absolute -top-3 left-4 px-2 bg-[#050505]">
          <span className="text-[9px] font-mono text-purple-400 font-bold">LLVM JIT LAYER (Software)</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-1">
          {softwareLayer.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-full rounded-lg p-3 bg-gradient-to-b ${item.color} border ${item.border} text-center`}>
                <span className="text-[11px] font-mono font-bold text-gray-300 block">{item.name}</span>
                <span className="text-[8px] font-mono text-gray-600 block mt-0.5">{item.desc}</span>
              </div>
              {i < softwareLayer.length - 1 && (
                <div className="absolute" style={{ left: `${(i + 1) * 25}%`, top: "50%", transform: "translate(-50%, -50%)" }}>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Horizontal arrows */}
        <div className="flex justify-center gap-0 mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex justify-center">
              <span className="text-green-500/40 text-[10px] font-mono">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* PCIe Connection */}
      <div className="flex justify-center items-center gap-3 py-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/5 border border-green-500/15">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 signal-live" />
          <span className="text-[9px] font-mono text-green-400 font-bold">PCIe Gen4 x16</span>
          <span className="text-[8px] font-mono text-gray-600">32 GB/s</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
      </div>

      {/* Vertical arrows */}
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <span className="text-[8px] font-mono text-gray-600">σ, μ params</span>
          <div className="text-green-500/50 text-lg">↓</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-500/50 text-lg">↑</div>
          <span className="text-[8px] font-mono text-gray-600">price paths</span>
        </div>
      </div>

      {/* Hardware Layer */}
      <div className="relative rounded-xl border border-green-500/15 p-4 bg-green-500/[0.02]">
        <div className="absolute -top-3 left-4 px-2 bg-[#050505]">
          <span className="text-[9px] font-mono text-green-400 font-bold">FPGA FABRIC (Xilinx Alveo U250)</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-1">
          {hardwareLayer.map((item, i) => (
            <div key={i} className={`rounded-lg p-3 bg-gradient-to-b ${item.color} border ${item.border} text-center`}>
              <span className="text-[11px] font-mono font-bold text-gray-300 block">{item.name}</span>
              <span className="text-[8px] font-mono text-gray-600 block mt-0.5">{item.desc}</span>
            </div>
          ))}
        </div>
        {/* Horizontal arrows */}
        <div className="flex justify-center gap-0 mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex justify-center">
              <span className="text-green-500/40 text-[10px] font-mono">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
