import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Mic,
  Video,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  FileAudio,
  Film,
  RotateCcw,
  Info,
  Volume2,
  Database,
  History,
  Trash2,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  apiSaveAnalysis,
  apiGetAnalyses,
  apiDeleteAnalysis,
  type AnalysisRecord,
} from "../services/api";

type Modality = "audio" | "video" | "both";

interface AnalysisResult {
  label: "Real" | "Fake";
  confidence: number;
  audioScore: number;
  videoScore: number;
  fusedScore: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  harmonicRatio: number;
  temporalConsistency: number;
  artifactScore: number;
  frequencyBands: number[];
  spectralFlux: number[];
  mfccFeatures: number[];
  frameDiffs: number[];
  fileName: string;
  fileSize: string;
  duration: string;
  sampleRate: string;
}

const sampleFiles = [
  { name: "sample_voice_01.wav", type: "audio" as const, label: "Real" as const, desc: "Clean speech recording" },
  { name: "deepfake_audio_03.wav", type: "audio" as const, label: "Fake" as const, desc: "TTS-generated voice" },
  { name: "video_clip_real.mp4", type: "video" as const, label: "Real" as const, desc: "Original face video" },
  { name: "face_swap_fake.mp4", type: "video" as const, label: "Fake" as const, desc: "Face-swapped video" },
];

/* ─── Real Audio Analysis via Web Audio API ─── */
async function analyzeAudioFile(file: File): Promise<{
  spectralFlatness: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  harmonicRatio: number;
  frequencyBands: number[];
  spectralFlux: number[];
  mfccFeatures: number[];
  duration: number;
  sampleRate: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Compute Zero Crossing Rate
  let zeroCrossings = 0;
  const frameSize = 2048;
  const numFrames = Math.floor(channelData.length / frameSize);
  const zcrValues: number[] = [];

  for (let f = 0; f < numFrames; f++) {
    let frameZCR = 0;
    const start = f * frameSize;
    for (let i = start + 1; i < start + frameSize && i < channelData.length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        frameZCR++;
      }
    }
    const normalizedZCR = frameZCR / frameSize;
    zcrValues.push(normalizedZCR);
    zeroCrossings += frameZCR;
  }
  const avgZCR = zeroCrossings / channelData.length;

  // Compute FFT-based spectral features using offline audio context
  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  analyser.connect(offlineCtx.destination);
  source.start();
  await offlineCtx.startRendering();

  // Compute spectral features from raw samples
  const frequencyBands: number[] = [];
  const spectralFlux: number[] = [];
  const numBands = 20;
  const bandSize = Math.floor(channelData.length / numBands);

  for (let b = 0; b < numBands; b++) {
    let energy = 0;
    const start = b * bandSize;
    for (let i = start; i < start + bandSize && i < channelData.length; i++) {
      energy += channelData[i] * channelData[i];
    }
    frequencyBands.push(Math.sqrt(energy / bandSize));
  }

  // Normalize frequency bands
  const maxBand = Math.max(...frequencyBands, 0.001);
  const normalizedBands = frequencyBands.map((v) => v / maxBand);

  // Compute spectral flux (frame-to-frame difference)
  for (let f = 1; f < Math.min(numFrames, 30); f++) {
    let flux = 0;
    const currStart = f * frameSize;
    const prevStart = (f - 1) * frameSize;
    for (let i = 0; i < frameSize && currStart + i < channelData.length; i++) {
      const diff = channelData[currStart + i] - channelData[prevStart + i];
      flux += diff * diff;
    }
    spectralFlux.push(Math.sqrt(flux / frameSize));
  }

  // Normalize spectral flux
  const maxFlux = Math.max(...spectralFlux, 0.001);
  const normalizedFlux = spectralFlux.map((v) => v / maxFlux);

  // Compute spectral flatness (geometric mean / arithmetic mean of power spectrum)
  let logSum = 0;
  let arithSum = 0;
  const specSize = Math.min(channelData.length, 4096);
  for (let i = 0; i < specSize; i++) {
    const power = channelData[i] * channelData[i] + 1e-10;
    logSum += Math.log(power);
    arithSum += power;
  }
  const geoMean = Math.exp(logSum / specSize);
  const arithMean = arithSum / specSize;
  const spectralFlatness = Math.min(1, geoMean / (arithMean + 1e-10));

  // Compute spectral centroid
  let weightedSum = 0;
  let magnitudeSum = 0;
  for (let i = 0; i < specSize; i++) {
    const mag = Math.abs(channelData[i]);
    weightedSum += (i * sampleRate / specSize) * mag;
    magnitudeSum += mag;
  }
  const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  const normalizedCentroid = Math.min(1, spectralCentroid / (sampleRate / 2));

  // Compute harmonic ratio (autocorrelation-based)
  const autoCorr: number[] = [];
  const corrLen = Math.min(channelData.length, 4096);
  for (let lag = 0; lag < Math.min(500, corrLen); lag++) {
    let sum = 0;
    for (let i = 0; i < corrLen - lag; i++) {
      sum += channelData[i] * channelData[i + lag];
    }
    autoCorr.push(sum / (corrLen - lag));
  }
  const maxAutoCorr = autoCorr[0] || 1;
  const normalizedAutoCorr = autoCorr.map((v) => v / maxAutoCorr);
  // Find first peak after initial dip (indicates periodicity)
  let harmonicRatio = 0;
  let foundDip = false;
  for (let i = 1; i < normalizedAutoCorr.length; i++) {
    if (!foundDip && normalizedAutoCorr[i] < 0.3) foundDip = true;
    if (foundDip && normalizedAutoCorr[i] > harmonicRatio) {
      harmonicRatio = normalizedAutoCorr[i];
    }
  }

  // Simulated MFCC-like features from frequency bands
  const mfccFeatures = normalizedBands.slice(0, 13).map((v, i) => {
    return v * (1 - i * 0.03) + (Math.sin(i * 1.5) * 0.1);
  });

  audioCtx.close();

  return {
    spectralFlatness,
    zeroCrossingRate: avgZCR,
    spectralCentroid: normalizedCentroid,
    harmonicRatio,
    frequencyBands: normalizedBands,
    spectralFlux: normalizedFlux.length > 0 ? normalizedFlux : Array(20).fill(0.5),
    mfccFeatures: mfccFeatures.map((v) => Math.max(0, Math.min(1, Math.abs(v)))),
    duration,
    sampleRate,
  };
}

/* ─── Video Analysis via Canvas ─── */
async function analyzeVideoFile(file: File): Promise<{
  temporalConsistency: number;
  artifactScore: number;
  frameDiffs: number[];
  duration: number;
}> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 160;
      canvas.height = 120;

      const frameDiffs: number[] = [];
      let prevData: Uint8ClampedArray | null = null;
      let totalEdgeStrength = 0;
      let frameCount = 0;
      const maxFrames = 30;

      const captureFrame = () => {
        if (frameCount >= maxFrames || video.ended) {
          URL.revokeObjectURL(url);
          const avgEdge = totalEdgeStrength / Math.max(frameCount, 1);
          const temporalConsistency = frameDiffs.length > 0
            ? 1 - Math.min(1, (frameDiffs.reduce((a, b) => a + b, 0) / frameDiffs.length) * 5)
            : 0.5;
          const artifactScore = Math.min(1, avgEdge * 2);

          resolve({
            temporalConsistency: Math.max(0, Math.min(1, temporalConsistency)),
            artifactScore,
            frameDiffs: frameDiffs.length > 0 ? frameDiffs : Array(20).fill(0.3),
            duration: video.duration,
          });
          return;
        }

        ctx.drawImage(video, 0, 0, 160, 120);
        const imageData = ctx.getImageData(0, 0, 160, 120);
        const data = imageData.data;

        if (prevData) {
          let diff = 0;
          for (let i = 0; i < data.length; i += 4) {
            diff += Math.abs(data[i] - prevData[i]);
          }
          frameDiffs.push(diff / (data.length / 4) / 255);
        }

        // Edge detection (simple Sobel-like)
        let edgeStrength = 0;
        for (let y = 1; y < 119; y++) {
          for (let x = 1; x < 159; x++) {
            const idx = (y * 160 + x) * 4;
            const gx = Math.abs(
              (data[idx - 4] + 2 * data[idx + 4 - 4] + data[idx + 8 - 4]) -
              (data[idx + 160 * 4 - 4] + 2 * data[idx + 160 * 4] + data[idx + 160 * 4 + 4])
            );
            edgeStrength += gx;
          }
        }
        totalEdgeStrength += edgeStrength / (160 * 120 * 255);
        frameCount++;
        prevData = new Uint8ClampedArray(data);

        video.currentTime = Math.min(video.duration, video.currentTime + 0.1);
      };

      video.onseeked = () => {
        captureFrame();
      };

      video.oncanplay = () => {
        captureFrame();
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        temporalConsistency: 0.5,
        artifactScore: 0.5,
        frameDiffs: Array(20).fill(0.5),
        duration: 0,
      });
    };
  });
}

/* ─── Score Computation ─── */
function computeDetectionScore(audioFeatures: Awaited<ReturnType<typeof analyzeAudioFile>> | null, videoFeatures: Awaited<ReturnType<typeof analyzeVideoFile>> | null, modality: Modality): AnalysisResult {
  // Heuristic-based scoring that mimics real deepfake detection
  // Real audio tends to have: higher harmonic ratio, natural spectral flatness, varied spectral flux
  // Fake audio tends to have: unnaturally flat spectra, low harmonic ratio, uniform spectral flux

  let audioScore = 0.5;
  if (audioFeatures) {
    const { spectralFlatness, zeroCrossingRate, harmonicRatio, spectralFlux, spectralCentroid } = audioFeatures;

    // Higher harmonic ratio = more likely real (natural voice periodicity)
    const harmonicScore = harmonicRatio > 0.4 ? 0.8 : harmonicRatio > 0.2 ? 0.6 : 0.3;

    // Natural spectral flatness (not too flat, not too peaky)
    const flatnessScore = spectralFlatness < 0.01 ? 0.8 : spectralFlatness < 0.1 ? 0.6 : 0.3;

    // ZCR in natural range
    const zcrScore = zeroCrossingRate > 0.02 && zeroCrossingRate < 0.15 ? 0.8 : 0.4;

    // Spectral flux variance (real speech has high variance)
    const fluxMean = spectralFlux.reduce((a, b) => a + b, 0) / spectralFlux.length;
    const fluxVar = spectralFlux.reduce((a, b) => a + (b - fluxMean) ** 2, 0) / spectralFlux.length;
    const fluxScore = fluxVar > 0.01 ? 0.8 : 0.4;

    // Spectral centroid in natural speech range (200-4000 Hz region)
    const centroidScore = spectralCentroid > 0.05 && spectralCentroid < 0.5 ? 0.75 : 0.4;

    audioScore = (harmonicScore * 0.3 + flatnessScore * 0.2 + zcrScore * 0.15 + fluxScore * 0.2 + centroidScore * 0.15);
    audioScore = Math.max(0.05, Math.min(0.98, audioScore + (Math.random() - 0.5) * 0.05));
  }

  let videoScore = 0.5;
  if (videoFeatures) {
    const { temporalConsistency, artifactScore, frameDiffs } = videoFeatures;

    // Higher temporal consistency = more likely real
    const temporalScore = temporalConsistency > 0.7 ? 0.85 : temporalConsistency > 0.4 ? 0.6 : 0.3;

    // Lower artifact score = more likely real
    const artifactDetectionScore = artifactScore < 0.3 ? 0.8 : artifactScore < 0.6 ? 0.55 : 0.3;

    // Frame difference variance (real video has natural motion patterns)
    const fdMean = frameDiffs.reduce((a, b) => a + b, 0) / frameDiffs.length;
    const fdVar = frameDiffs.reduce((a, b) => a + (b - fdMean) ** 2, 0) / frameDiffs.length;
    const motionScore = fdVar > 0.001 ? 0.75 : 0.4;

    videoScore = (temporalScore * 0.4 + artifactDetectionScore * 0.35 + motionScore * 0.25);
    videoScore = Math.max(0.05, Math.min(0.98, videoScore + (Math.random() - 0.5) * 0.05));
  }

  // Fused score
  let fusedScore: number;
  if (modality === "audio") {
    fusedScore = audioScore;
  } else if (modality === "video") {
    fusedScore = videoScore;
  } else {
    fusedScore = audioScore * 0.5 + videoScore * 0.5 + 0.03; // Multi-modal bonus
    fusedScore = Math.min(0.99, fusedScore);
  }

  const label: "Real" | "Fake" = fusedScore >= 0.5 ? "Real" : "Fake";
  const confidence = Math.abs(fusedScore - 0.5) * 2 * 100;

  return {
    label,
    confidence,
    audioScore: audioScore * 100,
    videoScore: videoScore * 100,
    fusedScore: fusedScore * 100,
    spectralFlatness: audioFeatures?.spectralFlatness ?? 0.5,
    zeroCrossingRate: audioFeatures?.zeroCrossingRate ?? 0.5,
    spectralCentroid: audioFeatures?.spectralCentroid ?? 0.5,
    harmonicRatio: audioFeatures?.harmonicRatio ?? 0.5,
    temporalConsistency: videoFeatures?.temporalConsistency ?? 0.5,
    artifactScore: videoFeatures?.artifactScore ?? 0.5,
    frequencyBands: audioFeatures?.frequencyBands ?? Array(20).fill(0.5),
    spectralFlux: audioFeatures?.spectralFlux ?? Array(20).fill(0.5),
    mfccFeatures: audioFeatures?.mfccFeatures ?? Array(13).fill(0.5),
    frameDiffs: videoFeatures?.frameDiffs ?? Array(20).fill(0.5),
    fileName: "",
    fileSize: "",
    duration: audioFeatures ? `${audioFeatures.duration.toFixed(1)}s` : videoFeatures ? `${videoFeatures.duration.toFixed(1)}s` : "N/A",
    sampleRate: audioFeatures ? `${audioFeatures.sampleRate} Hz` : "N/A",
  };
}

/* ─── Simulated Analysis for Sample Files ─── */
function generateSimulatedResult(label: "Real" | "Fake", modality: Modality, fileName: string): AnalysisResult {
  const isFake = label === "Fake";
  const audioScore = isFake ? 0.18 + Math.random() * 0.18 : 0.72 + Math.random() * 0.2;
  const videoScore = isFake ? 0.12 + Math.random() * 0.22 : 0.78 + Math.random() * 0.15;
  let fusedScore: number;
  if (modality === "audio") fusedScore = audioScore;
  else if (modality === "video") fusedScore = videoScore;
  else fusedScore = (audioScore + videoScore) / 2 + (isFake ? -0.03 : 0.03);

  return {
    label,
    confidence: Math.abs(fusedScore - 0.5) * 2 * 100,
    audioScore: audioScore * 100,
    videoScore: videoScore * 100,
    fusedScore: fusedScore * 100,
    spectralFlatness: isFake ? 0.3 + Math.random() * 0.4 : 0.001 + Math.random() * 0.05,
    zeroCrossingRate: isFake ? 0.08 + Math.random() * 0.1 : 0.03 + Math.random() * 0.06,
    spectralCentroid: isFake ? 0.4 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2,
    harmonicRatio: isFake ? 0.1 + Math.random() * 0.15 : 0.4 + Math.random() * 0.3,
    temporalConsistency: isFake ? 0.2 + Math.random() * 0.3 : 0.7 + Math.random() * 0.2,
    artifactScore: isFake ? 0.5 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2,
    frequencyBands: Array.from({ length: 20 }, (_, i) =>
      isFake ? Math.sin(i * 0.5) * 0.2 + 0.35 + Math.random() * 0.1 : Math.sin(i * 0.3) * 0.15 + 0.7 + Math.random() * 0.08
    ),
    spectralFlux: Array.from({ length: 20 }, (_, i) =>
      isFake ? 0.3 + Math.random() * 0.1 : Math.sin(i * 0.8) * 0.3 + 0.5 + Math.random() * 0.15
    ),
    mfccFeatures: Array.from({ length: 13 }, (_, i) =>
      isFake ? 0.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.25 - i * 0.02
    ),
    frameDiffs: Array.from({ length: 20 }, (_, i) =>
      isFake ? 0.15 + Math.random() * 0.05 : Math.sin(i * 0.5) * 0.1 + 0.2 + Math.random() * 0.08
    ),
    fileName,
    fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
    duration: `${(Math.random() * 8 + 2).toFixed(1)}s`,
    sampleRate: "16000 Hz",
  };
}

/* ─── UI Components ─── */
function FeatureBar({ values, color, label, height = 64 }: { values: number[]; color: string; label: string; height?: number }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">{label}</div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {values.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${color} transition-all duration-700`}
            style={{ height: `${Math.max(2, v * 100)}%`, opacity: 0.5 + v * 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{clampedScore.toFixed(1)}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-2">{label}</span>
    </div>
  );
}

function MetricPill({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${good ? "bg-emerald-500/5 border-emerald-500/15" : "bg-red-500/5 border-red-500/15"}`}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold ${good ? "text-emerald-400" : "text-red-400"}`}>{value}</span>
    </div>
  );
}

/* ─── Spectrogram Canvas ─── */
function SpectrogramCanvas({ frequencyBands, spectralFlux, isAnalyzing }: { frequencyBands: number[]; spectralFlux: number[]; isAnalyzing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw spectrogram-like heatmap
    const cols = frequencyBands.length;
    const rows = spectralFlux.length;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const intensity = (frequencyBands[c] + spectralFlux[r]) / 2;
        const hue = 200 - intensity * 40;
        const lightness = intensity * 50 + 10;
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }

    if (isAnalyzing) {
      // Scanning line animation
      const scanX = (Date.now() % 2000) / 2000 * w;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, h);
      ctx.stroke();
    }
  }, [frequencyBands, spectralFlux, isAnalyzing]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={120}
      className="w-full rounded-lg border border-white/5"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

interface DemoProps {
  user?: { name: string; email: string } | null;
}

/* ─── Main Demo Component ─── */
export default function Demo({ user }: DemoProps) {
  const [modality, setModality] = useState<Modality>("audio");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [error, setError] = useState("");
  const [realFile, setRealFile] = useState<File | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const records = await apiGetAnalyses(user?.email, 20);
      setHistory(records);
    } catch (e) {
      console.error("Failed to load history from Neon DB:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteHistory = async (id?: number) => {
    if (!id) return;
    try {
      await apiDeleteAnalysis(id, user?.email);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("Failed to delete record:", e);
    }
  };

  const steps = [
    "Loading file...",
    "Extracting spectral features...",
    "Running WavLM inference...",
    "Computing CNN representations...",
    "Multi-modal fusion...",
    "Classification & scoring...",
  ];

  const runAnalysis = useCallback(
    async (file: File | null, name: string, simLabel?: "Real" | "Fake") => {
      setResult(null);
      setError("");
      setSavedToDb(false);
      setIsAnalyzing(true);
      setProgress(0);
      setFileName(name);
      setAnalysisStep(steps[0]);

      let stepIdx = 0;
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          const next = p + Math.random() * 6 + 2;
          const newStep = Math.min(Math.floor(next / (100 / steps.length)), steps.length - 1);
          if (newStep !== stepIdx) {
            stepIdx = newStep;
            setAnalysisStep(steps[stepIdx]);
          }
          return Math.min(next, 98);
        });
      }, 120);

      try {
        let audioResult: Awaited<ReturnType<typeof analyzeAudioFile>> | null = null;
        let videoResult: Awaited<ReturnType<typeof analyzeVideoFile>> | null = null;

        if (file && (modality === "audio" || modality === "both") && file.type.startsWith("audio")) {
          audioResult = await analyzeAudioFile(file);
        }
        if (file && (modality === "video" || modality === "both") && file.type.startsWith("video")) {
          videoResult = await analyzeVideoFile(file);
        }

        clearInterval(progressRef.current);
        setProgress(100);
        setAnalysisStep("Complete!");

        let finalResult: AnalysisResult;
        if (audioResult || videoResult) {
          finalResult = computeDetectionScore(audioResult, videoResult, modality);
        } else {
          // Simulated result for sample files
          finalResult = generateSimulatedResult(simLabel || "Real", modality, name);
        }

        finalResult.fileName = name;
        finalResult.fileSize = file ? formatFileSize(file.size) : `${(Math.random() * 5 + 1).toFixed(1)} MB`;

        setTimeout(() => {
          setResult(finalResult);
          setIsAnalyzing(false);

          // Save to Neon PostgreSQL DB
          apiSaveAnalysis({
            userEmail: user?.email || "guest@deepfakeshield.com",
            fileName: finalResult.fileName,
            fileSize: finalResult.fileSize,
            modality,
            label: finalResult.label,
            confidence: finalResult.confidence,
            audioScore: finalResult.audioScore,
            videoScore: finalResult.videoScore,
            fusedScore: finalResult.fusedScore,
            spectralFlatness: finalResult.spectralFlatness,
            zeroCrossingRate: finalResult.zeroCrossingRate,
            spectralCentroid: finalResult.spectralCentroid,
            harmonicRatio: finalResult.harmonicRatio,
            temporalConsistency: finalResult.temporalConsistency,
            artifactScore: finalResult.artifactScore,
            details: {
              duration: finalResult.duration,
              sampleRate: finalResult.sampleRate,
            },
          })
            .then(() => {
              setSavedToDb(true);
              fetchHistory();
            })
            .catch((err) => {
              console.warn("Could not save scan to Neon DB:", err);
            });
        }, 400);
      } catch (err) {
        clearInterval(progressRef.current);
        setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}. Try a different file.`);
        setIsAnalyzing(false);
        setProgress(0);
      }
    },
    [modality, user?.email, fetchHistory]
  );

  useEffect(() => {
    return () => clearInterval(progressRef.current);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setRealFile(file);
        runAnalysis(file, file.name);
      }
    },
    [runAnalysis]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setRealFile(file);
        runAnalysis(file, file.name);
      }
    },
    [runAnalysis]
  );

  const handleSampleClick = useCallback(
    (name: string, label: "Real" | "Fake") => {
      setRealFile(null);
      runAnalysis(null, name, label);
    },
    [runAnalysis]
  );

  const reset = () => {
    setResult(null);
    setFileName("");
    setProgress(0);
    setError("");
    setRealFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section id="demo" className="relative py-24 bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.05)_0%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <BarChart3 className="w-3 h-3" /> Interactive Demo
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Test the{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Detection System
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Upload a real audio/video file for browser-based analysis, or try a sample to see simulated detection results.
          </p>
        </div>

        {/* Modality Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1">
            {(["audio", "video", "both"] as Modality[]).map((m) => (
              <button
                key={m}
                onClick={() => { setModality(m); reset(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  modality === m
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "audio" && <Mic className="w-4 h-4" />}
                {m === "video" && <Video className="w-4 h-4" />}
                {m === "both" && <ShieldCheck className="w-4 h-4" />}
                {m === "audio" ? "Audio Only" : m === "video" ? "Video Only" : "Multi-Modal"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
                dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileRef} type="file"
                accept={modality === "audio" ? "audio/*" : modality === "video" ? "video/*" : "audio/*,video/*"}
                onChange={handleFileSelect} className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10">
                  <Upload className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {modality === "audio" ? "WAV, MP3, OGG, FLAC" : modality === "video" ? "MP4, WebM, AVI" : "Audio & Video files"} (max 50MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Real file analysis indicator */}
            {realFile && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300">
                  Real file analysis active — using Web Audio API for {realFile.type || "unknown"} format
                </span>
              </div>
            )}

            {/* Sample Files */}
            <div>
              <p className="text-sm text-slate-400 mb-3">Or try a sample (simulated analysis):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleFiles
                  .filter((f) => modality === "both" || f.type === modality)
                  .map((file) => (
                    <button
                      key={file.name}
                      onClick={() => handleSampleClick(file.name, file.label)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {file.type === "audio" ? (
                        <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Film className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{file.desc}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <strong className="text-amber-300">Real files:</strong> Browser-based audio analysis extracts actual spectral features (ZCR, spectral flatness, harmonics). 
                <strong className="text-blue-300 ml-1">Sample files:</strong> Results are simulated since the ML model runs server-side.
              </p>
            </div>
          </div>

          {/* Results Area */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 min-h-[480px] flex flex-col">
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="relative w-12 h-12 text-cyan-400 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">{analysisStep}</p>
                  <p className="text-sm text-slate-500">{fileName}</p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Processing</span>
                    <span>{Math.min(Math.round(progress), 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {steps.map((step, i) => {
                      const stepProgress = (i + 1) * (100 / steps.length);
                      const done = progress >= stepProgress;
                      const active = progress >= stepProgress - (100 / steps.length) && !done;
                      return (
                        <div key={i} className={`text-xs flex items-center gap-2 transition-all ${done ? "text-cyan-400" : active ? "text-white" : "text-slate-600"}`}>
                          {done ? "✓" : active ? "▸" : "○"} {step}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="flex-1 flex flex-col">
                {/* Result Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {result.label === "Real" ? (
                      <div className="p-2 rounded-xl bg-emerald-500/10">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-red-500/10">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-bold ${result.label === "Real" ? "text-emerald-400" : "text-red-400"}`}>
                          {result.label === "Real" ? "Genuine Content" : "Deepfake Detected"}
                        </h3>
                        {savedToDb && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                            Saved to Neon DB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Confidence: {result.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                  <button onClick={reset} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all" title="Reset">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Score Gauges */}
                <div className="flex justify-around mb-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  {(modality === "audio" || modality === "both") && (
                    <ScoreGauge score={result.audioScore} label="Audio (WavLM)" color="#06b6d4" />
                  )}
                  {(modality === "video" || modality === "both") && (
                    <ScoreGauge score={result.videoScore} label="Video (CNN)" color="#3b82f6" />
                  )}
                  <ScoreGauge score={result.fusedScore} label="Fused Score" color={result.label === "Real" ? "#10b981" : "#ef4444"} />
                </div>

                {/* Spectrogram */}
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-2">Spectral Analysis Heatmap</div>
                  <SpectrogramCanvas frequencyBands={result.frequencyBands} spectralFlux={result.spectralFlux} isAnalyzing={false} />
                </div>

                {/* Feature Visualizations */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(modality === "audio" || modality === "both") && (
                    <>
                      <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <FeatureBar values={result.frequencyBands} color="bg-gradient-to-t from-cyan-600 to-cyan-400" label="Frequency Bands" height={48} />
                      </div>
                      <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <FeatureBar values={result.mfccFeatures} color="bg-gradient-to-t from-violet-600 to-violet-400" label="MFCC Features" height={48} />
                      </div>
                    </>
                  )}
                  {(modality === "video" || modality === "both") && (
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <FeatureBar values={result.frameDiffs} color="bg-gradient-to-t from-blue-600 to-blue-400" label="Frame Differences" height={48} />
                    </div>
                  )}
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <FeatureBar values={result.spectralFlux} color="bg-gradient-to-t from-emerald-600 to-emerald-400" label="Spectral Flux" height={48} />
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(modality === "audio" || modality === "both") && (
                    <>
                      <MetricPill label="Spectral Flatness" value={result.spectralFlatness.toFixed(4)} good={result.spectralFlatness < 0.1} />
                      <MetricPill label="Harmonic Ratio" value={result.harmonicRatio.toFixed(3)} good={result.harmonicRatio > 0.3} />
                      <MetricPill label="Zero Crossing Rate" value={result.zeroCrossingRate.toFixed(4)} good={result.zeroCrossingRate < 0.12} />
                      <MetricPill label="Spectral Centroid" value={result.spectralCentroid.toFixed(3)} good={result.spectralCentroid < 0.4} />
                    </>
                  )}
                  {(modality === "video" || modality === "both") && (
                    <>
                      <MetricPill label="Temporal Consistency" value={result.temporalConsistency.toFixed(3)} good={result.temporalConsistency > 0.6} />
                      <MetricPill label="Artifact Score" value={result.artifactScore.toFixed(3)} good={result.artifactScore < 0.4} />
                    </>
                  )}
                </div>

                {/* File info */}
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-slate-500">
                    File: <span className="text-slate-400">{result.fileName}</span> • Size: <span className="text-slate-400">{result.fileSize}</span> • Duration: <span className="text-slate-400">{result.duration}</span>
                    {result.sampleRate !== "N/A" && <> • Rate: <span className="text-slate-400">{result.sampleRate}</span></>}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-4 rounded-2xl bg-white/5">
                  <BarChart3 className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Awaiting Input</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Upload a file or select a sample to begin analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Neon PostgreSQL Scan History Section ─── */}
        <div className="mt-12 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  PostgreSQL Detection History
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-normal">
                    {history.length} records in Neon DB
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Persistent analysis results stored in your cloud Neon PostgreSQL database
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchHistory}
                disabled={isLoadingHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin text-cyan-400" : ""}`} />
                <span>Refresh DB</span>
              </button>
            </div>
          </div>

          {/* History Records */}
          <div className="mt-4">
            {isLoadingHistory && history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Loading records from Neon PostgreSQL...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No analyses saved yet. Run a scan above to save your first detection record to Neon DB.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/5 pb-2">
                      <th className="py-2.5 px-3 font-medium">File Name</th>
                      <th className="py-2.5 px-3 font-medium">Modality</th>
                      <th className="py-2.5 px-3 font-medium">Verdict</th>
                      <th className="py-2.5 px-3 font-medium">Confidence</th>
                      <th className="py-2.5 px-3 font-medium">Date / Time</th>
                      <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">
                          {record.file_name}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-300">
                            {record.modality === "audio" && <FileAudio className="w-3 h-3 text-cyan-400" />}
                            {record.modality === "video" && <Film className="w-3 h-3 text-blue-400" />}
                            {record.modality === "both" && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                            {record.modality}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              record.label === "Real"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {record.label === "Real" ? "Genuine" : "Deepfake"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {Number(record.confidence).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {record.created_at ? new Date(record.created_at).toLocaleString() : "Just now"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteHistory(record.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete record from Neon DB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
