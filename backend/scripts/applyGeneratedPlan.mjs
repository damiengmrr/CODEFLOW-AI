// backend/scripts/applyGeneratedPlan.mjs
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Où on va générer le code
const OUTPUT_BASE = path.join(__dirname, "..", "generated", "todo-api");

// URL de ton backend generator
const API_URL = "http://localhost:4000/api/generate";

async function main() {
  // 1) Prompt à envoyer à ton API
  const prompt =
    "Génère un backend pour une API de todo list avec utilisateurs, authentification JWT et base PostgreSQL";

  console.log("📡 Appel à", API_URL);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const txt = await response.text();
    console.error("❌ Erreur API:", response.status, txt);
    process.exit(1);
  }

  const data = await response.json();
  const files = data.files || [];

  if (!files.length) {
    console.error("⚠️ Aucun fichier généré dans la réponse.");
    process.exit(1);
  }

  console.log(`📝 ${files.length} fichiers à écrire dans ${OUTPUT_BASE}`);

  for (const file of files) {
    const fullPath = path.join(OUTPUT_BASE, file.path);

    // Créer les dossiers si besoin
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Écrire le fichier
    await fs.writeFile(fullPath, file.content, "utf8");
    console.log("✅ Fichier écrit :", fullPath);
  }

  console.log("✨ Génération terminée !");
}

main().catch((err) => {
  console.error("💥 Erreur dans le script:", err);
  process.exit(1);
});