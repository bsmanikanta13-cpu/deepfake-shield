export interface UserProfile {
  id?: number;
  name: string;
  email: string;
}

export interface AnalysisRecord {
  id?: number;
  user_email?: string;
  file_name: string;
  file_size?: string;
  modality: "audio" | "video" | "both";
  label: "Real" | "Fake";
  confidence: number;
  audio_score?: number;
  video_score?: number;
  fused_score?: number;
  spectral_flatness?: number;
  zero_crossing_rate?: number;
  spectral_centroid?: number;
  harmonic_ratio?: number;
  temporal_consistency?: number;
  artifact_score?: number;
  details?: Record<string, any>;
  created_at?: string;
}

export interface DbStats {
  totalScans: number;
  realCount: number;
  fakeCount: number;
  accuracyEstimated: number;
  modalityBreakdown: {
    audio: number;
    video: number;
    both: number;
  };
}

const API_BASE = "/api";

export async function checkDbHealth(): Promise<{
  status: string;
  database: string;
  connected: boolean;
  timestamp?: string;
  version?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: "offline",
      database: "Neon PostgreSQL",
      connected: false,
      error: err.message || "Failed to reach backend",
    };
  }
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<{ user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Authentication failed");
  }
  return data;
}

export async function apiSaveAnalysis(record: {
  userEmail?: string;
  fileName: string;
  fileSize?: string;
  modality: string;
  label: string;
  confidence: number;
  audioScore?: number;
  videoScore?: number;
  fusedScore?: number;
  spectralFlatness?: number;
  zeroCrossingRate?: number;
  spectralCentroid?: number;
  harmonicRatio?: number;
  temporalConsistency?: number;
  artifactScore?: number;
  details?: Record<string, any>;
}): Promise<{ analysis: AnalysisRecord }> {
  const res = await fetch(`${API_BASE}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to save analysis to database");
  }
  return data;
}

export async function apiGetAnalyses(
  userEmail?: string,
  limit = 20
): Promise<AnalysisRecord[]> {
  const params = new URLSearchParams();
  if (userEmail) params.append("userEmail", userEmail);
  params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/analyses?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch analyses");
  }
  const data = await res.json();
  return data.analyses || [];
}

export async function apiDeleteAnalysis(
  id: number,
  userEmail?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (userEmail) params.append("userEmail", userEmail);

  const res = await fetch(`${API_BASE}/analyses/${id}?${params.toString()}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete analysis record");
  }
}

export async function apiGetStats(): Promise<DbStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) {
    throw new Error("Failed to fetch DB stats");
  }
  return await res.json();
}
