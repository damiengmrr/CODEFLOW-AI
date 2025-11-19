import express from "express";
import Groq from "groq-sdk";
import archiver from "archiver";

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

/**
 * Nettoie une réponse potentielle contenant des blocs markdown ```json ... ``` etc.
 */

function cleanJSON(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function cleanCode(raw) {
  if (!raw) return "";
  return String(raw)
    // supprime d'éventuels blocs ```lang ou ``` en début/fin
    .replace(/```[a-zA-Z]*/g, "")
    .trim();
}

function toPascalCase(str = "") {
  return String(str)
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str = "") {
  const pascal = toPascalCase(str);
  return pascal ? pascal[0].toLowerCase() + pascal.slice(1) : "";
}

function toKebabCase(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toTableName(str = "") {
  const base = String(str).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return base.endsWith("s") ? base : `${base}s`;
}

// Helper pour générer un backend Node/Express assez complet à partir du plan
function generateFilesFromPlan(plan = {}) {
  const files = [];

  const projectNameRaw =
    plan.projectName || plan.name || plan.stack || "codeflow-backend";
  const slug =
    toKebabCase(projectNameRaw) || "codeflow-backend";

  const entities = Array.isArray(plan.entities) ? plan.entities : [];
  const routes = Array.isArray(plan.routes) ? plan.routes : [];

  // --- package.json ------------------------------------------------------
  const packageJsonContent = `{
  "name": "${slug}",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "jsonwebtoken": "^9.0.0",
    "morgan": "^1.10.0",
    "pg": "^8.13.0"
  }
}
`;
  files.push({
    path: "package.json",
    content: packageJsonContent,
  });

  // --- .env.example ------------------------------------------------------
  const envExample = `# Exemple de configuration pour un backend généré par CODEFLOW-AI

PORT=5000

# Clé API Groq (optionnelle, côté génération)
GROQ_API_KEY=sk-...

# Base PostgreSQL (adapter le user/mot de passe/port/nom de base)
DATABASE_URL=postgres://user:password@localhost:5432/app

# Secret JWT pour l'auth
JWT_SECRET=change-me-in-production
`;
  files.push({
    path: ".env.example",
    content: envExample,
  });

  // --- docker-compose.yml pour PostgreSQL -------------------------------
  const dockerCompose = `version: "3.9"

services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`;
  files.push({
    path: "docker-compose.yml",
    content: dockerCompose,
  });

  // --- src/config/database.js -------------------------------------------
  const dbConfig = `import dotenv from "dotenv";
import pkg from "pg";

const { Pool } = pkg;

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://user:password@localhost:5432/app";

export const pool = new Pool({
  connectionString,
});

export async function query(text, params) {
  return pool.query(text, params);
}
`;
  files.push({
    path: "src/config/database.js",
    content: dbConfig,
  });

  // --- src/config/auth.js -----------------------------------------------
  const authConfig = `import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    ...options,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
`;
  files.push({
    path: "src/config/auth.js",
    content: authConfig,
  });

  // --- middlewares d'erreur / 404 ---------------------------------------
  const notFoundMiddleware = `export default function notFound(req, res, next) {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl,
  });
}
`;
  files.push({
    path: "src/middlewares/notFound.js",
    content: notFoundMiddleware,
  });

  const errorHandlerMiddleware = `export default function errorHandler(err, req, res, next) {
  console.error("Erreur interne:", err);

  const status = err.status || 500;
  const message = err.message || "Erreur interne du serveur";

  res.status(status).json({
    error: message,
  });
}
`;
  files.push({
    path: "src/middlewares/errorHandler.js",
    content: errorHandlerMiddleware,
  });

  // --- src/server.js (serveur Express complet) --------------------------
  const serverJs = `import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import registerRoutes from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Backend généré par CODEFLOW-AI 🚀",
    stack: "${String(plan.stack || "").replace(/"/g, '\\"')}",
    description: "${String(plan.description || "").replace(/"/g, '\\"')}",
  });
});

// Enregistrement dynamique des routes
registerRoutes(app);

// Middlewares de fin de chaîne
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("✅ Serveur démarré sur http://localhost:" + PORT);
});
`;
  files.push({
    path: "src/server.js",
    content: serverJs,
  });

  // --- src/routes/index.js (enregistre toutes les routes déclarées) -----
  const routeGroups = routes.filter((r) => r && r.name);
  let routesIndexImports = "";
  let routesIndexBody = "";

  routeGroups.forEach((group) => {
    const groupName = group.name;
    const camelName = toCamelCase(groupName);
    const fileSlug = toKebabCase(groupName) || camelName || "routes";
    const basePath = group.basePath || `/${fileSlug}`;
    const importName = `${camelName}Router` || "router";

    routesIndexImports += `import ${importName} from "./${fileSlug}.js";\n`;
    routesIndexBody += `  app.use("${basePath}", ${importName});\n`;
  });

  if (!routesIndexBody) {
    routesIndexBody = '  // Aucune route déclarée pour le moment.\n';
  }

  const routesIndex = `${routesIndexImports}
export default function registerRoutes(app) {
${routesIndexBody}}
`;
  files.push({
    path: "src/routes/index.js",
    content: routesIndex,
  });

  // --- Génération des routes + controllers ------------------------------
  routeGroups.forEach((group) => {
    const groupName = group.name;
    const pascalName = toPascalCase(groupName);
    const camelName = toCamelCase(groupName);
    const fileSlug = toKebabCase(groupName) || camelName || "routes";
    const controllerName = `${pascalName}Controller`;
    const controllerFile = `src/controllers/${controllerName}.js`;
    const routeFile = `src/routes/${fileSlug}.js`;

    const endpoints = Array.isArray(group.endpoints) ? group.endpoints : [];

    // Essaie d'associer ce groupe de routes à une entité (pour générer un CRUD plus complet)
    const linkedEntity =
      entities.find((e) => {
        return (
          toTableName(e.name) === toTableName(groupName) ||
          toKebabCase(e.name) === toKebabCase(groupName)
        );
      }) || null;

    const serviceImportName = linkedEntity
      ? `${toCamelCase(linkedEntity.name)}Service`
      : null;
    const serviceImportPath = linkedEntity
      ? `../services/${toCamelCase(linkedEntity.name)}Service.js`
      : null;

    // Route file
    let routeContent = `import { Router } from "express";
  import * as ${controllerName} from "../controllers/${controllerName}.js";

  const router = Router();
  `;

    endpoints.forEach((ep) => {
      if (!ep || !ep.method || !ep.path) return;
      const method = String(ep.method || "get").toLowerCase();
      const handler =
        ep.handler && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ep.handler)
          ? ep.handler
          : `${method}${toPascalCase(ep.path || "Handler")}Handler`;

      routeContent += `
  router.${method}("${ep.path}", ${controllerName}.${handler});
  `;
    });

    routeContent += `

  export default router;
  `;

    files.push({
      path: routeFile,
      content: routeContent,
    });

    // Controller file
    let controllerContent = `// Contrôleur généré pour le groupe de routes "${groupName}"
  `;

    if (serviceImportName && serviceImportPath && linkedEntity) {
      controllerContent += `// Ce contrôleur est relié au service de l'entité "${linkedEntity.name}".
  import * as ${serviceImportName} from "${serviceImportPath}";

  `;
    } else {
      controllerContent += `// Aucun service spécifique n'a été détecté pour ce groupe.
// Tu peux créer un fichier dans src/services/ et l'importer ici.

`;
    }

    endpoints.forEach((ep) => {
      if (!ep || !ep.method || !ep.path) return;
      const method = String(ep.method || "get").toLowerCase();
      const path = ep.path || "/";
      const handler =
        ep.handler && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ep.handler)
          ? ep.handler
          : `${method}${toPascalCase(ep.path || "Handler")}Handler`;

      const isList =
        method === "get" && (path === "/" || path === "");
      const isGetById =
        method === "get" && /:id/.test(path);
      const isCreate =
        method === "post" && (path === "/" || path === "");
      const isUpdate =
        (method === "put" || method === "patch") && /:id/.test(path);
      const isDelete =
        method === "delete" && /:id/.test(path);

      controllerContent += `export async function ${handler}(req, res, next) {
    try {
  `;

      if (serviceImportName) {
        if (isList) {
          controllerContent += `      const data = await ${serviceImportName}.findAll();
      return res.json(data);
  `;
        } else if (isGetById) {
          controllerContent += `      const { id } = req.params;
      const item = await ${serviceImportName}.findById(id);
      if (!item) {
        return res.status(404).json({ error: "Ressource introuvable" });
      }
      return res.json(item);
  `;
        } else if (isCreate) {
          controllerContent += `      const created = await ${serviceImportName}.create(req.body);
      return res.status(201).json(created);
  `;
        } else if (isUpdate) {
          controllerContent += `      const { id } = req.params;
      // 💡 À implémenter dans le service : update(id, data)
      const updated = ${serviceImportName}.update
        ? await ${serviceImportName}.update(id, req.body)
        : null;

      if (!updated) {
        return res.status(501).json({
          message: "La fonction update() n'est pas encore implémentée dans le service.",
        });
      }

      return res.json(updated);
  `;
        } else if (isDelete) {
          controllerContent += `      const { id } = req.params;
      await ${serviceImportName}.remove(id);
      return res.status(204).send();
  `;
        } else {
          controllerContent += `      // TODO: implémenter la logique spécifique pour ce handler
      // Tu peux utiliser le service ${serviceImportName} ici.
      return res.status(501).json({
        message: "Handler '${handler}' non implémenté pour le moment.",
      });
  `;
        }
      } else {
        controllerContent += `      // TODO: implémenter ce handler.
      // Aucun service n'a été détecté automatiquement pour ce groupe de routes.
      return res.status(501).json({
        message: "Handler '${handler}' non implémenté pour le moment.",
      });
  `;
      }

      controllerContent += `    } catch (error) {
      next(error);
    }
  }

  `;
    });

    if (!endpoints.length) {
      controllerContent += `// Aucune route déclarée pour ce groupe pour le moment.
  `;
    }

    files.push({
      path: controllerFile,
      content: controllerContent,
    });
  });

  // --- Génération des modèles & services à partir des entités ----------
  entities.forEach((entity) => {
    if (!entity || !entity.name || !Array.isArray(entity.fields)) return;

    const className = toPascalCase(entity.name);
    const modelPath = `src/models/${className}.js`;
    const servicePath = `src/services/${toCamelCase(entity.name)}Service.js`;
    const tableName = toTableName(entity.name);

    const fieldsInit = entity.fields
      .map((f) => `    this.${f.name} = data.${f.name} ?? null;`)
      .join("\n");

    const modelContent = `// Modèle simple pour l'entité "${entity.name}"
export default class ${className} {
  constructor(data = {}) {
${fieldsInit}
  }
}
`;
    files.push({
      path: modelPath,
      content: modelContent,
    });

    const nonPrimaryFields = entity.fields.filter(
      (f) => !f.primary && f.name
    );
    const primaryField =
      entity.fields.find((f) => f.primary) || entity.fields[0];

    const columns = nonPrimaryFields.map((f) => f.name);
    const insertColumns = columns.join(", ");
    const insertParams = columns
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    // Corps de la fonction create() généré en fonction des colonnes disponibles
    let createBody;
    if (columns.length === 0) {
      // Aucun champ non primaire : on s'appuie sur DEFAULT VALUES (id auto-généré, timestamps, etc.)
      createBody = `
  const sql = \`INSERT INTO "\${TABLE}" DEFAULT VALUES RETURNING *\`;

  const { rows } = await query(sql);
  return rows[0];
`;
    } else {
      createBody = `
  // ⚠️ Pense à adapter les colonnes à ta vraie structure de table si nécessaire.
  const sql = \`INSERT INTO "\${TABLE}" (${insertColumns})
               VALUES (${insertParams})
               RETURNING *\`;

  const params = [${columns.map((c) => `data.${c}`).join(", ")}];

  const { rows } = await query(sql, params);
  return rows[0];
`;
    }

    // Corps de la fonction update() généré avec une mise à jour dynamique
    const allowedColumnsCode = JSON.stringify(columns);

    const updateBody = `
  const allowed = ${allowedColumnsCode};
  const setClauses = [];
  const params = [];
  let index = 1;

  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(\`"\${key}" = $\${index}\`);
    params.push(value);
    index++;
  }

  if (!setClauses.length) {
    throw new Error("Aucun champ valide fourni pour la mise à jour.");
  }

  params.push(id);

  const sql = \`UPDATE "\${TABLE}" SET \${setClauses.join(", ")} WHERE "${primaryField?.name || "id"}" = $\${index} RETURNING *\`;

  const { rows } = await query(sql, params);
  return rows[0] || null;
`;

    const serviceContent = `// Service PostgreSQL pour l'entité "${entity.name}"
import { query } from "../config/database.js";

const TABLE = "${tableName}";

export async function findAll() {
  const { rows } = await query(\`SELECT * FROM "\${TABLE}"\`);
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    \`SELECT * FROM "\${TABLE}" WHERE "${primaryField?.name || "id"}" = $1\`,
    [id]
  );
  return rows[0] || null;
}

export async function create(data) {${createBody}
}

export async function update(id, data) {${updateBody}
}

export async function remove(id) {
  await query(
    \`DELETE FROM "\${TABLE}" WHERE "${primaryField?.name || "id"}" = $1\`,
    [id]
  );
  return true;
}
`;
    files.push({
      path: servicePath,
      content: serviceContent,
    });
  });

  // --- README adaptatif selon entités et routes -----------------------------
  const entitiesSection = entities.length
    ? entities
        .map((e) => {
          const fields = Array.isArray(e.fields) ? e.fields : [];
          const fieldList = fields
            .map((f) => `- \`${f.name}\` (${f.type || "string"})`)
            .join("\n");

          return `### ${e.name}\n\nNombre de champs : ${fields.length}\n\n${fieldList}`;
        })
        .join("\n\n")
    : "_Aucune entité définie dans le plan._";

  const routesSection = routeGroups.length
    ? routeGroups
        .map((group) => {
          const endpoints = Array.isArray(group.endpoints) ? group.endpoints : [];
          const endpointList = endpoints
            .map(
              (ep) =>
                `- **${(ep.method || "GET").toUpperCase()}** \`${group.basePath || ""}${ep.path || "/"}\` → \`${ep.handler || "handler"}\``
            )
            .join("\n");

          return `### ${group.name}\n\nBase path : \`${group.basePath || "/"}\`\n\n${endpointList}`;
        })
        .join("\n\n")
    : "_Aucune route déclarée dans le plan._";

  const readmeContent = `# Backend généré avec CODEFLOW-AI

Ce dossier contient un backend **Node.js / Express** généré automatiquement à partir d'une simple description.

- **Stack** : ${String(plan.stack || "node-express-postgres")}
- **Description** : ${String(plan.description || "Backend généré automatiquement par CODEFLOW-AI.")}

## 🚀 Démarrage rapide

1. Installe les dépendances :

   \`\`\`bash
   npm install
   \`\`\`

2. Copie le fichier \`.env.example\` vers \`.env\` et adapte les valeurs :

   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Lance le serveur :

   \`\`\`bash
   npm run dev
   \`\`\`

Le serveur démarre par défaut sur \`http://localhost:5000\`.

## 🐳 Optionnel : démarrer PostgreSQL avec Docker

Si tu n'as pas encore de base PostgreSQL locale, tu peux utiliser le \`docker-compose.yml\` généré :

\`\`\`bash
docker-compose up -d
\`\`\`

Cela démarre un conteneur Postgres accessible sur le port \`5432\` avec les mêmes identifiants que dans \`.env.example\`.

## 🧱 Architecture générée

- Serveur Express prêt à l'emploi : \`src/server.js\`
- Configuration PostgreSQL : \`src/config/database.js\`
- Configuration JWT : \`src/config/auth.js\`
- Système de routes modulaire : \`src/routes/*.js\` + \`src/routes/index.js\`
- Contrôleurs pour chaque groupe de routes : \`src/controllers/*.js\`
- Modèles et services pour chaque entité : \`src/models/*.js\`, \`src/services/*.js\`
- Middlewares d'erreur et 404 : \`src/middlewares/*.js\`

## 📌 Entités générées

${entitiesSection}

## 🌐 Routes générées

${routesSection}

---

Tu peux maintenant :

- Adapter les modèles/services à ta base réelle,
- Compléter les contrôleurs avec ta logique métier,
- Brancher ce backend à un frontend (React, Next, Vue, etc.),
- Ou l'intégrer tel quel comme base solide pour ton projet.
`;
  files.push({
    path: "README.md",
    content: readmeContent,
  });

  return files;
}

// GET /api/generate -> message d'aide (pour tests dans le navigateur)
router.get("/", (req, res) => {
  return res.json({
    info: 'Utilise POST /api/generate avec un body JSON du type { "prompt": "..." }',
  });
});

// POST /api/generate -> appel à Groq + génération de fichiers à partir du plan
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: 'Prompt manquant ou invalide. Envoie { "prompt": "..." } dans le body.',
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

Ne mets JAMAIS de blocs de code Markdown (par exemple un bloc \`\`\`json) ou tout autre délimiteur de code dans ta réponse.
Réponds uniquement avec le JSON brut.
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const rawContent = completion?.choices?.[0]?.message?.content ?? "";

    const cleanedOutput = cleanJSON(
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
        ? rawContent.map((part) => part?.text ?? "").join("")
        : ""
    );

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

    return res.json({
      success: true,
      plan: parsed,
      files,
    });
  } catch (error) {
    console.error("Erreur dans /api/generate:", error);

    // Si Groq / Cloudflare renvoie une page HTML (erreur 5xx),
    // on évite de renvoyer tout le HTML au frontend.
    const rawMessage = error?.message ?? "";
    const looksLikeHtml =
      typeof rawMessage === "string" &&
      rawMessage.includes("<!DOCTYPE html>");

    const safeMessage = looksLikeHtml
      ? "Le service Groq est temporairement indisponible (erreur 500 côté fournisseur). Réessaie dans quelques minutes."
      : rawMessage;

    return res.status(500).json({
      error: "Erreur lors de l'appel à Groq",
      message: safeMessage || null,
      status: error?.status ?? null,
      type: error?.name ?? null,
    });
  }
});

// POST /api/generate/refactor-file: refactorise un fichier selon une instruction
router.post("/refactor-file", async (req, res) => {
  try {
    const { filePath, fileContent, instruction } = req.body || {};

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        error: 'filePath manquant ou invalide. Exemple: "src/routes/users.js".',
      });
    }

    if (typeof fileContent !== "string" || !fileContent.trim()) {
      return res.status(400).json({
        error:
          "fileContent manquant ou vide. Envoie le contenu actuel complet du fichier à modifier.",
      });
    }

    if (!instruction || typeof instruction !== "string") {
      return res.status(400).json({
        error:
          "instruction manquante ou invalide. Donne une consigne claire, par exemple: 'ajoute une route /users qui renvoie la liste des utilisateurs'.",
      });
    }

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `
Tu es un assistant spécialisé dans la refactorisation de fichiers de code backend (Node.js, Express, JavaScript / TypeScript, config, etc.).

On te fournit:
- le chemin textuel du fichier (filePath),
- le contenu actuel COMPLET du fichier (fileContent),
- une instruction de modification (instruction).

Ta mission:
- Retourner UNIQUEMENT le NOUVEAU contenu COMPLET du fichier, prêt à être sauvegardé tel quel.
- NE PAS ajouter de commentaires superflus, d'explications, ni de texte autour.
- NE PAS ajouter de blocs de code Markdown (pas de \`\`\`, pas de \`\`\`js, pas de \`\`\`json).
- Conserver le style, les imports, et la logique déjà en place, en appliquant juste l'instruction demandée.

Si l'instruction est ambiguë, choisis l'option la plus raisonnable pour un backend Node/Express moderne.
            `.trim(),
        },
        {
          role: "user",
          content: `Chemin du fichier: ${filePath}\n\nInstruction:\n${instruction}\n\n---\n\nContenu actuel du fichier:\n${fileContent}`,
        },
      ],
    });

    const rawContent =
      completion?.choices?.[0]?.message?.content ?? "";

    const newContent = cleanCode(
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
        ? rawContent.map((part) => part?.text ?? "").join("")
        : ""
    );

    if (!newContent) {
      return res.status(500).json({
        error:
          "La réponse IA est vide ou invalide. Réessaie avec une instruction plus précise.",
      });
    }

    // 🔒 Sécurité : si le nouveau contenu est BEAUCOUP plus court que l'original,
    // on considère que l'IA a probablement supprimé trop de code.
    const originalTrimmed = fileContent.trim();
    const newTrimmed = newContent.trim();

    if (
      originalTrimmed.length > 0 &&
      newTrimmed.length < originalTrimmed.length * 0.3
    ) {
      return res.status(422).json({
        error:
          "La modification IA semble supprimer une grande partie du fichier. Rien n'a été appliquée.",
        message:
          "Reformule l'instruction en précisant bien de conserver tout le fichier et d'ajouter seulement ce dont tu as besoin.",
        originalPreview: originalTrimmed.slice(0, 500),
        newPreview: newTrimmed.slice(0, 500),
      });
    }

    return res.json({
      path: filePath,
      content: newTrimmed,
    });
  } catch (error) {
    console.error("Erreur dans /api/generate/refactor-file:", error);

    const rawMessage = error?.message ?? "";
    const looksLikeHtml =
      typeof rawMessage === "string" && rawMessage.includes("<!DOCTYPE html>");

    const safeMessage = looksLikeHtml
      ? "Le service Groq est temporairement indisponible (erreur 500 côté fournisseur). Réessaie dans quelques minutes."
      : rawMessage;

    return res.status(500).json({
      error: "Erreur lors de la refactorisation du fichier via Groq",
      message: safeMessage || null,
      status: error?.status ?? null,
      type: error?.name ?? null,
    });
  }
});

// POST /api/generate/zip -> même génération, mais renvoie un ZIP téléchargeable
router.post("/zip", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error:
          'Prompt manquant ou invalide. Envoie { "prompt": "..." } dans le body.',
      });
    }

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
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

Ne mets JAMAIS de blocs de code Markdown (par exemple un bloc \`\`\`json) ou tout autre délimiteur de code dans ta réponse.
Réponds uniquement avec le JSON brut.
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const rawContent = completion?.choices?.[0]?.message?.content ?? "";

    const cleanedOutput = cleanJSON(
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
        ? rawContent.map((part) => part?.text ?? "").join("")
        : ""
    );

    let parsed;
    try {
      parsed = JSON.parse(cleanedOutput);
    } catch (e) {
      console.error("Réponse Groq non JSON (ZIP):", cleanedOutput);
      return res.status(500).json({
        error: "Réponse IA non JSON",
        raw: cleanedOutput,
      });
    }

    // Génération de fichiers à partir du plan
    const files = generateFilesFromPlan(parsed);

    const filenameSlug =
      toKebabCase(
        parsed.projectName || parsed.name || parsed.stack || "codeflow-backend"
      ) || "codeflow-backend";

    // Prépare la réponse HTTP pour un téléchargement de ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenameSlug}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Erreur lors de la génération du ZIP :", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Erreur lors de la génération du ZIP",
          message: err.message || null,
        });
      } else {
        res.end();
      }
    });

    // On pipe le ZIP directement vers la réponse HTTP
    archive.pipe(res);

    // Ajout de chaque fichier généré dans l'archive
    files.forEach((file) => {
      const content = file.content ?? "";
      const filePath = file.path || "file.txt";
      archive.append(content, { name: filePath });
    });

    // Finalise le ZIP (envoie la fin du flux)
    archive.finalize();
  } catch (error) {
    console.error("Erreur dans /api/generate/zip:", error);

    const rawMessage = error?.message ?? "";
    const looksLikeHtml =
      typeof rawMessage === "string" && rawMessage.includes("<!DOCTYPE html>");

    const safeMessage = looksLikeHtml
      ? "Le service Groq est temporairement indisponible (erreur 500 côté fournisseur). Réessaie dans quelques minutes."
      : rawMessage;

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Erreur lors de l'appel à Groq ou lors de la génération du ZIP",
        message: safeMessage || null,
        status: error?.status ?? null,
        type: error?.name ?? null,
      });
    } else {
      res.end();
    }
  }
});

export default router;
