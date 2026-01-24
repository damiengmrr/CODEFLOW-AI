// backend/src/preview/previewManager.js
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { spawn } from "child_process";
import net from "net";

let PREVIEW_PORT = parseInt(
  process.env.PREVIEW_PORT || process.env.CODEFLOW_PREVIEW_PORT || "5174",
  10
);

async function findAvailablePort(startPort) {
  let port = startPort;
  while (true) {
    const isFree = await new Promise((resolve) => {
      const tester = net
        .createServer()
        .once("error", () => resolve(false))
        .once("listening", () =>
          tester.once("close", () => resolve(true)).close()
        )
        .listen(port);
    });
    if (isFree) return port;
    port++;
  }
}

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
  // Ne pas supprimer le dossier complet sinon ça efface node_modules.
  // On conserve node_modules pour éviter de refaire npm install à chaque génération.
  await fs.mkdir(previewRoot, { recursive: true });

  // Nettoie tout sauf node_modules
  const entries = await fs.readdir(previewRoot).catch(() => []);
  await Promise.all(
    entries.map(async (name) => {
      if (name === "node_modules") return;
      await fs.rm(path.join(previewRoot, name), { recursive: true, force: true });
    })
  );

  // Écrit/écrase les fichiers générés
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
async function startViteDevServer() {
  PREVIEW_PORT = await findAvailablePort(PREVIEW_PORT);
  console.log(`[previewManager] Using port ${PREVIEW_PORT} for preview`);
  console.log(`[previewManager] Preview root directory: ${previewRoot}`);

  if (currentPreview.process && (currentPreview.status === "starting" || currentPreview.status === "ready")) {
    console.log("[previewManager] Vite dev server already running, reusing existing process");
    currentPreview.url = `http://localhost:${PREVIEW_PORT}`;
    return;
  }

  if (currentPreview.process) {
    try {
      if (currentPreview.process.pid) {
        currentPreview.process.kill("SIGTERM");
        // fallback kill after short delay if still running (for macOS/Linux)
        setTimeout(() => {
          try {
            if (currentPreview.process && !currentPreview.process.killed) {
              currentPreview.process.kill("SIGKILL");
            }
          } catch {
            // ignore
          }
        }, 5000);
      }
    } catch {
      // ignore
    }
  }

  console.log("[previewManager] Starting frontend preview server...");
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
        console.log("[previewManager] npm install already in progress, waiting...");
        const checkInterval = setInterval(() => {
          if (!installInProgress) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
        return;
      }

      if (!npmInstallNeeded) {
        console.log("[previewManager] node_modules detected, skipping npm install");
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
        console.log("[previewManager] npm install finished with code", code);
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

      currentPreview.process = dev;

      let resolvedReady = false;
      const readyTimer = setTimeout(() => {
        if (!resolvedReady && currentPreview.status === "starting") {
          currentPreview.status = "error";
          currentPreview.error =
            "Le serveur Vite n'a pas signalé d'URL de preview (timeout).";
          try {
            dev.kill("SIGTERM");
          } catch {
            // ignore
          }
        }
      }, 30000);

      dev.stdout.on("data", (data) => {
        const text = data.toString();
        console.log("[previewManager][vite]", text.trim());

        // Détection améliorée de la readiness Vite
        if (!resolvedReady && (text.includes("Local:") || text.includes("http://") || /ready in/i.test(text))) {
          resolvedReady = true;
          clearTimeout(readyTimer);
          currentPreview.status = "ready";
          currentPreview.url = `http://localhost:${PREVIEW_PORT}`;
          console.log("[previewManager] Preview is ready and accessible at:", currentPreview.url);
          resolve();
        }
      });

      dev.stderr.on("data", (data) => {
        const text = data.toString();
        console.error("[previewManager][vite:err]", text.trim());
      });

      dev.on("spawn", () => {
        console.log("[previewManager] Vite dev server spawned on", `http://localhost:${PREVIEW_PORT}`);
        // On laisse le status en 'starting' jusqu'à détection 'Local:' / 'http://' / 'ready in'
      });

      dev.on("close", (code) => {
        clearTimeout(readyTimer);
        console.log("[previewManager] Vite dev server exited with code", code);
        if (code !== 0 && currentPreview.status !== "stopped") {
          currentPreview.status = "error";
          currentPreview.error = `Vite s'est arrêté avec le code ${code}`;
        } else if (currentPreview.status !== "stopped") {
          currentPreview.status = "stopped";
        }
      });

      dev.on("error", (err) => {
        clearTimeout(readyTimer);
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
      console.error("[previewManager] Erreur lors du démarrage de Vite:", err);
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

  console.log("[previewManager] Launching frontend preview with", files.length, "files");

  const wasRunning =
    !!currentPreview.process &&
    (currentPreview.status === "starting" || currentPreview.status === "ready");

  // On écrit d'abord les fichiers
  await writeFilesToPreviewDir(files);

  // Reset error and url only after successful write
  currentPreview.error = null;
  currentPreview.url = `http://localhost:${PREVIEW_PORT}`;

  currentPreview.status = "starting";

  // Si le serveur Vite tourne déjà, on ne modifie pas le status 'ready'
  if (wasRunning) {
    console.log("[previewManager] Reusing existing Vite dev server for new frontend files");
    return {
      status: currentPreview.status === "starting" ? currentPreview.status : "ready",
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
  console.log("[previewManager] Stopping frontend preview server...");
  if (currentPreview.process) {
    try {
      if (currentPreview.process.pid) {
        currentPreview.status = "stopped";
        currentPreview.process.kill("SIGTERM");
        // fallback kill after short delay if still running (for macOS/Linux)
        setTimeout(() => {
          try {
            if (currentPreview.process && !currentPreview.process.killed) {
              currentPreview.process.kill("SIGKILL");
            }
          } catch {
            // ignore
          }
        }, 5000);
      }
    } catch (err) {
      console.error("[previewManager] Erreur lors de l'arrêt du process:", err);
    } finally {
      currentPreview.process = null;
    }
  }

  currentPreview.url = null;
  currentPreview.error = null;
  installInProgress = false;

  // Optionnel : nettoyage (on garde node_modules)
  try {
    const entries = await fs.readdir(previewRoot).catch(() => []);
    await Promise.all(
      entries.map(async (name) => {
        if (name === "node_modules") return;
        await fs.rm(path.join(previewRoot, name), { recursive: true, force: true });
      })
    );
  } catch {
    // ignore
  }

  return { status: "stopped" };
}