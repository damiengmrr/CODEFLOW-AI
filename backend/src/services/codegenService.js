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