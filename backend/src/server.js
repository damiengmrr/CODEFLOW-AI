import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CodeFlow AI backend" });
});

app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API CodeFlow AI 🚀");
  });

app.listen(PORT, () => {
  console.log(`🚀 CodeFlow AI backend running on http://localhost:${PORT}`);
});