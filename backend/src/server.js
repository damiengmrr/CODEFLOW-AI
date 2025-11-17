import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generateRoute from "./routes/generate.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CodeFlow AI backend" });
});

app.use("/api/generate", generateRoute);

app.listen(PORT, () => {
  console.log(`🚀 CodeFlow AI backend running on http://localhost:${PORT}`);
});