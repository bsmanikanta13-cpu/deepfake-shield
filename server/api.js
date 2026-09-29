import express from "express";
import {
  initDb,
  createUser,
  getUserByEmail,
  saveAnalysis,
  getAnalysesByUser,
  deleteAnalysis,
  getStats,
  sql,
} from "./db.js";

const router = express.Router();

// Ensure DB is initialized
initDb().catch((err) => {
  console.error("Warning: Initial DB schema check encountered:", err.message);
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const result = await sql`SELECT NOW() as now, version() as version;`;
    res.json({
      status: "online",
      database: "Neon PostgreSQL",
      connected: true,
      timestamp: result[0]?.now || new Date().toISOString(),
      version: result[0]?.version,
    });
  } catch (error) {
    res.status(500).json({
      status: "degraded",
      database: "Neon PostgreSQL",
      connected: false,
      error: error.message,
    });
  }
});

// Auth - Register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = await createUser(name, email, password);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user: " + error.message });
  }
});

// Auth - Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check demo account fallback
    if (email === "demo@deepfakeshield.com" && password === "demo1234") {
      return res.json({
        message: "Login successful",
        user: { name: "Demo User", email: "demo@deepfakeshield.com" },
      });
    }

    const user = await getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to authenticate: " + error.message });
  }
});

// Analyses - Get recent scans
router.get("/analyses", async (req, res) => {
  try {
    const { userEmail, limit } = req.query;
    const analyses = await getAnalysesByUser(
      userEmail ? String(userEmail) : null,
      limit ? parseInt(String(limit), 10) : 50
    );
    res.json({ analyses });
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analysis history: " + error.message });
  }
});

// Analyses - Save scan result
router.post("/analyses", async (req, res) => {
  try {
    const {
      userEmail,
      fileName,
      fileSize,
      modality,
      label,
      confidence,
      audioScore,
      videoScore,
      fusedScore,
      spectralFlatness,
      zeroCrossingRate,
      spectralCentroid,
      harmonicRatio,
      temporalConsistency,
      artifactScore,
      details,
    } = req.body;

    if (!fileName || !modality || !label || confidence === undefined) {
      return res.status(400).json({ error: "Missing required analysis fields" });
    }

    const saved = await saveAnalysis({
      userEmail,
      fileName,
      fileSize,
      modality,
      label,
      confidence,
      audioScore,
      videoScore,
      fusedScore,
      spectralFlatness,
      zeroCrossingRate,
      spectralCentroid,
      harmonicRatio,
      temporalConsistency,
      artifactScore,
      details,
    });

    res.status(201).json({
      message: "Analysis saved to Neon DB",
      analysis: saved,
    });
  } catch (error) {
    console.error("Save analysis error:", error);
    res.status(500).json({ error: "Failed to save analysis: " + error.message });
  }
});

// Analyses - Delete scan result
router.delete("/analyses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.query;
    await deleteAnalysis(parseInt(id, 10), userEmail ? String(userEmail) : null);
    res.json({ message: "Analysis record deleted" });
  } catch (error) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ error: "Failed to delete analysis: " + error.message });
  }
});

// Stats - Aggregate detection metrics from PostgreSQL
router.get("/stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats: " + error.message });
  }
});

// Feedback - Submit detection feedback
router.post("/feedback", async (req, res) => {
  try {
    const { analysisId, userEmail, feedbackType, comment } = req.body;
    const result = await sql`
      INSERT INTO detection_feedback (analysis_id, user_email, feedback_type, comment)
      VALUES (${analysisId || null}, ${userEmail || null}, ${feedbackType || 'general'}, ${comment || ''})
      RETURNING *;
    `;
    res.status(201).json({ message: "Feedback saved", feedback: result[0] });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to submit feedback: " + error.message });
  }
});

export default router;
