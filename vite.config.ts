import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function apiPlugin(): Plugin {
  return {
    name: "vite-api-plugin",
    async configureServer(server) {
      try {
        const { default: apiRouter } = await import("./server/api.js");
        const app = express();
        app.use(express.json());
        app.use(apiRouter);
        server.middlewares.use("/api", app);
      } catch (err) {
        console.error("Failed to mount API middleware:", err);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), apiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

