import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generateRoute from "./routes/generate.js";
import previewRouter from "./routes/previewRoutes.js"; // routes for preview / live frontend

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CodeFlow AI backend" });
});

// Routes
app.use("/api/generate", generateRoute);
app.use("/api/preview", previewRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CodeFlow AI backend running on http://localhost:${PORT}`);
});