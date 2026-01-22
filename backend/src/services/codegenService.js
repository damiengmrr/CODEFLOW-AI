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

  const assignments =
    fields.length > 0
      ? fields
          .map((f) => {
            const fieldName = f.name || 'field';
            return `    this.${fieldName} = data.${fieldName} ?? null;`;
          })
          .join('\n')
      : '    // Ajoute ici les champs nécessaires';

  const fromRowBody =
    fields.length > 0
      ? fields
          .map((f) => {
            const fieldName = f.name || 'field';
            return `        ${fieldName}: row.${fieldName},`;
          })
          .join('\n')
      : '        // mappe ici les colonnes de ta table vers les propriétés du modèle';

  const toRowBody =
    fields.length > 0
      ? fields
          .map((f) => {
            const fieldName = f.name || 'field';
            return `      ${fieldName}: this.${fieldName},`;
          })
          .join('\n')
      : '      // mappe ici les propriétés du modèle vers les colonnes de ta table';

  return `
/****
 * Modèle généré pour ${name}
${fieldsComment ? '\n' + fieldsComment : ''}
 *
 * Fournit :
 *   - constructeur à partir d'un objet data
 *   - ${name}.fromRow(row) : mapping SQL -> modèle
 *   - .toRow() : mapping modèle -> SQL row
 */
class ${name} {
  /**
   * @param {Object} data
${fieldsComment ? fieldsComment.replace(/^/gm, '   ') : ''}
   */
  constructor(data = {}) {
${assignments}
  }

  /**
   * Construit une instance de ${name} à partir d'une ligne de base de données.
   * @param {Object} row
   * @returns {${name}}
   */
  static fromRow(row = {}) {
    return new ${name}({
${fromRowBody}
    });
  }

  /**
   * Sérialise ce modèle vers un objet "row" prêt à être utilisé dans une requête SQL.
   * @returns {Object}
   */
  toRow() {
    return {
${toRowBody}
    };
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
  const tableName = toKebabCase(routeName);

  const entityImport = entityName
    ? `const ${entityName} = require('../models/${entityName}');\n`
    : '';

  const entityFields = Array.isArray(entity?.fields) ? entity.fields : [];
  const hasIdField = entityFields.some((f) => f.name === 'id');
  const nonIdFields = entityFields.filter((f) => f.name && f.name !== 'id');

  const insertColumns = nonIdFields.map((f) => f.name);
  const updateColumns = nonIdFields.map((f) => f.name);

  const hasInsertColumns = insertColumns.length > 0;
  const hasUpdateColumns = updateColumns.length > 0;

  const orderByColumn = hasIdField ? 'id' : '1';

  const insertSql = hasInsertColumns
    ? `'INSERT INTO ${tableName} (${insertColumns.join(', ')}) VALUES (${insertColumns
        .map((_, i) => '$' + (i + 1))
        .join(', ')}) RETURNING *'`
    : `'INSERT INTO ${tableName} (col1, col2) VALUES ($1, $2) RETURNING *'`;

  const insertValues = hasInsertColumns
    ? `[${insertColumns.map((c) => `payload.${c}`).join(', ')}]`
    : `[payload.col1, payload.col2]`;

  const updateSql = hasUpdateColumns
    ? `'UPDATE ${tableName} SET ${updateColumns
        .map((c, i) => `${c} = $${i + 1}`)
        .join(', ')} WHERE id = $${updateColumns.length + 1} RETURNING *'`
    : `'UPDATE ${tableName} SET col1 = $1, col2 = $2 WHERE id = $3 RETURNING *'`;

  const updateValues = hasUpdateColumns
    ? `[${updateColumns.map((c) => `payload.${c}`).join(', ')}, id]`
    : `[payload.col1, payload.col2, id]`;

  const deleteSql = hasIdField
    ? `'DELETE FROM ${tableName} WHERE id = $1 RETURNING *'`
    : `'DELETE FROM ${tableName} WHERE /* adapte la colonne de clé primaire */ id = $1 RETURNING *'`;

  return `
const { getPool } = require('../config/database');
${entityImport}/**
 * Service généré pour ${routeName}
 *
 * Cette classe encapsule la logique métier et l'accès à la base PostgreSQL.
 * Tu peux l'utiliser telle quelle comme base, puis adapter au besoin.
 */
class ${serviceName} {
  constructor() {
    this.pool = getPool();
  }

  /**
   * Récupérer toutes les lignes de ${tableName}, avec pagination simple.
   * @param {Object} options
   * @param {number} [options.limit=50]
   * @param {number} [options.offset=0]
   */
  async findAll(options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await this.pool.query(
      'SELECT * FROM ${tableName} ORDER BY ${orderByColumn} LIMIT $1 OFFSET $2',
      [limit, offset]
    );
${
  entityName
    ? `    return result.rows.map((row) => ${entityName}.fromRow(row));`
    : '    return result.rows;'
}
  }

  /**
   * Récupérer une ligne par ID.
   * @param {string|number} id
   */
  async findById(id) {
    const result = await this.pool.query(
      'SELECT * FROM ${tableName} WHERE id = $1',
      [id]
    );
    const row = result.rows[0] || null;
${
  entityName
    ? `    return row ? ${entityName}.fromRow(row) : null;`
    : '    return row;'
}
  }

  /**
   * Créer une nouvelle ressource.
   * @param {Object} payload
   */
  async create(payload) {
    // 💡 Tu peux ajouter ici une validation (zod / joi / yup, etc.)
    // avant d'insérer en base.

    const text = ${insertSql};
    const values = ${insertValues};

    const result = await this.pool.query(text, values);
${
  entityName
    ? `    return ${entityName}.fromRow(result.rows[0]);`
    : '    return result.rows[0];'
}
  }

  /**
   * Mettre à jour une ressource existante.
   * @param {string|number} id
   * @param {Object} payload
   */
  async update(id, payload) {
    // 💡 Même idée ici : ajoute une validation et/ou une logique métier
    // avant de persister les changements.

    const text = ${updateSql};
    const values = ${updateValues};

    const result = await this.pool.query(text, values);
${
  entityName
    ? `    return result.rows[0] ? ${entityName}.fromRow(result.rows[0]) : null;`
    : '    return result.rows[0] || null;'
}
  }

  /**
   * Supprimer une ressource.
   * @param {string|number} id
   */
  async remove(id) {
    const text = ${deleteSql};
    const values = [id];

    const result = await this.pool.query(text, values);
${
  entityName
    ? `    return result.rows[0] ? ${entityName}.fromRow(result.rows[0]) : null;`
    : '    return result.rows[0] || null;'
}
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

  // Handlers définis dans le plan IA (loginHandler, registerHandler, etc.)
  const handlersFromPlan = new Set(
    endpoints
      .map((e) => e.handler)
      .filter(Boolean)
      .map((h) => String(h).trim())
  );

  // Handlers CRUD par défaut
  const defaultHandlers = [
    'getAll',
    'getOne',
    'create',
    'update',
    'remove',
  ];

  const handlerNames =
    handlersFromPlan.size > 0 ? Array.from(handlersFromPlan) : defaultHandlers;

  const knownCrud = new Set(['getAll', 'getOne', 'create', 'update', 'remove']);

  const methodsCode = handlerNames
    .map((handler) => {
      const methodName = toCamelCase(handler);

      // Handlers CRUD avec logique prête à l'emploi
      if (knownCrud.has(methodName)) {
        if (methodName === 'getAll') {
          return `
  /**
   * GET /resource
   * Récupération paginée des ressources.
   * Query params : ?limit=50&amp;offset=0
   */
  async ${methodName}(req, res, next) {
    try {
      const limitRaw = req.query.limit;
      const offsetRaw = req.query.offset;

      const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;
      const offset = offsetRaw ? parseInt(offsetRaw, 10) : undefined;

      const data = await ${serviceName}.findAll({
        limit: Number.isFinite(limit) ? limit : undefined,
        offset: Number.isFinite(offset) ? offset : undefined,
      });

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }`;
        }

        if (methodName === 'getOne') {
          return `
  /**
   * GET /resource/:id
   * Récupération d'une ressource par ID.
   */
  async ${methodName}(req, res, next) {
    try {
      const { id } = req.params;
      const data = await ${serviceName}.findById(id);

      if (!data) {
        return res.status(404).json({ error: 'Ressource introuvable' });
      }

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }`;
        }

        if (methodName === 'create') {
          return `
  /**
   * POST /resource
   * Création d'une ressource.
   */
  async ${methodName}(req, res, next) {
    try {
      const payload = req.body;

      // 💡 Ajoute ici une validation (zod / joi / yup / class-validator...)
      // avant d'appeler le service.
      const created = await ${serviceName}.create(payload);

      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }`;
        }

        if (methodName === 'update') {
          return `
  /**
   * PUT/PATCH /resource/:id
   * Mise à jour d'une ressource.
   */
  async ${methodName}(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;

      // 💡 Même principe : tu peux ajouter une validation ici.
      const updated = await ${serviceName}.update(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Ressource introuvable' });
      }

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }`;
        }

        if (methodName === 'remove') {
          return `
  /**
   * DELETE /resource/:id
   * Suppression d'une ressource.
   */
  async ${methodName}(req, res, next) {
    try {
      const { id } = req.params;
      const removed = await ${serviceName}.remove(id);

      if (!removed) {
        return res.status(404).json({ error: 'Ressource introuvable' });
      }

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }`;
        }
      }

      // Handlers non-CRUD ou custom du plan IA : squelette générique
      return `
  /**
   * Handler généré pour ${methodName}.
   * Implémente ici la logique métier spécifique.
   */
  async ${methodName}(req, res, next) {
    try {
      // TODO: implémente la logique métier pour ${methodName}
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

Ce backend est une base solide pour démarrer rapidement une API Node.js/Express
connectée à PostgreSQL, avec une structure inspirée des bonnes pratiques
(services, contrôleurs, routes, configuration, etc.).

## Stack technique

- ${stack}
- Express.js
- PostgreSQL (via \`pg\`)
- JWT pour l'authentification
- Docker (optionnel) pour la base de données
- Fichiers de service + contrôleur + modèles générés par ressource

## Structure générée (exemple)

\`\`\`
src/
  config/
    database.js      # Connexion PostgreSQL + init
    auth.js          # JWT + middleware d'authentification
  models/
    *.js             # Modèles avec fromRow()/toRow()
  services/
    *.js             # Logique métier + accès DB (CRUD)
  controllers/
    *.js             # Contrôleurs Express (handlers)
  routes/
    *.js             # Fichiers de routes par ressource
    index.js         # Agrégation des routes
  server.js          # Point d'entrée Express

.env.example          # Exemple de configuration
docker-compose.yml    # Postgres prêt à l'emploi
BACKEND_README.md     # Ce fichier
\`\`\`

## Démarrage

1. Copie les fichiers générés dans un dossier de projet.
2. Duplique \`.env.example\` en \`.env\` et adapte les valeurs (PORT, DATABASE_URL, JWT_SECRET, etc.).
3. (Optionnel) Lance PostgreSQL avec Docker :

   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. Installe les dépendances nécessaires :

   \`\`\`bash
   npm install express cors morgan pg jsonwebtoken dotenv
   \`\`\`

5. Démarre le serveur :

   \`\`\`bash
   node src/server.js
   \`\`\`

## Personnalisation

- Mets à jour les modèles dans \`src/models\` si ton schéma de base de données est différent.
- Adapte les requêtes SQL dans les services (\`src/services\`) en fonction de ta structure réelle de tables.
- Ajoute ou modifie des routes et des contrôleurs selon tes besoins métier.
- Tu peux enrichir ce backend avec des middlewares supplémentaires (validation, logs avancés, rôles, etc.).

CODEFLOW-AI te fournit une base structurée : à toi d'y ajouter ta logique métier ✨
`.trimStart();
}

/**
 * Fonction principale : transformer un "plan" IA en fichiers concrets
 * Retourne un tableau de { path, content }
 */
function generateFilesFromPlan(plan = {}) {
  if (plan.mode === 'frontend') {
    return generateFrontendFiles(plan);
  }
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

function generateFrontendFiles(plan = {}) {
  const files = [];

  // Récupérer quelques infos du plan pour personnaliser un peu
  const appDescription = plan.description || plan.title || 'Dashboard SaaS généré avec CODEFLOW-AI';
  const pagesFromPlan = Array.isArray(plan.pages) ? plan.pages : [];

  // Pages par défaut si l'IA n’a pas tout rempli
  const defaultPages = [
    {
      name: 'Home',
      path: '/',
      title: 'Accueil',
      description: "Vue d’ensemble de ton application SaaS",
      kind: 'landing',
    },
    {
      name: 'Projects',
      path: '/projects',
      title: 'Projets',
      description: 'Liste et suivi de tes projets',
      kind: 'app',
    },
    {
      name: 'Settings',
      path: '/settings',
      title: 'Paramètres',
      description: 'Configuration du compte et de l’application',
      kind: 'app',
    },
  ];

  const pages = pagesFromPlan.length ? pagesFromPlan : defaultPages;

  // Couleurs / design
  const primaryColor = plan.design?.primaryColor || '#6366f1'; // indigo-500
  const accentColor = plan.design?.accentColor || '#f97316'; // orange-500

  // 1) index.html avec GSAP en CDN pour les animations
  files.push({
    path: 'index.html',
    content: `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appDescription}</title>
    <meta name="description" content="${appDescription}" />
    <!-- Font & base styles -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap"
      rel="stylesheet"
    />
    <!-- GSAP CDN pour les animations -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
  </head>
  <body class="bg-slate-950 text-slate-50">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`.trim(),
  });

  // 2) Config Vite + Tailwind + PostCSS
  files.push({
    path: 'vite.config.js',
    content: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
`.trim(),
  });

  files.push({
    path: 'postcss.config.js',
    content: `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`.trim(),
  });

  files.push({
    path: 'tailwind.config.js',
    content: `
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '${primaryColor}',
          accent: '${accentColor}',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15,23,42,0.7)',
      },
    },
  },
  plugins: [],
};
`.trim(),
  });

  // 3) Global CSS (scrollbars, background, etc.)
  files.push({
    path: 'src/styles/global.css',
    content: `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html,
body,
#root {
  height: 100%;
}

body {
  @apply bg-slate-950 text-slate-50 antialiased;
}

/* Scrollbar custom */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #020617;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

/* Cards et effets utilitaires */
.app-glass {
  @apply bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl shadow-soft;
}

.app-badge {
  @apply inline-flex items-center rounded-full bg-slate-900/70 border border-slate-700/80 px-3 py-1 text-xs font-medium text-slate-200;
}

.app-pill {
  @apply inline-flex items-center rounded-full bg-brand-accent/10 text-brand-accent px-3 py-1 text-xs font-medium;
}
`.trim(),
  });

  // 4) main.jsx avec React Router
  files.push({
    path: 'src/main.jsx',
    content: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
`.trim(),
  });

  // 5) Fichier de config des pages (dérivé du plan)
  const normalizedPages = pages.map((p) => {
    const path = p.path || '/';
    const name = p.name || 'Page';
    const title = p.title || name || 'Page';

    const lowerPath = String(path).toLowerCase();
    const lowerName = String(name).toLowerCase();

    let kind = p.kind;
    if (!kind) {
      if (
        lowerPath === '/' ||
        lowerPath === '/home' ||
        lowerPath === '/dashboard'
      ) {
        kind = 'landing';
      } else if (
        lowerPath.includes('param') ||
        lowerName.includes('param')
      ) {
        kind = 'settings';
      } else if (
        lowerPath.includes('projet') ||
        lowerPath.includes('project') ||
        lowerName.includes('projet') ||
        lowerName.includes('project')
      ) {
        kind = 'projects';
      } else {
        kind = 'app';
      }
    }

    let defaultDescription;
    if (kind === 'settings') {
      defaultDescription =
        'Préférences du compte, notifications et sécurité.';
    } else if (kind === 'projects') {
      defaultDescription =
        'Liste et gestion de vos projets en cours.';
    } else if (kind === 'landing' || kind === 'dashboard') {
      defaultDescription =
        'Vue d’ensemble de votre tableau de bord et de vos indicateurs clés.';
    } else {
      defaultDescription =
        'Section générée automatiquement avec du contenu prêt à l’emploi.';
    }

    const rawDesc = (p.description || '').trim();
    const isPlaceholder =
      !rawDesc ||
      /remplace ce contenu/i.test(rawDesc) ||
      /replace this content/i.test(rawDesc) ||
      /add your components/i.test(rawDesc);

    const description = isPlaceholder ? defaultDescription : rawDesc;

    return {
      name,
      path,
      title,
      description,
      kind,
    };
  });

  files.push({
    path: 'src/config/pages.js',
    content: `
export const pages = ${JSON.stringify(normalizedPages, null, 2)};
`.trim(),
  });

  // 6) Composants UI basiques (KPI, SectionCard)
  files.push({
    path: 'src/components/ui/KpiCard.jsx',
    content: `
export function KpiCard({ label, value, helper }) {
  return (
    <div className="app-glass rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-50">{value}</span>
      {helper ? (
        <span className="text-xs text-slate-400 mt-1">{helper}</span>
      ) : null}
    </div>
  );
}
`.trim(),
  });

  files.push({
    path: 'src/components/ui/SectionCard.jsx',
    content: `
export function SectionCard({ title, description, children, badge }) {
  return (
    <section className="app-glass rounded-2xl p-6 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          {description ? (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          ) : null}
        </div>
        {badge ? <span className="app-badge">{badge}</span> : null}
      </header>
      <div className="mt-2">{children}</div>
    </section>
  );
}
`.trim(),
  });

  // 7) Petit hook d’animation avec GSAP global (via CDN)
  files.push({
    path: 'src/hooks/useGsapFadeIn.js',
    content: `
import { useEffect, useRef } from 'react';

export function useGsapFadeIn(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // On utilise window.gsap injecté par le CDN dans index.html
    if (typeof window !== 'undefined' && window.gsap) {
      window.gsap.fromTo(
        el,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: options.duration || 0.7,
          delay: options.delay || 0,
          ease: options.ease || 'power3.out',
        },
      );
    }
  }, [options.duration, options.delay, options.ease]);

  return ref;
}
`.trim(),
  });

  // UI Builder simple preview
  files.push({
    path: 'src/ui-builder/Preview.jsx',
    content: `
import { HomePage } from '../pages/HomePage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * UI Builder Preview
 *
 * Ce composant te permet de visualiser rapidement les blocs
 * générés (home, projets, paramètres) dans une même vue.
 * Tu peux le brancher à un onglet "UI Builder" dans ton SaaS.
 */
export function Preview() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400">
        <p className="font-semibold text-slate-100 text-sm mb-1">
          UI Builder – Aperçu des blocs
        </p>
        <p>
          Cette page regroupe plusieurs sections pour te permettre de
          parcourir rapidement le rendu de ton UI généré.
        </p>
      </div>
      <HomePage />
      <ProjectsPage />
      <SettingsPage />
    </div>
  );
}
`.trim(),
  });

  // 8) Layout complet (Sidebar + Topbar + zone de contenu)
  files.push({
    path: 'src/components/layout/Sidebar.jsx',
    content: `
import { NavLink } from 'react-router-dom';
import { pages } from '../../config/pages';

const baseClasses =
  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150';
const inactiveClasses =
  'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80';
const activeClasses =
  'text-slate-50 bg-brand-primary/90 shadow-soft shadow-brand-primary/30';

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 h-full border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-slate-800/70">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-xs font-black tracking-tight">
          CF
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-50">
            CODEFLOW-AI
          </span>
          <span className="text-xs text-slate-400">
            Frontend généré
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {pages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              [
                baseClasses,
                isActive ? activeClasses : inactiveClasses,
              ].join(' ')
            }
          >
            <span className="h-2 w-2 rounded-full bg-brand-accent/80" />
            <span>{page.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-800/70 text-xs text-slate-500">
        <p>Généré par CODEFLOW-AI ✨</p>
      </div>
    </aside>
  );
}
`.trim(),
  });

  files.push({
    path: 'src/components/layout/Topbar.jsx',
    content: `
import { useLocation } from 'react-router-dom';
import { pages } from '../../config/pages';

export function Topbar() {
  const location = useLocation();
  const current =
    pages.find((p) => p.path === location.pathname) || pages[0];

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="app-pill text-xs">
            {current.kind === 'landing' ? 'Overview' : 'Module'}
          </span>
          <h1 className="text-lg md:text-xl font-semibold text-slate-50">
            {current.title}
          </h1>
        </div>
        {current.description ? (
          <p className="text-xs md:text-sm text-slate-400">
            {current.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live preview
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-soft hover:bg-brand-primary/90">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
          Sauvegarder
        </button>
      </div>
    </header>
  );
}
`.trim(),
  });

  files.push({
    path: 'src/components/layout/AppLayout.jsx',
    content: `
export function AppLayout({ children }) {
  return (
    <div className="h-screen w-full flex bg-slate-950 text-slate-50">
      {children}
    </div>
  );
}
`.trim(),
  });

  // 9) Pages complètes

  files.push({
    path: 'src/pages/HomePage.jsx',
    content: `
import { useGsapFadeIn } from '../hooks/useGsapFadeIn';
import { KpiCard } from '../components/ui/KpiCard';
import { SectionCard } from '../components/ui/SectionCard';

export function HomePage() {
  const heroRef = useGsapFadeIn({ delay: 0.1 });
  const statsRef = useGsapFadeIn({ delay: 0.2 });
  const sectionsRef = useGsapFadeIn({ delay: 0.3 });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-6">
        {/* Hero */}
        <section
          ref={heroRef}
          className="app-glass rounded-3xl px-5 py-6 md:px-7 md:py-7 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center"
        >
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="app-pill">
                Dashboard généré automatiquement
              </span>
              <span className="app-badge">
                Frontend React + Vite + Tailwind
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
              Construis ton interface SaaS en quelques secondes.
            </h2>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl">
              Cette interface a été générée à partir d&apos;une simple
              description. Personnalise les sections, branche-la à ton
              API, et déploie ton produit plus vite que jamais.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <button className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-slate-50 shadow-soft hover:bg-brand-primary/90">
                Commencer à personnaliser
              </button>
              <button className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500">
                Voir la structure du code
              </button>
            </div>
          </div>

          <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3">
            <div className="app-glass rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-50">
                Génération intelligente
              </p>
              <p>
                CODEFLOW-AI analyse ta description pour proposer une
                structure de pages, des sections, et des composants
                adaptés à ton cas d&apos;usage.
              </p>
              <p className="text-[11px] text-slate-500">
                Modifie ce contenu à ta guise, ou utilise-le comme point
                de départ pour ton design final.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            label="Projets actifs"
            value="12"
            helper="Basé sur les données de ton API (exemple statique)."
          />
          <KpiCard
            label="Tâches complétées"
            value="87%"
            helper="Tu peux brancher cette métrique sur un endpoint réel."
          />
          <KpiCard
            label="Temps moyen / sprint"
            value="2.4 j"
            helper="Parfait pour un tableau de bord produit / tech."
          />
        </section>

        {/* Sections */}
        <section
          ref={sectionsRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <SectionCard
            title="Vue Kanban"
            description="Visualise rapidement tes tâches par colonne."
            badge="Module Projets"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-slate-300">
                  À faire
                </p>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>Créer la page d&apos;onboarding</li>
                  <li>Configurer les permissions</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-slate-300">
                  En cours
                </p>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>Mettre à jour le dashboard</li>
                  <li>Brancher l&apos;API projets</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-slate-300">
                  Terminé
                </p>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>Mise en place du design système</li>
                  <li>Configuration de l&apos;authentification</li>
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Timeline d’activité"
            description="Un feed d’événements pour suivre ce qui se passe sur l’app."
            badge="Activité"
          >
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Nouveau projet créé (exemple statique).
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                3 tâches complétées aujourd’hui.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                1 sprint en retard.
              </li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Section pricing"
            description="Parfaite pour un SaaS avec plusieurs plans."
            badge="Monétisation"
          >
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-50 text-sm">
                    Starter
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Idéal pour tester l’app.
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-50">
                  9€ /mois
                </span>
              </div>
              <div className="rounded-2xl border border-brand-primary/60 bg-brand-primary/10 px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-50 text-sm">
                    Pro
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Pour les équipes en croissance.
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-50">
                  29€ /mois
                </span>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}
`.trim(),
  });

  files.push({
    path: 'src/pages/ProjectsPage.jsx',
    content: `
import { useGsapFadeIn } from '../hooks/useGsapFadeIn';
import { SectionCard } from '../components/ui/SectionCard';

export function ProjectsPage() {
  const listRef = useGsapFadeIn({ delay: 0.1 });

  const projects = [
    { id: 1, name: 'Refonte site marketing', status: 'En cours' },
    { id: 2, name: 'Dashboard interne BI', status: 'En préparation' },
    { id: 3, name: 'Onboarding SaaS', status: 'Terminé' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
        <SectionCard
          title="Projets"
          description="Une liste de projets simple, à connecter à ton backend."
          badge="Module Projets"
        >
          <div
            ref={listRef}
            className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden text-sm"
          >
            <div className="grid grid-cols-3 px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-800/80">
              <span>Nom</span>
              <span>Statut</span>
              <span className="text-right pr-2">Actions</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-3 px-3 py-2 text-xs md:text-sm text-slate-200 hover:bg-slate-900/60"
                >
                  <span>{project.name}</span>
                  <span className="text-slate-400">{project.status}</span>
                  <span className="text-right pr-2">
                    <button className="inline-flex items-center rounded-lg border border-slate-700/80 px-2 py-1 text-[11px] hover:border-slate-500">
                      Ouvrir
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
`.trim(),
  });

  files.push({
    path: 'src/pages/SettingsPage.jsx',
    content: `
import { useGsapFadeIn } from '../hooks/useGsapFadeIn';
import { SectionCard } from '../components/ui/SectionCard';

export function SettingsPage() {
  const ref = useGsapFadeIn({ delay: 0.1 });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-4">
        <SectionCard
          title="Paramètres du compte"
          description="Exemple de formulaire à connecter à ton backend."
          badge="Compte"
        >
          <form
            ref={ref}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm"
          >
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Nom complet</label>
              <input
                type="text"
                placeholder="Ton nom"
                className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/80"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Email</label>
              <input
                type="email"
                placeholder="ton@mail.com"
                className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/80"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Langue</label>
              <select className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary/80">
                <option>Français</option>
                <option>Anglais</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Fuseau horaire</label>
              <select className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary/80">
                <option>Europe/Paris</option>
                <option>UTC</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button className="inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-xs md:text-sm font-semibold text-slate-50 shadow-soft hover:bg-brand-primary/90">
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </SectionCard>
      </main>
    </div>
  );
}
`.trim(),
  });

  // Page de connexion (Login)
  files.push({
    path: 'src/pages/LoginPage.jsx',
    content: `
import { useGsapFadeIn } from '../hooks/useGsapFadeIn';

export function LoginPage() {
  const ref = useGsapFadeIn({ delay: 0.05 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div
        ref={ref}
        className="app-glass max-w-md w-full rounded-3xl px-6 py-7 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span className="app-pill text-[11px] w-fit">Accès sécurisé</span>
          <h1 className="text-xl font-semibold text-slate-50">
            Connexion à ton dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Utilise cette page comme base pour brancher ton système
            d&apos;authentification (JWT, sessions, etc.).
          </p>
        </div>

        <form className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-slate-300">Adresse e-mail</label>
            <input
              type="email"
              placeholder="toi@exemple.com"
              className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/80"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-300">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/80"
            />
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-slate-50 shadow-soft hover:bg-brand-primary/90"
          >
            Se connecter
          </button>

          <p className="text-[11px] text-slate-500 mt-1">
            Astuce: branche ce formulaire à ton endpoint /auth/login
            généré côté backend par CODEFLOW-AI.
          </p>
        </form>
      </div>
    </div>
  );
}
`.trim(),
  });

  // Page 404 / Not Found
  files.push({
    path: 'src/pages/NotFoundPage.jsx',
    content: `
import { Link } from 'react-router-dom';
import { useGsapFadeIn } from '../hooks/useGsapFadeIn';

export function NotFoundPage() {
  const ref = useGsapFadeIn({ delay: 0.05 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div
        ref={ref}
        className="app-glass max-w-lg w-full rounded-3xl px-6 py-7 flex flex-col gap-4 items-center text-center"
      >
        <span className="app-pill text-[11px]">Erreur 404</span>
        <h1 className="text-2xl font-semibold text-slate-50">
          Page introuvable
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-sm">
          Cette route n&apos;a pas encore été configurée dans le frontend
          généré. Tu peux soit l&apos;ajouter dans App.jsx, soit rediriger
          l&apos;utilisateur vers le dashboard principal.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-slate-50 shadow-soft hover:bg-brand-primary/90"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
`.trim(),
  });

  // 10) App.jsx qui branche tout ça (layout + routes)
  files.push({
    path: 'src/App.jsx',
    content: `
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Preview as UiBuilderPreview } from './ui-builder/Preview';

export default function App() {
  return (
    <AppLayout>
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col h-full">
        <Topbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Route spéciale pour le mode UI Builder */}
          <Route path="/__ui-builder" element={<UiBuilderPreview />} />
          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AppLayout>
  );
}
`.trim(),
  });

  return files;
}

module.exports = {
  generateFilesFromPlan,
  generateFrontendFiles,
};