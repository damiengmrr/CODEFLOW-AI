// src/services/codegenService.js

/**
 * Utilitaires simples pour formater les noms à partir du plan IA
 */
function toKebabCase(name = "") {
  return String(name)
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPascalCase(name = "") {
  return String(name)
    .trim()
    .replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function toCamelCase(name = "") {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Fichier server.js principal
 */
function buildServerFile(routes = []) {
  const imports = [];
  const routers = [];

  // On part sur un préfixe API unique pour simplifier
  routes.forEach((route) => {
    const routeName = route.name || route.basePath || "main";
    const routeKey = toCamelCase(routeName);
    const routeFileBase = toKebabCase(routeName);
    const importPath = `./routes/${routeFileBase}`;

    imports.push(`const ${routeKey}Router = require('${importPath}');`);
    const basePath = route.basePath || `/${routeFileBase}`;
    routers.push(`app.use('${basePath}', ${routeKey}Router);`);
  });

  const importsBlock = imports.length ? imports.join("\n") + "\n\n" : "";
  const routersBlock = routers.length
    ? routers.join("\n")
    : `// TODO: Ajoute tes routes ici, par ex:\n// app.use('/todos', todosRouter);`;

  return `
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { initDatabase } = require('./config/database');

${importsBlock}const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ping endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CODEFLOW-AI-backend' });
});

// Routes générées
${routersBlock}

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log('🚀 Server running on port ' + PORT);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
`.trimStart();
}

/**
 * Fichier de configuration PostgreSQL
 */
function buildDatabaseConfigFile() {
  return `
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Si besoin, adapter pour un usage local :
      // host: process.env.DB_HOST || 'localhost',
      // port: process.env.DB_PORT || 5432,
      // user: process.env.DB_USER || 'postgres',
      // password: process.env.DB_PASSWORD || 'postgres',
      // database: process.env.DB_NAME || 'app_db',
    });
  }
  return pool;
}

async function initDatabase() {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ Database connection OK');
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  initDatabase,
};
`.trimStart();
}

/**
 * Fichier d'authentification / JWT
 */
function buildAuthConfigFile() {
  return `
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = {
  signToken,
  verifyToken,
  authMiddleware,
};
`.trimStart();
}

/**
 * Modèle de base pour une entité
 */
function buildModelFile(entity) {
  const name = toPascalCase(entity.name || 'Entity');
  const fields = entity.fields || [];

  const fieldsComment = fields
    .map((f) => {
      const type = f.type || 'any';
      const fieldName = f.name || 'field';
      return ` * @property {${type}} ${fieldName}`;
    })
    .join('\n');

  return `
/**
 * Modèle généré pour ${name}
${fieldsComment ? '\n' + fieldsComment : ''}
 */
class ${name} {
  constructor(data = {}) {
${fields
  .map((f) => {
    const fieldName = f.name || 'field';
    return `    this.${fieldName} = data.${fieldName} ?? null;`;
  })
  .join('\n') || '    // Ajoute ici les champs nécessaires'
}
  }
}

module.exports = ${name};
`.trimStart();
}

/**
 * Service pour une ressource (logique métier, accès DB)
 */
function buildServiceFile(route, entity) {
  const routeName = route.name || route.basePath || 'resource';
  const serviceName = toPascalCase(routeName) + 'Service';
  const entityName = entity ? toPascalCase(entity.name) : null;
  const entityImport = entityName
    ? `const ${entityName} = require('../models/${entityName}');\n`
    : '';

  return `
const { getPool } = require('../config/database');
${entityImport}/**
 * Service généré pour ${routeName}
 * Tu peux adapter les requêtes SQL à ton vrai schéma.
 */
class ${serviceName} {
  constructor() {
    this.pool = getPool();
  }

  async findAll() {
    // Exemple générique : à adapter
    const result = await this.pool.query('SELECT * FROM ${toKebabCase(
      routeName
    )}');
    return result.rows;
  }

  async findById(id) {
    const result = await this.pool.query(
      'SELECT * FROM ${toKebabCase(routeName)} WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(payload) {
    // TODO: adapte les colonnes / valeurs en fonction de ton modèle
    // return nouvelEnregistrement;
    return payload;
  }

  async update(id, payload) {
    // TODO: adapte la requête UPDATE
    return { id, ...payload };
  }

  async remove(id) {
    // TODO: adapte la requête DELETE
    return { id };
  }
}

module.exports = new ${serviceName}();
`.trimStart();
}

/**
 * Controller Express pour une ressource
 */
function buildControllerFile(route, entity) {
  const routeName = route.name || route.basePath || 'resource';
  const controllerName = toPascalCase(routeName) + 'Controller';
  const serviceName = toPascalCase(routeName) + 'Service';

  const endpoints = route.endpoints || [];

  // On regarde les handlers explicitement fournis par le plan
  const handlersFromPlan = new Set(
    endpoints
      .map((e) => e.handler)
      .filter(Boolean)
      .map((h) => String(h).trim())
  );

  // Sinon on propose un CRUD standard
  const defaultHandlers = [
    { name: 'getAll', comment: 'Récupérer toutes les ressources' },
    { name: 'getOne', comment: 'Récupérer une ressource par ID' },
    { name: 'create', comment: 'Créer une ressource' },
    { name: 'update', comment: 'Mettre à jour une ressource' },
    { name: 'remove', comment: 'Supprimer une ressource' },
  ];

  const handlerNames =
    handlersFromPlan.size > 0 ? Array.from(handlersFromPlan) : defaultHandlers.map((h) => h.name);

  const methodsCode = handlerNames
    .map((handler) => {
      const methodName = toCamelCase(handler);
      return `
  async ${methodName}(req, res, next) {
    try {
      // TODO: implémente la logique métier
      // Exemple:
      // const data = await ${serviceName}.${methodName}(/* params */);
      // return res.json(data);
      return res.json({ message: 'Handler ${methodName} non encore implémenté' });
    } catch (err) {
      next(err);
    }
  }`;
    })
    .join('\n');

  return `
const ${serviceName} = require('../services/${toKebabCase(routeName)}');

class ${controllerName} {${methodsCode}
}

module.exports = new ${controllerName}();
`.trimStart();
}

/**
 * Fichier de routes Express pour une ressource
 */
function buildRouteFile(route) {
  const routeName = route.name || route.basePath || 'resource';
  const controllerVar = `${toCamelCase(routeName)}Controller`;
  const controllerImportPath = `../controllers/${toKebabCase(routeName)}`;
  const routerVar = `${toCamelCase(routeName)}Router`;
  const endpoints = route.endpoints || [];

  const endpointsCode = endpoints
    .map((endpoint) => {
      const method = (endpoint.method || 'GET').toLowerCase();
      const path = endpoint.path || '/';
      const handlerName = endpoint.handler
        ? toCamelCase(endpoint.handler)
        : inferHandlerNameFromMethodAndPath(method, path);

      return `router.${method}('${path}', ${controllerVar}.${handlerName}.bind(${controllerVar}));`;
    })
    .join('\n');

  const endpointsBlock =
    endpointsCode ||
    `// Ajoute ici les endpoints de ${routeName}, par ex:\n// router.get('/', controller.getAll.bind(controller));`;

  return `
const express = require('express');
const router = express.Router();
const ${controllerVar} = require('${controllerImportPath}');

// Routes générées pour ${routeName}
${endpointsBlock}

module.exports = router;
`.trimStart();
}

/**
 * Deviner un nom de handler à partir de la méthode et du path
 */
function inferHandlerNameFromMethodAndPath(method, path) {
  if (method === 'get' && path === '/') return 'getAll';
  if (method === 'get') return 'getOne';
  if (method === 'post') return 'create';
  if (method === 'put' || method === 'patch') return 'update';
  if (method === 'delete') return 'remove';
  return `${method}${toPascalCase(path.replace(/[/:]/g, ' '))}`;
}

/**
 * Fichier d'agrégation des routes
 */
function buildRoutesIndexFile(routes = []) {
  const imports = [];
  const uses = [];

  routes.forEach((route) => {
    const routeName = route.name || route.basePath || 'resource';
    const basePath = route.basePath || `/${toKebabCase(routeName)}`;
    const varName = toCamelCase(routeName) + 'Router';
    const importPath = `./${toKebabCase(routeName)}`;

    imports.push(`const ${varName} = require('${importPath}');`);
    uses.push(`router.use('${basePath}', ${varName});`);
  });

  const importsBlock = imports.join('\n');
  const usesBlock =
    uses.join('\n') ||
    `// Ajoute ici tes routes :\n// router.use('/todos', todosRouter);`;

  return `
const express = require('express');
const router = express.Router();

${importsBlock}

${usesBlock}

module.exports = router;
`.trimStart();
}

/**
 * Fichier .env.example pour guider l'utilisateur
 */
function buildEnvExampleFile() {
  return `
# Exemple de configuration pour un backend généré par CODEFLOW-AI

PORT=5000

# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/app_db

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1d
`.trimStart();
}

/**
 * Docker-compose simple pour lancer Postgres
 */
function buildDockerComposeFile() {
  return `
version: '3.8'

services:
  db:
    image: postgres:16
    container_name: codeflow_ai_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app_db
    ports:
      - '5432:5432'
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`.trimStart();
}

/**
 * Fichier README minimal pour le backend généré
 */
function buildBackendReadme(plan) {
  const description = plan.description || 'Backend généré par CODEFLOW-AI';
  const stack = plan.stack || 'node-express-postgres';

  return `
# Backend généré avec CODEFLOW-AI

${description}

## Stack

- ${stack}
- Express.js
- PostgreSQL (via \`pg\`)
- JWT pour l'authentification
- Docker (optionnel) pour la base de données

## Démarrage

1. Copie les fichiers générés dans un dossier de projet.
2. Duplique \`.env.example\` en \`.env\` et adapte les valeurs.
3. (Optionnel) Lance PostgreSQL avec \`docker-compose up -d\`.
4. Installe les dépendances nécessaires :

   \`\`\`bash
   npm install express cors morgan pg jsonwebtoken dotenv
   \`\`\`

5. Démarre le serveur :

   \`\`\`bash
   node src/server.js
   \`\`\`

Tu peux ensuite adapter les services, modèles, contrôleurs et routes en fonction de ton besoin métier.
`.trimStart();
}

/**
 * Fonction principale : transformer un "plan" IA en fichiers concrets
 * Retourne un tableau de { path, content }
 */
function generateFilesFromPlan(plan = {}) {
  const files = [];

  const entities = Array.isArray(plan.entities) ? plan.entities : [];
  const routes = Array.isArray(plan.routes) ? plan.routes : [];

  // Fichiers de base
  files.push({
    path: 'src/server.js',
    content: buildServerFile(routes),
  });

  files.push({
    path: 'src/config/database.js',
    content: buildDatabaseConfigFile(),
  });

  files.push({
    path: 'src/config/auth.js',
    content: buildAuthConfigFile(),
  });

  // Models
  entities.forEach((entity) => {
    if (!entity || !entity.name) return;
    const modelName = toPascalCase(entity.name);
    files.push({
      path: `src/models/${modelName}.js`,
      content: buildModelFile(entity),
    });
  });

  // Routes + Controllers + Services
  routes.forEach((route) => {
    const routeName = route.name || route.basePath;
    if (!routeName) return;

    const fileBase = toKebabCase(routeName);

    // Route file
    files.push({
      path: `src/routes/${fileBase}.js`,
      content: buildRouteFile(route),
    });

    // Controller
    files.push({
      path: `src/controllers/${fileBase}.js`,
      content: buildControllerFile(route),
    });

    // Service : on essaie d'associer une entité du même nom si possible
    const matchingEntity =
      entities.find(
        (e) =>
          e.name &&
          toKebabCase(e.name) === toKebabCase(routeName)
      ) || null;

    files.push({
      path: `src/services/${fileBase}.js`,
      content: buildServiceFile(route, matchingEntity),
    });
  });

  // routes/index.js pour tout agréger
  files.push({
    path: 'src/routes/index.js',
    content: buildRoutesIndexFile(routes),
  });

  // .env.example
  files.push({
    path: '.env.example',
    content: buildEnvExampleFile(),
  });

  // docker-compose.yml
  files.push({
    path: 'docker-compose.yml',
    content: buildDockerComposeFile(),
  });

  // README backend
  files.push({
    path: 'BACKEND_README.md',
    content: buildBackendReadme(plan),
  });

  return files;
}

module.exports = {
  generateFilesFromPlan,
};