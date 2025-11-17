import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

/**
 * Helper pour instancier le client Groq.
 * On lit la variable d'environnement au moment de la requête,
 * comme ça dotenv.config() a déjà été exécuté dans server.js.
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY est manquant. Ajoute-le dans ton fichier .env à la racine du backend."
    );
  }
  return new Groq({ apiKey });
}

function cleanJSON(raw) {
  if (!raw) return "";
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Helper pour générer des fichiers de code à partir du plan renvoyé par l'IA
function generateFilesFromPlan(plan) {
  const files = [];

  // 1) Fichier serveur de base
  files.push({
    path: "src/server.js",
    content: `import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API générée par CODEFLOW-AI 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
`,
  });

  // 2) Exemple de routes todos si le plan contient une route "Todos"
  const hasTodoRoute = Array.isArray(plan.routes)
    ? plan.routes.some(
        (r) => r.name && String(r.name).toLowerCase() === "todos"
      )
    : false;

  if (hasTodoRoute) {
    files.push({
      path: "src/routes/todos.js",
      content: `import { Router } from "express";

const router = Router();

// GET /todos
router.get("/", (req, res) => {
  res.json([{ id: 1, title: "Todo générée", done: false }]);
});

// POST /todos
router.post("/", (req, res) => {
  const todo = req.body;
  // ici tu ferais un insert en base
  res.status(201).json({ ...todo, id: 2 });
});

export default router;
`,
    });
  }

  // 3) Exemple de modèles si des entités sont présentes
  if (Array.isArray(plan.entities)) {
    plan.entities.forEach((entity) => {
      if (!entity?.name || !Array.isArray(entity.fields)) return;

      const className = entity.name;
      const filePath = `src/models/${className}.js`;

      const fieldsInit = entity.fields
        .map((f) => `    this.${f.name} = data.${f.name} ?? null;`)
        .join("\n");

      const modelContent = `export default class ${className} {
  constructor(data = {}) {
${fieldsInit}
  }
}
`;

      files.push({
        path: filePath,
        content: modelContent,
      });
    });
  }

  return files;
}

// GET /api/generate -> message d'aide (pour tests dans le navigateur)
router.get("/", (req, res) => {
  res.json({
    info: 'Utilise POST /api/generate avec un body JSON du type { "prompt": "..." }'
  });
});

// POST /api/generate -> appel à Groq + génération de fichiers à partir du plan
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt manquant. Envoie { "prompt": "..." } dans le body.'
      });
    }

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      // Modèle par défaut (surchageable via .env)
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
Tu es un assistant spécialisé qui génère des plans d'architecture pour des backends Node.js.

Tu dois TOUJOURS répondre UNIQUEMENT avec un JSON strictement valide.
Pas de texte avant, pas de texte après, pas de commentaires.

Structure attendue du JSON :
{
  "stack": "string (ex: \\"node-express-postgres\\")",
  "description": "courte description du backend",
  "entities": [
    {
      "name": "NomDuModel",
      "fields": [
        { "name": "nom", "type": "string|number|boolean|date|uuid", "primary": bool, "unique": bool }
      ]
    }
  ],
  "routes": [
    {
      "name": "nomDuGroupe",
      "basePath": "/path",
      "endpoints": [
        { "method": "GET|POST|PUT|DELETE", "path": "/subpath", "handler": "nomHandler" }
      ]
    }
  ],
  "files": [
    {
      "path": "src/chemin/fichier.js",
      "type": "server|route|controller|service|config|model",
      "description": "rôle du fichier"
    }
  ]
}
Ne mets JAMAIS de blocs de code Markdown (par exemple un bloc json) ou tout autre délimiteur de code dans ta réponse. Réponds uniquement avec le JSON brut.
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const output = completion.choices?.[0]?.message?.content ?? "";

    const cleanedOutput = cleanJSON(output);

    let parsed;
    try {
      parsed = JSON.parse(cleanedOutput);
    } catch (e) {
      console.error("Réponse Groq non JSON :", cleanedOutput);
      return res.status(500).json({
        error: "Réponse IA non JSON",
        raw: cleanedOutput,
      });
    }

    // Génération de fichiers de code basiques à partir du plan
    const files = generateFilesFromPlan(parsed);

    res.json({
      success: true,
      plan: parsed,
      files,
    });
  } catch (error) {
    console.error("Erreur dans /api/generate:", error);

    res.status(500).json({
      error: "Erreur lors de l'appel à Groq",
      message: error?.message ?? null,
      type: error?.name ?? null,
    });
  }
});

export default router;
