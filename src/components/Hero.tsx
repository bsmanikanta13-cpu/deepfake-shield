import { useEffect, useRef } from "react";
import { ArrowDown, Play, Shield } from "lucide-react";

function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const spacing = 40;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dist = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
          const wave = Math.sin(dist * 0.008 - time * 2) * 0.5 + 0.5;
          const alpha = wave * 0.15 + 0.02;
          const size = wave * 2 + 0.5;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.fill();
        }
      }

      time += 0.01;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function WaveformVisual() {
  const bars = 48;
  return (
    <div className="flex items-center gap-[2px] h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const h = Math.sin(i * 0.3) * 40 + Math.sin(i * 0.7) * 20 + 50;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-cyan-500 to-blue-400 opacity-70"
            style={{
              height: `${h}%`,
              animation: `pulse ${1 + Math.random() * 2}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="overview"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,transparent_70%)]" />
      <AnimatedGrid />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-cyan-300 text-sm font-medium">
            Self-Supervised Deep Learning Research
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Multi-Modal{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Deep Fake
          </span>
          <br />
          Detection System
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-4 leading-relaxed">
          Leveraging self-supervised <span className="text-cyan-400 font-semibold">WavLM</span> audio
          representations and <span className="text-blue-400 font-semibold">CNN</span> visual features
          for robust, multi-modal detection of AI-generated audio and video content.
        </p>

        <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-10">
          Achieving state-of-the-art performance on FaceForensics++, ASVspoof 2019, and custom multi-modal benchmarks
        </p>

        {/* Waveform visualization */}
        <div className="flex justify-center mb-10">
          <WaveformVisual />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#demo"
            className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4" />
            Try Live Demo
          </a>
          <a
            href="#architecture"
            className="flex items-center gap-2 px-8 py-3.5 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-0.5"
          >
            <Shield className="w-4 h-4" />
            View Architecture
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "Audio Accuracy", value: "97.3%" },
            { label: "Video Accuracy", value: "96.8%" },
            { label: "Multi-Modal F1", value: "0.981" },
            { label: "EER", value: "1.24%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <ArrowDown className="w-5 h-5 text-slate-500 mx-auto" />
        </div>
      </div>
    </section>
  );
}
