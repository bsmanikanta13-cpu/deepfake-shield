import { useState } from "react";
import {
  Mic,
  Video,
  Brain,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AudioWaveform,
  Image,
} from "lucide-react";

function PipelineBlock({
  icon: Icon,
  title,
  subtitle,
  color,
  active,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border transition-all duration-300 text-center min-w-[140px] ${
        active
          ? `${color} border-transparent shadow-xl scale-105`
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${active ? "text-white" : "text-slate-400 group-hover:text-white"} transition-colors`} />
      <span className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>
        {title}
      </span>
      <span className={`text-xs ${active ? "text-white/70" : "text-slate-500"}`}>{subtitle}</span>
    </button>
  );
}

function Arrow() {
  return (
    <div className="flex items-center text-slate-600 px-1">
      <ArrowRight className="w-5 h-5" />
    </div>
  );
}

const architectureDetails: Record<string, { title: string; points: string[] }> = {
  audio: {
    title: "Audio Input Processing",
    points: [
      "Raw waveform input at 16kHz sampling rate",
      "Mel-spectrogram extraction with 80 filter banks",
      "Voice Activity Detection (VAD) for segment selection",
      "Data augmentation: speed perturbation, noise injection",
    ],
  },
  wavlm: {
    title: "WavLM Feature Extraction",
    points: [
      "Self-supervised pre-training on 94K hours of audio",
      "Transformer-based architecture with gated relative position bias",
      "Extracts 768-dim representations from 12th transformer layer",
      "Captures both content and speaker characteristics",
    ],
  },
  video: {
    title: "Video Input Processing",
    points: [
      "Frame extraction at 25 FPS with face detection",
      "MTCNN-based face alignment and cropping",
      "Temporal sequence construction (16-frame clips)",
      "Lip region extraction for audio-visual sync analysis",
    ],
  },
  cnn: {
    title: "CNN Visual Features",
    points: [
      "EfficientNet-B4 backbone with pre-training on ImageNet",
      "Spatial attention for facial artifact detection",
      "Temporal convolution for frame-sequence modeling",
      "Feature pyramid for multi-scale artifact capture",
    ],
  },
  fusion: {
    title: "Multi-Modal Fusion",
    points: [
      "Cross-attention mechanism between audio and visual streams",
      "Gated fusion with learnable modality weights",
      "Temporal alignment via dynamic time warping",
      "Joint embedding space projection (512-dim)",
    ],
  },
  classifier: {
    title: "Classification Head",
    points: [
      "Multi-layer perceptron with dropout regularization",
      "Binary classification: Real vs. Fake",
      "Confidence calibration via temperature scaling",
      "Ensemble of 5 models for final prediction",
    ],
  },
};

export default function Architecture() {
  const [activeBlock, setActiveBlock] = useState("wavlm");

  return (
    <section id="architecture" className="relative py-24 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Brain className="w-3 h-3" /> System Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            End-to-End Detection{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Pipeline
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A multi-modal architecture combining self-supervised audio representations
            with deep visual features for comprehensive deepfake detection.
          </p>
        </div>

        {/* Pipeline Diagram */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 mb-10 overflow-x-auto">
          {/* Audio Stream */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AudioWaveform className="w-3 h-3" /> Audio Stream
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2">
              <PipelineBlock
                icon={Mic}
                title="Audio Input"
                subtitle="Waveform / Spectrogram"
                color="bg-gradient-to-br from-cyan-600 to-cyan-800"
                active={activeBlock === "audio"}
                onClick={() => setActiveBlock("audio")}
              />
              <Arrow />
              <PipelineBlock
                icon={Layers}
                title="WavLM"
                subtitle="Self-Supervised Features"
                color="bg-gradient-to-br from-cyan-500 to-blue-700"
                active={activeBlock === "wavlm"}
                onClick={() => setActiveBlock("wavlm")}
              />
              <Arrow />
              <PipelineBlock
                icon={Brain}
                title="Audio Encoder"
                subtitle="768-dim Embedding"
                color="bg-gradient-to-br from-blue-600 to-blue-800"
                active={activeBlock === "fusion"}
                onClick={() => setActiveBlock("fusion")}
              />
            </div>
          </div>

          {/* Fusion */}
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <ChevronRight className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Cross-Attention Fusion
              </span>
              <ChevronRight className="w-4 h-4 text-violet-400" />
            </div>
          </div>

          {/* Video Stream */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Image className="w-3 h-3" /> Visual Stream
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2">
              <PipelineBlock
                icon={Video}
                title="Video Input"
                subtitle="Face Sequences"
                color="bg-gradient-to-br from-blue-600 to-blue-800"
                active={activeBlock === "video"}
                onClick={() => setActiveBlock("video")}
              />
              <Arrow />
              <PipelineBlock
                icon={Layers}
                title="CNN (EfficientNet)"
                subtitle="Spatial Features"
                color="bg-gradient-to-br from-blue-500 to-indigo-700"
                active={activeBlock === "cnn"}
                onClick={() => setActiveBlock("cnn")}
              />
              <Arrow />
              <PipelineBlock
                icon={Brain}
                title="Visual Encoder"
                subtitle="512-dim Embedding"
                color="bg-gradient-to-br from-indigo-600 to-indigo-800"
                active={activeBlock === "fusion"}
                onClick={() => setActiveBlock("fusion")}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-4">
              <Arrow />
              <PipelineBlock
                icon={CheckCircle2}
                title="Real / Fake"
                subtitle="Classification Output"
                color="bg-gradient-to-br from-emerald-500 to-emerald-700"
                active={activeBlock === "classifier"}
                onClick={() => setActiveBlock("classifier")}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Real (Genuine)
                </div>
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <XCircle className="w-3 h-3" /> Fake (Deepfake)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Card */}
        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
            {architectureDetails[activeBlock].title}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {architectureDetails[activeBlock].points.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-sm text-slate-300">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
