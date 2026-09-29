import { useState } from "react";
import {
  BookOpen,
  FileText,
  GitBranch,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FlaskConical,
  GraduationCap,
  Code2,
} from "lucide-react";

const contributions = [
  {
    title: "Self-Supervised Audio Representations",
    description:
      "We demonstrate that WavLM's self-supervised representations, pre-trained on 94K hours of unlabeled audio, provide superior features for deepfake audio detection compared to hand-crafted features like MFCCs or CQCCs.",
    icon: FlaskConical,
  },
  {
    title: "Multi-Modal Cross-Attention Fusion",
    description:
      "Our novel cross-attention fusion mechanism dynamically aligns audio and visual features, enabling the model to detect inconsistencies between modalities that are characteristic of deepfake content.",
    icon: Lightbulb,
  },
  {
    title: "Comprehensive Benchmarking",
    description:
      "We introduce a new multi-modal deepfake detection benchmark combining audio-only, video-only, and audio-visual deepfakes, providing a more realistic evaluation scenario.",
    icon: GraduationCap,
  },
  {
    title: "Open-Source Implementation",
    description:
      "We release our complete training pipeline, pre-trained models, and evaluation scripts to facilitate reproducibility and future research in multi-modal deepfake detection.",
    icon: Code2,
  },
];

const faqs = [
  {
    q: "Why WavLM over other self-supervised models?",
    a: "WavLM uses gated relative position bias and denoising objectives during pre-training, making it particularly robust to the acoustic artifacts introduced by speech synthesis and voice conversion systems. Our experiments show 4-6% improvement over Wav2Vec 2.0 and HuBERT on ASVspoof 2019.",
  },
  {
    q: "How does the multi-modal fusion improve detection?",
    a: "Single-modality detectors can be fooled by high-quality deepfakes in that modality. Our cross-attention fusion detects inconsistencies between audio and visual streams — for example, lip movements that don't match the audio, or temporal misalignments — providing an additional signal that's extremely difficult for attackers to circumvent.",
  },
  {
    q: "What types of deepfakes can the system detect?",
    a: "Our system detects: (1) Voice conversion and TTS-based audio deepfakes, (2) Face swap and face reenactment video deepfakes, (3) Lip-sync deepfakes, and (4) Joint audio-visual deepfakes. The multi-modal approach is particularly effective against lip-sync attacks that fool single-modality detectors.",
  },
  {
    q: "What are the computational requirements?",
    a: "The full model requires ~2.8GB GPU memory for inference. WavLM-Large (316M params) processes audio in ~15ms per second, and EfficientNet-B4 processes video frames at ~27ms per frame on an A100 GPU. Total inference latency is ~42ms per sample.",
  },
  {
    q: "How does the system handle real-world noisy data?",
    a: "We employ several strategies: (1) WavLM's denoising pre-training provides inherent noise robustness, (2) We use SpecAugment and noise injection during training, (3) The multi-modal fusion includes a noise-gating mechanism that down-weights unreliable modalities, and (4) We fine-tune on augmented versions of each benchmark.",
  },
];

const papers = [
  {
    title: "WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Audio Understanding",
    authors: "Chen et al.",
    venue: "IEEE JSTSP, 2022",
    link: "#",
  },
  {
    title: "ASVspoof 2019: A Large-scale Public Challenge for Spoofing and Deepfake Detection",
    authors: "Wang et al.",
    venue: "Interspeech, 2019",
    link: "#",
  },
  {
    title: "FaceForensics++: Learning to Detect Manipulated Facial Images",
    authors: "Rössler et al.",
    venue: "ICCV, 2019",
    link: "#",
  },
  {
    title: "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks",
    authors: "Tan & Le",
    venue: "ICML, 2019",
    link: "#",
  },
];

export default function TechnicalDetails() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="research" className="relative py-24 bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3 h-3" /> Research Details
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Technical{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Deep Dive
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Explore the key contributions, methodology, and research behind our multi-modal deepfake detection system.
          </p>
        </div>

        {/* Key Contributions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {contributions.map((c) => (
            <div
              key={c.title}
              className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 shrink-0">
                  <c.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{c.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Architecture Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 mb-16 overflow-x-auto">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-violet-400 rounded-full" />
            Model Configuration
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Component</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Architecture</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Parameters</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Input</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Output</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Audio Encoder", "WavLM-Large", "316M", "16kHz waveform", "768-dim"],
                ["Audio Projection", "2-layer MLP", "590K", "768-dim", "512-dim"],
                ["Visual Encoder", "EfficientNet-B4", "19M", "224×224 RGB", "1792-dim"],
                ["Temporal Conv", "1D-CNN (3 layers)", "2.1M", "16×1792", "512-dim"],
                ["Cross-Attention", "4-head attention", "4.2M", "512+512", "512-dim"],
                ["Classifier", "3-layer MLP + Dropout", "786K", "512-dim", "2 (Real/Fake)"],
              ].map(([comp, arch, params, input, output], i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{comp}</td>
                  <td className="py-3 px-4 text-cyan-400">{arch}</td>
                  <td className="py-3 px-4 text-slate-300">{params}</td>
                  <td className="py-3 px-4 text-slate-400">{input}</td>
                  <td className="py-3 px-4 text-slate-400">{output}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td className="py-3 px-4 text-white font-bold">Total</td>
                <td className="py-3 px-4 text-white font-bold" colSpan={2}>~342M parameters</td>
                <td className="py-3 px-4" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-medium text-sm pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* References */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
            Key References
          </h3>
          <div className="space-y-3">
            {papers.map((paper, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/10 shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{paper.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paper.authors} • {paper.venue}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/5">
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-all"
            >
              <GitBranch className="w-4 h-4" />
              GitHub Repository
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-all"
            >
              <FileText className="w-4 h-4" />
              Full Paper (PDF)
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-all"
            >
              <Code2 className="w-4 h-4" />
              Model Weights
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
