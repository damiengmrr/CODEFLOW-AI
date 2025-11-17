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

// GET /api/generate -> message d'aide (pour tests dans le navigateur)
router.get("/", (req, res) => {
  res.json({
    info: 'Utilise POST /api/generate avec un body JSON du type { "prompt": "..." }'
  });
});

// POST /api/generate -> appel à Groq
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

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (e) {
      console.error("Réponse Groq non JSON :", output);
      return res.status(500).json({
        error: "Réponse IA non JSON",
        raw: output,
      });
    }

    res.json({
      success: true,
      plan: parsed,
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
