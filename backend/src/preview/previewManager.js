// backend/src/preview/previewManager.js
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { spawn } from "child_process";
import os from "os";

const PREVIEW_PORT = parseInt(
  process.env.PREVIEW_PORT || process.env.CODEFLOW_PREVIEW_PORT || "5174",
  10
);

let currentPreview = {
  status: "idle", // idle | starting | ready | error | stopped
  url: null,
  error: null,
  process: null,
};

let installInProgress = false;

const previewRoot = path.join(process.cwd(), ".preview-frontend");

/**
 * Écrit les fichiers générés par l'IA dans le dossier de preview
 */
async function writeFilesToPreviewDir(files) {
  // On repart de zéro à chaque fois
  await fs.rm(previewRoot, { recursive: true, force: true });
  await fs.mkdir(previewRoot, { recursive: true });

  for (const file of files) {
    const filePath = path.join(previewRoot, file.path);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, file.content ?? "", "utf8");
  }
}

/**
 * Lance le serveur Vite dans un process enfant.
 * On suppose que package.json + config Vite sont déjà dans les fichiers
 * (ce que ton générateur frontend produit).
 */
function startViteDevServer() {
  if (currentPreview.process && (currentPreview.status === "starting" || currentPreview.status === "ready")) {
    console.log("[preview] Vite dev server already running, reusing existing process");
    currentPreview.url = `http://localhost:${PREVIEW_PORT}`;
    return;
  }

  if (currentPreview.process) {
    try {
      currentPreview.process.kill("SIGTERM");
    } catch {
      // ignore
    }
  }

  console.log("[preview] Starting frontend preview server...");
  currentPreview.status = "starting";
  currentPreview.error = null;
  currentPreview.url = `http://localhost:${PREVIEW_PORT}`;
  currentPreview.process = null;

  // 1) npm install (si node_modules pas présent)
  const npmInstallNeeded = !fsSync.existsSync(
    path.join(previewRoot, "node_modules")
  );

  const runNpmInstallIfNeeded = () =>
    new Promise((resolve, reject) => {
      if (installInProgress) {
        console.log("[preview] npm install already in progress, waiting...");
        const checkInterval = setInterval(() => {
          if (!installInProgress) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
        return;
      }

      if (!npmInstallNeeded) {
        console.log("[preview] node_modules detected, skipping npm install");
        return resolve();
      }

      installInProgress = true;

      const install = spawn("npm", ["install"], {
        cwd: previewRoot,
        stdio: "inherit",
        shell: process.platform === "win32", // compat Windows si un jour
      });

      install.on("close", (code) => {
        installInProgress = false;
        console.log("[preview] npm install finished with code", code);
        if (code === 0) resolve();
        else reject(new Error(`npm install exited with code ${code}`));
      });

      install.on("error", (err) => {
        installInProgress = false;
        reject(err);
      });
    });

  const runViteDev = () =>
    new Promise((resolve, reject) => {
      const dev = spawn(
        "npm",
        ["run", "dev", "--", `--port=${PREVIEW_PORT}`, "--host=0.0.0.0"],
        {
          cwd: previewRoot,
          stdio: ["ignore", "pipe", "pipe"],
          shell: process.platform === "win32",
        }
      );

      dev.stdout.on("data", (data) => {
        const text = data.toString();
        console.log("[preview][vite]", text.trim());
      });

      dev.stderr.on("data", (data) => {
        const text = data.toString();
        console.error("[preview][vite:err]", text.trim());
      });

      currentPreview.process = dev;

      dev.on("spawn", () => {
        console.log("[preview] Vite dev server spawned on", currentPreview.url);
        // On considère la preview "ready" une fois le serveur démarré.
        currentPreview.status = "ready";
        setTimeout(() => {
          if (currentPreview.status === "starting") {
            console.warn("[preview] Vite did not signal readiness within the expected delay.");
          }
        }, 15000);
        resolve();
      });

      dev.on("close", (code) => {
        console.log("[preview] Vite dev server exited with code", code);
        if (code !== 0 && currentPreview.status !== "stopped") {
          currentPreview.status = "error";
          currentPreview.error = `Vite s'est arrêté avec le code ${code}`;
        } else if (currentPreview.status !== "stopped") {
          currentPreview.status = "stopped";
        }
      });

      dev.on("error", (err) => {
        currentPreview.status = "error";
        if (err.code === "ENOENT") {
          currentPreview.error =
            "Impossible de lancer Vite : la commande `npm` est introuvable. Vérifie que Node.js et npm sont bien installés et accessibles dans le PATH.";
        } else {
          currentPreview.error = err.message || "Erreur Vite inconnue";
        }
        reject(err);
      });
    });

  // On enchaîne npm install (si besoin) puis npm run dev,
  // mais en tâche de fond pour ne pas bloquer l'API.
  (async () => {
    try {
      await runNpmInstallIfNeeded();
      await runViteDev();
    } catch (err) {
      console.error("[preview] Erreur lors du démarrage de Vite:", err);
      currentPreview.status = "error";
      currentPreview.error =
        err?.message || "Erreur lors du démarrage du serveur Vite.";
    }
  })();
}

/**
 * Lance une preview frontend à partir d'un tableau de fichiers générés
 */
export async function launchFrontendPreview(files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error(
      "Aucun fichier fourni pour la preview frontend (files[] est vide)."
    );
  }

  console.log("[preview] Launching frontend preview with", files.length, "files");

  currentPreview.status = "starting";
  currentPreview.error = null;
  currentPreview.url = null;

  await writeFilesToPreviewDir(files);

  if (currentPreview.process && currentPreview.status === "ready") {
    console.log("[preview] Reusing existing Vite dev server for new frontend files");
    currentPreview.url = `http://localhost:${PREVIEW_PORT}`;
    return {
      status: currentPreview.status,
      url: currentPreview.url,
    };
  }

  startViteDevServer();

  return {
    status: currentPreview.status,
    url: currentPreview.url,
  };
}

/**
 * Renvoie l'état courant de la preview
 */
export function getFrontendPreviewStatus() {
  return {
    status: currentPreview.status,
    url: currentPreview.url,
    error: currentPreview.error,
  };
}

/**
 * Stoppe le serveur Vite de preview
 */
export async function stopFrontendPreview() {
  console.log("[preview] Stopping frontend preview server...");
  if (currentPreview.process) {
    try {
      currentPreview.status = "stopped";
      currentPreview.process.kill("SIGTERM");
    } catch (err) {
      console.error("[preview] Erreur lors de l'arrêt du process:", err);
    } finally {
      currentPreview.process = null;
    }
  }

  currentPreview.url = null;
  currentPreview.error = null;
  installInProgress = false;

  // Optionnel : nettoyage du dossier
  try {
    await fs.rm(previewRoot, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return { status: "stopped" };
}