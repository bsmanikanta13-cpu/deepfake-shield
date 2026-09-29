import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import apiRouter from "./api.js";
import { initDb } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRouter);

// Serve static frontend if dist exists
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(200).send("DeepFake Shield API is running with Neon PostgreSQL.");
  });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DeepFake Shield Server running on http://localhost:${PORT}`);
    console.log(`🐘 Connected to Neon PostgreSQL`);
  });
}).catch(err => {
  console.error("Failed to initialize database on startup:", err);
  app.listen(PORT, () => {
    console.log(`🚀 DeepFake Shield Server running on http://localhost:${PORT} (DB check pending)`);
  });
});
