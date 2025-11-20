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

/* -------------------------------------------------------------------------- */
/*                          BACKEND: génération Node                          */
/* -------------------------------------------------------------------------- */

// Helper pour générer un backend Node/Express assez complet à partir du plan
function generateBackendFilesFromPlan(plan = {}) {
  const files = [];

  const projectNameRaw =
    plan.projectName || plan.name || plan.stack || "codeflow-backend";
  const slug = toKebabCase(projectNameRaw) || "codeflow-backend";

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

      const isList = method === "get" && (path === "/" || path === "");
      const isGetById = method === "get" && /:id/.test(path);
      const isCreate = method === "post" && (path === "/" || path === "");
      const isUpdate =
        (method === "put" || method === "patch") && /:id/.test(path);
      const isDelete = method === "delete" && /:id/.test(path);

      controllerContent += `export async function ${handler}(req, res, next) {
  try {
`;

      if (serviceImportName) {
        if (isList) {
          controllerContent += `    const data = await ${serviceImportName}.findAll();
    return res.json(data);
`;
        } else if (isGetById) {
          controllerContent += `    const { id } = req.params;
    const item = await ${serviceImportName}.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Ressource introuvable" });
    }
    return res.json(item);
`;
        } else if (isCreate) {
          controllerContent += `    const created = await ${serviceImportName}.create(req.body);
    return res.status(201).json(created);
`;
        } else if (isUpdate) {
          controllerContent += `    const { id } = req.params;
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
          controllerContent += `    const { id } = req.params;
    await ${serviceImportName}.remove(id);
    return res.status(204).send();
`;
        } else {
          controllerContent += `    // TODO: implémenter la logique spécifique pour ce handler
    // Tu peux utiliser le service ${serviceImportName} ici.
    return res.status(501).json({
      message: "Handler '${handler}' non implémenté pour le moment.",
    });
`;
        }
      } else {
        controllerContent += `    // TODO: implémenter ce handler.
    // Aucun service n'a été détecté automatiquement pour ce groupe de routes.
    return res.status(501).json({
      message: "Handler '${handler}' non implémenté pour le moment.",
    });
`;
      }

      controllerContent += `  } catch (error) {
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
    const insertParams = columns.map((_, index) => `$${index + 1}`).join(", ");

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

  const routeGroups2 = routes.filter((r) => r && r.name);
  const routesSection = routeGroups2.length
    ? routeGroups2
        .map((group) => {
          const endpoints = Array.isArray(group.endpoints)
            ? group.endpoints
            : [];
          const endpointList = endpoints
            .map(
              (ep) =>
                `- **${(ep.method || "GET").toUpperCase()}** \`${group.basePath || ""}${
                  ep.path || "/"
                }\` → \`${ep.handler || "handler"}\``
            )
            .join("\n");

          return `### ${group.name}\n\nBase path : \`${group.basePath || "/"}\`\n\n${endpointList}`;
        })
        .join("\n\n")
    : "_Aucune route déclarée dans le plan._";

  const readmeContent = `# Backend généré avec CODEFLOW-AI

Ce dossier contient un backend **Node.js / Express** généré automatiquement à partir d'une simple description.

- **Stack** : ${String(plan.stack || "node-express-postgres")}
- **Description** : ${String(
    plan.description || "Backend généré automatiquement par CODEFLOW-AI."
  )}

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

/* -------------------------------------------------------------------------- */
/*                        FRONTEND: génération React UI                       */
/* -------------------------------------------------------------------------- */

function generateFrontendFilesFromPlan(plan = {}) {
  const files = [];
  const projectNameRaw =
    plan.projectName || plan.name || plan.stack || "codeflow-frontend";
  const slug = toKebabCase(projectNameRaw) || "codeflow-frontend";
  const pages =
    Array.isArray(plan.pages) && plan.pages.length
      ? plan.pages
      : [
          { name: "Home", path: "/", kind: "landing" },
          { name: "Dashboard", path: "/dashboard", kind: "app" },
        ];
  const design = plan.design || {};
  const primaryColor = design.primaryColor || "#6366f1";
  const accentColor = design.accentColor || "#22c55e";
  const backgroundMode = design.background || "dark";
  // package.json
  const packageJson = `{
  "name": "${slug}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0",
    "axios": "^1.7.0",
    "gsap": "^3.12.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.13",
    "vite": "^7.2.0"
  }
}
`;
  files.push({ path: "package.json", content: packageJson });
  // index.html
  const indexHtml = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${projectNameRaw}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body class="${backgroundMode === "dark" ? "bg-slate-950" : "bg-slate-50"}">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
  files.push({ path: "index.html", content: indexHtml });
  // vite.config.js
  const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});
`;
  files.push({ path: "vite.config.js", content: viteConfig });
  // tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "${primaryColor}",
          accent: "${accentColor}"
        }
      }
    }
  },
  plugins: [],
};
`;
  files.push({ path: "tailwind.config.js", content: tailwindConfig });
  // postcss.config.js
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
  files.push({ path: "postcss.config.js", content: postcssConfig });
  // .env.example
  const envExample = `# Variables d'environnement pour le frontend généré par CODEFLOW-AI
# VITE_API_URL="http://localhost:5000/api"
# VITE_API_URL="https://mon-backend.en-prod.com/api"
`;
  files.push({ path: ".env.example", content: envExample });
  // src/lib/apiClient.js
  const apiClientJs = `import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[CODEFLOW-AI] Erreur API:", error);
    throw error;
  }
);
export default api;
`;
  files.push({ path: "src/lib/apiClient.js", content: apiClientJs });
  // src/index.css
  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
:root { color-scheme: ${backgroundMode === "dark" ? "dark" : "light"}; }
body { @apply antialiased min-h-screen; }
`;
  files.push({ path: "src/index.css", content: indexCss });
  // src/main.jsx
  const mainJsx = `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`;
  files.push({ path: "src/main.jsx", content: mainJsx });
  // src/components/Layout.jsx
  const layoutJsx = `import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900">
          <div className="max-w-6xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
`;
  files.push({ path: "src/components/Layout.jsx", content: layoutJsx });
  // src/components/Sidebar.jsx
  const sidebarJsx = `import { NavLink } from "react-router-dom";
const links = [
  ${pages
    .map(
      (p) =>
        `{ label: "${p.name}", to: "${p.path || "/"}", icon: "●" }`
    )
    .join(",\n  ")}
];
export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-primary to-brand-accent mr-2" />
        <div>
          <div className="text-sm font-semibold tracking-tight">CODEFLOW UI</div>
          <div className="text-xs text-slate-400">Frontend généré</div>
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              \`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors \${isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}\`
            }
          >
            <span className="text-xs">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
`;
  files.push({ path: "src/components/Sidebar.jsx", content: sidebarJsx });
  // src/components/Topbar.jsx
  const topbarJsx = `export default function Topbar() {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-xs text-slate-300">
          Interface React générée automatiquement par <span className="font-semibold text-slate-50">CODEFLOW-AI</span>
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span>Structure prête à connecter à ton backend.</span>
      </div>
    </header>
  );
}
`;
  files.push({ path: "src/components/Topbar.jsx", content: topbarJsx });
  // src/App.jsx
  const pageImports = pages
    .map((p) => {
      const compName = toPascalCase(p.name || "Page");
      return `import ${compName} from "./pages/${compName}.jsx";`;
    })
    .join("\n");
  const routesJsx = pages
    .map((p) => {
      const compName = toPascalCase(p.name || "Page");
      const path = p.path || "/";
      return `          <Route path="${path}" element={<${compName} />} />`;
    })
    .join("\n");
  const appJsx = `import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
${pageImports}
export default function App() {
  return (
    <Layout>
      <Routes>
${routesJsx}
        <Route path="*" element={<Navigate to="${pages[0].path || "/"}" replace />} />
      </Routes>
    </Layout>
  );
}
`;
  files.push({ path: "src/App.jsx", content: appJsx });
  // pages
  pages.forEach((p) => {
    const compName = toPascalCase(p.name || "Page");
    const title = p.title || p.name || compName;
    const description =
      p.description ||
      plan.description ||
      "Page générée automatiquement. Tu peux maintenant adapter le contenu et le design à ton cas réel.";
    const isLanding = (p.kind || "").toLowerCase() === "landing";
    let pageContent;
    if (isLanding) {
      pageContent = `import { useEffect, useRef } from "react";
import gsap from "gsap";
export default function ${compName}() {
  const sectionRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cf-animate",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={sectionRef} className="space-y-8">
      <div className="cf-animate rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-6 md:p-8 shadow-lg">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
            ${title}
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            ${description}
          </p>
        </div>
        <div className="pt-4 flex flex-wrap gap-3">
          <button className="cf-animate inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-xs md:text-sm font-medium text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all">
            Lancer le projet <span className="text-[10px]">↗</span>
          </button>
          <button className="cf-animate inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs md:text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 transition-colors">
            Voir la démo
          </button>
        </div>
      </div>
      <div className="cf-animate grid gap-4 md:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-2">
            Section principale
          </h2>
          <p className="text-xs text-slate-300">
            Remplace cette section par les composants ou graphiques dont ton projet a besoin.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-2">
            Pistes d'évolution
          </h2>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>– Connecte cette page à ton backend.</li>
            <li>– Ajoute des appels API avec axios.</li>
            <li>– Ajoute des composants UI.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
`;
    } else {
      pageContent = `export default function ${compName}() {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          ${title}
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          ${description}
        </p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs text-slate-300">
          Remplace ce contenu par tes composants, formulaires ou graphiques.
        </p>
      </div>
    </section>
  );
}
`;
    }
    files.push({
      path: `src/pages/${compName}.jsx`,
      content: pageContent,
    });
  });
  // README.md
  const pagesSection =
    pages.length > 0
      ? pages
          .map((p) => `- \`${p.path || "/"}\` → ${p.name || "Page"}`)
          .join("\n")
      : "_Aucune page décrite dans le plan._";
  const readme = `# Frontend React généré avec CODEFLOW-AI

Ce dossier contient un frontend **React + Vite + TailwindCSS** généré automatiquement à partir d'une simple description.

- **Stack** : ${String(plan.stack || "react-vite-tailwind")}
- **Description** : ${String(
    plan.description || "Frontend généré automatiquement par CODEFLOW-AI."
  )}

## 🚀 Démarrage rapide

1. Installe les dépendances :
   \`\`\`bash
   npm install
   \`\`\`
2. Configure les variables d'environnement :
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Puis adapte l'URL de ton backend dans \`.env\`.
3. Lance le serveur de dev :
   \`\`\`bash
   npm run dev
   \`\`\`
L'application démarre par défaut sur \`http://localhost:5173\`.

## 🧱 Architecture générée
- Entrée Vite : \`index.html\`
- App React : \`src/main.jsx\`, \`src/App.jsx\`
- Layout global : \`src/components/Layout.jsx\`, \`Sidebar.jsx\`, \`Topbar.jsx\`
- Pages : \`src/pages/*.jsx\`
- Client HTTP : \`src/lib/apiClient.js\` (préconfiguré avec axios et \`VITE_API_URL\`)
- Styles : \`src/index.css\`, \`tailwind.config.js\`, \`postcss.config.js\`

## 🌐 Pages générées
${pagesSection}

---
Tu peux maintenant :
- Personnaliser le layout (Sidebar, Topbar, Layout),
- Adapter les pages générées à ton cas métier,
- Connecter ce frontend à un backend Node/Express (ou autre) via \`src/lib/apiClient.js\`,
- Ajouter tes propres composants UI, formulaires, graphiques, etc., en t'appuyant sur l'API.
`;
  files.push({ path: "README.md", content: readme });
  return files;
}

/* -------------------------------------------------------------------------- */
/*                         PROMPTS IA (backend / front)                       */
/* -------------------------------------------------------------------------- */

const BACKEND_SYSTEM_PROMPT = `
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
`.trim();

const FRONTEND_SYSTEM_PROMPT = `
Tu es un assistant spécialisé qui génère des PLANS D’ARCHITECTURE pour des frontends React de type dashboard SaaS admin (Vite + React + TailwindCSS).

🎯 Objectif général
- Toujours produire un JSON **très structuré et complet** pour un dashboard admin moderne.
- Adapter le contenu aux mots-clés du prompt (ex: gestion de projets, tâches, utilisateurs), mais **garder une structure de dashboard** : Home / Projets / Paramètres / Login.

⚠️ RÈGLE FONDAMENTALE
Tu dois TOUJOURS répondre **UNIQUEMENT** avec un **JSON strictement valide**.
- Pas de texte avant.
- Pas de texte après.
- Pas de commentaires.
- Pas de Markdown (PAS de \`\`\` ni \`\`\`json).

✅ CLÉS OBLIGATOIRES AU NIVEAU RACINE
La racine du JSON DOIT contenir **au minimum** ces clés :
- \`stack\` (string)
- \`description\` (string)
- \`pages\` (array)
- \`layout\` (object)
- \`design\` (object)
- \`components\` (array)
- \`animations\` (object)

Si le prompt utilisateur est très vague ou ne précise pas tout, **tu dois quand même renvoyer toutes ces clés** avec des valeurs par défaut raisonnables pour un dashboard admin moderne.

🧱 SCHÉMA GÉNÉRAL ATTENDU

{
  "stack": "react-vite-tailwind",
  "description": "courte description du frontend généré (ex: Dashboard SaaS pour une app de gestion de projets)",
  "pages": [
    {
      "name": "Home",
      "path": "/",
      "title": "Dashboard global",
      "description": "Vue d’ensemble des projets, tâches et activité récente",
      "kind": "dashboard",
      "sections": [
        {
          "id": "hero-overview",
          "type": "hero-dashboard",
          "title": "Bienvenue sur votre espace de gestion",
          "subtitle": "Suivez vos projets, vos tâches et l'avancement de votre équipe en temps réel.",
          "layout": "two-column",
          "components": ["primary-cta", "secondary-cta", "quick-stats"],
          "animations": {
            "library": "gsap",
            "entrance": "fade-up",
            "stagger": true
          }
        },
        {
          "id": "stats-cards",
          "type": "stats-grid",
          "title": "Indicateurs clés",
          "items": [
            { "label": "Projets actifs", "value": "12", "trend": "+3", "variant": "primary" },
            { "label": "Tâches en cours", "value": "47", "trend": "-5", "variant": "neutral" },
            { "label": "Tâches en retard", "value": "4", "trend": "+1", "variant": "danger" }
          ]
        },
        {
          "id": "activity-table",
          "type": "data-table",
          "title": "Activité récente",
          "columns": [
            { "id": "project", "label": "Projet" },
            { "id": "task", "label": "Tâche" },
            { "id": "status", "label": "Statut" },
            { "id": "assignee", "label": "Assigné à" },
            { "id": "updatedAt", "label": "Mis à jour" }
          ],
          "rows": [
            {
              "project": "Refonte site marketing",
              "task": "Mise à jour de la landing",
              "status": "En cours",
              "assignee": "Léa",
              "updatedAt": "Il y a 2h"
            }
          ]
        }
      ]
    },
    {
      "name": "Projets",
      "path": "/projets",
      "title": "Projets",
      "description": "Liste, filtrage et gestion des projets.",
      "kind": "app",
      "sections": [
        {
          "id": "filters",
          "type": "filters-bar",
          "title": "Filtres",
          "filters": [
            { "id": "status", "label": "Statut", "type": "select", "options": ["Tous", "Actifs", "Terminés"] },
            { "id": "owner", "label": "Responsable", "type": "select", "options": ["Tous", "Moi", "Équipe"] }
          ]
        },
        {
          "id": "projects-table",
          "type": "data-table",
          "title": "Liste des projets",
          "columns": [
            { "id": "name", "label": "Nom" },
            { "id": "status", "label": "Statut" },
            { "id": "progress", "label": "Avancement" },
            { "id": "owner", "label": "Responsable" },
            { "id": "dueDate", "label": "Échéance" }
          ],
          "rows": [
            {
              "name": "Plateforme SaaS interne",
              "status": "En cours",
              "progress": "68%",
              "owner": "Naël",
              "dueDate": "30/11/2025"
            }
          ],
          "actions": ["view", "edit", "delete"]
        }
      ]
    },
    {
      "name": "Paramètres",
      "path": "/parametres",
      "title": "Paramètres",
      "description": "Préférences du compte, notifications et sécurité.",
      "kind": "settings",
      "sections": [
        {
          "id": "profile",
          "type": "form",
          "title": "Profil",
          "fields": [
            { "id": "name", "label": "Nom complet", "type": "text" },
            { "id": "email", "label": "Adresse e-mail", "type": "email" }
          ]
        },
        {
          "id": "notifications",
          "type": "toggles",
          "title": "Notifications",
          "toggles": [
            { "id": "email-notifs", "label": "Notifications par e-mail", "default": true },
            { "id": "push-notifs", "label": "Notifications push", "default": false }
          ]
        }
      ]
    },
    {
      "name": "Login",
      "path": "/login",
      "title": "Connexion",
      "description": "Accès sécurisé à l'espace administrateur.",
      "kind": "auth",
      "sections": [
        {
          "id": "login-form",
          "type": "auth-form",
          "title": "Se connecter",
          "fields": [
            { "id": "email", "label": "Adresse e-mail", "type": "email" },
            { "id": "password", "label": "Mot de passe", "type": "password" }
          ],
          "actions": [
            { "id": "submit", "label": "Connexion", "variant": "primary" },
            { "id": "forgot", "label": "Mot de passe oublié ?", "variant": "ghost" }
          ]
        }
      ]
    }
  ],
  "layout": {
    "navigation": {
      "brand": "Nom du dashboard",
      "links": [
        { "label": "Dashboard", "to": "/" },
        { "label": "Projets", "to": "/projets" },
        { "label": "Paramètres", "to": "/parametres" }
      ],
      "cta": { "label": "Se déconnecter", "to": "/logout" }
    },
    "sidebar": {
      "enabled": true,
      "collapsible": true,
      "items": [
        { "label": "Dashboard", "to": "/", "icon": "layout-dashboard" },
        { "label": "Projets", "to": "/projets", "icon": "folder" },
        { "label": "Paramètres", "to": "/parametres", "icon": "settings" }
      ]
    },
    "topbar": {
      "enabled": true,
      "items": [
        { "type": "search", "placeholder": "Rechercher un projet..." },
        { "type": "user-menu", "items": ["Profil", "Paramètres", "Déconnexion"] }
      ]
    },
    "footer": {
      "enabled": true,
      "links": [
        { "label": "Mentions légales", "to": "/legal" },
        { "label": "Confidentialité", "to": "/privacy" }
      ]
    }
  },
  "design": {
    "primaryColor": "#6366f1",
    "accentColor": "#22c55e",
    "background": "dark",
    "radius": "lg",
    "shadows": "medium"
  },
  "components": [
    { "name": "StatCard", "type": "card", "uses": ["dashboard", "metrics"] },
    { "name": "DataTable", "type": "table", "uses": ["lists", "projects"] },
    { "name": "PrimaryButton", "type": "button", "variant": "primary", "uses": ["cta", "forms"] }
  ],
  "animations": {
    "library": "gsap",
    "presets": ["fade-up", "fade-in", "scale-in", "stagger-list"],
    "useOnSections": ["hero-overview", "stats-cards", "activity-table"]
  }
}

📌 COMPORTEMENT ATTENDU
- Si le prompt de l’utilisateur mentionne un autre type d’app (CRM, SaaS de facturation, gestion RH…), adapte les titres, labels, textes et exemples, mais **garde cette structure** et ces clés.
- Garde toujours les pages principales : Home (ou Dashboard), Projets (ou équivalent métier), Paramètres, Login, sauf si le prompt impose clairement autre chose.
- Tu peux ajouter des pages supplémentaires si le prompt le justifie, mais évite de supprimer celles-ci sans raison.
- Ne renvoie JAMAIS de clé racine différente de celles prévues (tu peux ajouter d’autres clés si nécessaire, mais sans supprimer stack, description, pages, layout, design, components, animations).
`.trim();

/* -------------------------------------------------------------------------- */
/*                                  ROUTES                                    */
/* -------------------------------------------------------------------------- */

// GET /api/generate -> message d'aide (pour tests dans le navigateur)
router.get("/", (req, res) => {
  return res.json({
    info:
      'Utilise POST /api/generate avec un body JSON du type { "prompt": "...", "mode": "backend|frontend" }',
  });
});

// POST /api/generate -> appel à Groq + génération de fichiers à partir du plan
router.post("/", async (req, res) => {
  try {
    const { prompt, mode = "backend" } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error:
          'Prompt manquant ou invalide. Envoie { "prompt": "..." } dans le body.',
      });
    }

    const normalizedMode =
      mode === "frontend" || mode === "front" ? "frontend" : "backend";

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            normalizedMode === "frontend"
              ? FRONTEND_SYSTEM_PROMPT
              : BACKEND_SYSTEM_PROMPT,
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

    const files =
      normalizedMode === "frontend"
        ? generateFrontendFilesFromPlan(parsed)
        : generateBackendFilesFromPlan(parsed);

    return res.json({
      success: true,
      mode: normalizedMode,
      plan: parsed,
      files,
    });
  } catch (error) {
    console.error("Erreur dans /api/generate:", error);

    const rawMessage = error?.message ?? "";
    const looksLikeHtml =
      typeof rawMessage === "string" && rawMessage.includes("<!DOCTYPE html>");

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
Tu es un assistant spécialisé dans la refactorisation de fichiers de code (backend Node.js / Express, frontend React, JavaScript / TypeScript, config, etc.).

On te fournit:
- le chemin textuel du fichier (filePath),
- le contenu actuel COMPLET du fichier (fileContent),
- une instruction de modification (instruction).

Ta mission:
- Retourner UNIQUEMENT le NOUVEAU contenu COMPLET du fichier, prêt à être sauvegardé tel quel.
- NE PAS ajouter de commentaires superflus, d'explications, ni de texte autour.
- NE PAS ajouter de blocs de code Markdown (pas de \`\`\`, pas de \`\`\`js, pas de \`\`\`json).
- Conserver le style, les imports, et la logique déjà en place, en appliquant juste l'instruction demandée.

Si l'instruction est ambiguë, choisis l'option la plus raisonnable pour un projet moderne.
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
    const { prompt, mode = "backend" } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error:
          'Prompt manquant ou invalide. Envoie { "prompt": "..." } dans le body.',
      });
    }

    const normalizedMode =
      mode === "frontend" || mode === "front" ? "frontend" : "backend";

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            normalizedMode === "frontend"
              ? FRONTEND_SYSTEM_PROMPT
              : BACKEND_SYSTEM_PROMPT,
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
    const files =
      normalizedMode === "frontend"
        ? generateFrontendFilesFromPlan(parsed)
        : generateBackendFilesFromPlan(parsed);

    const filenameSlug =
      toKebabCase(
        parsed.projectName ||
          parsed.name ||
          parsed.stack ||
          (normalizedMode === "frontend"
            ? "codeflow-frontend"
            : "codeflow-backend")
      ) ||
      (normalizedMode === "frontend"
        ? "codeflow-frontend"
        : "codeflow-backend");

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
        error:
          "Erreur lors de l'appel à Groq ou lors de la génération du ZIP",
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