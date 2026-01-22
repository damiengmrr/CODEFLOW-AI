// backend/src/routes/previewRoutes.js
import express from "express";
import {
  launchFrontendPreview,
  getFrontendPreviewStatus,
  stopFrontendPreview,
} from "../preview/previewManager.js";

const router = express.Router();

/**
 * Lance une preview frontend Vite à partir des fichiers générés
 * Body attendu :
 * {
 *   "files": [
 *     { "path": "index.html", "content": "<!doctype html>..." },
 *     { "path": "src/main.jsx", "content": "..." },
 *     ...
 *   ]
 * }
 */
router.post("/frontend", async (req, res) => {
  try {
    const { files } = req.body || {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: "Champ 'files' manquant ou vide dans le body."
      });
    }

    const invalid = files.find(f => !f.path || typeof f.path !== "string" || typeof f.content !== "string");
    if (invalid) {
      return res.status(400).json({
        error: "Chaque fichier doit contenir 'path' (string) et 'content' (string)."
      });
    }

    const state = await launchFrontendPreview(files);
    return res.status(202).json({
      message: "Preview frontend en cours de démarrage.",
      ...state,
    });
  } catch (err) {
    console.error("[/api/preview/frontend:POST] error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erreur lors du démarrage de la preview." });
  }
});

/**
 * Récupère l'état de la preview frontend
 */
router.get("/frontend", (req, res) => {
  try {
    const state = getFrontendPreviewStatus();
    return res.json(state);
  } catch (err) {
    console.error("[/api/preview/frontend:GET] error:", err);
    return res.status(500).json({ error: "Impossible de récupérer l'état de la preview." });
  }
});

/**
 * Stoppe la preview frontend
 */
router.delete("/frontend", async (req, res) => {
  try {
    const state = await stopFrontendPreview();
    return res.status(200).json({
      message: "Preview frontend arrêtée.",
      state
    });
  } catch (err) {
    console.error("[/api/preview/frontend:DELETE] error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erreur lors de l'arrêt de la preview." });
  }
});

export default router;