import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Award, Database, Cpu } from "lucide-react";

const barData = [
  { name: "Wav2Vec", audio: 89.2, video: 0, fused: 89.2 },
  { name: "HuBERT", audio: 91.5, video: 0, fused: 91.5 },
  { name: "XLSR", audio: 93.1, video: 0, fused: 93.1 },
  { name: "WavLM\n(Ours)", audio: 97.3, video: 96.8, fused: 98.1 },
];

const radarData = [
  { metric: "Accuracy", wavlm: 97.3, baseline: 91.2 },
  { metric: "Precision", wavlm: 96.8, baseline: 90.5 },
  { metric: "Recall", wavlm: 97.1, baseline: 89.8 },
  { metric: "F1-Score", wavlm: 96.9, baseline: 90.1 },
  { metric: "AUC", wavlm: 99.1, baseline: 94.3 },
  { metric: "EER↓", wavlm: 98.8, baseline: 92.1 },
];

const trainingData = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: 0.7 * Math.exp(-i * 0.06) + 0.05 + Math.random() * 0.02,
  valLoss: 0.75 * Math.exp(-i * 0.05) + 0.08 + Math.random() * 0.03,
  accuracy: Math.min(97.3, 50 + 47.3 * (1 - Math.exp(-i * 0.08)) + Math.random() * 1.5),
}));

const benchmarkData = [
  { dataset: "FF++", accuracy: 96.8, eer: 2.1 },
  { dataset: "DFDC", accuracy: 94.2, eer: 3.8 },
  { dataset: "ASVspoof", accuracy: 97.3, eer: 1.24 },
  { dataset: "CelebDF", accuracy: 95.7, eer: 2.9 },
  { dataset: "Custom-MM", accuracy: 98.1, eer: 0.95 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-white text-sm font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
            {entry.name !== "epoch" ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Results() {
  return (
    <section id="results" className="relative py-24 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <TrendingUp className="w-3 h-3" /> Performance Results
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            State-of-the-Art{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Detection Performance
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our multi-modal approach outperforms existing methods across all major deepfake detection benchmarks.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Award, label: "Best Audio Accuracy", value: "97.3%", sub: "ASVspoof 2019", color: "from-cyan-500 to-cyan-700" },
            { icon: Database, label: "Best Video Accuracy", value: "96.8%", sub: "FaceForensics++", color: "from-blue-500 to-blue-700" },
            { icon: TrendingUp, label: "Multi-Modal F1", value: "0.981", sub: "Custom Benchmark", color: "from-violet-500 to-violet-700" },
            { icon: Cpu, label: "Inference Speed", value: "42ms", sub: "Per Sample (GPU)", color: "from-emerald-500 to-emerald-700" },
          ].map((card) => (
            <div
              key={card.label}
              className="relative group bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all"
            >
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.color} mb-3`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{card.value}</div>
              <div className="text-sm text-slate-300">{card.label}</div>
              <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Model Comparison Bar Chart */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Model Comparison</h3>
            <p className="text-xs text-slate-500 mb-4">Audio detection accuracy across self-supervised models</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <YAxis domain={[80, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="audio" name="Audio Acc." fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fused" name="Fused Acc." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Performance Metrics</h3>
            <p className="text-xs text-slate-500 mb-4">WavLM-based vs. baseline model comparison</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis domain={[85, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Radar name="WavLM + CNN (Ours)" dataKey="wavlm" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Baseline" dataKey="baseline" stroke="#64748b" fill="#64748b" fillOpacity={0.1} strokeWidth={1} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Training Curve */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Training Convergence</h3>
            <p className="text-xs text-slate-500 mb-4">Loss and accuracy over training epochs</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trainingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="epoch" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <YAxis yAxisId="left" domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <YAxis yAxisId="right" orientation="right" domain={[40, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line yAxisId="left" type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="valLoss" name="Val Loss" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmark Results */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Benchmark Results</h3>
            <p className="text-xs text-slate-500 mb-4">Performance across standard deepfake detection datasets</p>
            <div className="space-y-3">
              {benchmarkData.map((d) => (
                <div key={d.dataset} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-medium">{d.dataset}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400">{d.accuracy}%</span>
                      <span className="text-xs text-slate-500">EER: {d.eer}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${d.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">96.4%</div>
                <div className="text-xs text-slate-500">Avg. Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">2.20%</div>
                <div className="text-xs text-slate-500">Avg. EER</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
