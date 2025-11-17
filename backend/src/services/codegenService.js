// src/services/codegenService.js

function generateFilesFromPlan(plan) {
    // Ici tu peux faire des templates plus complexes,
    // pour l’instant on fait un truc simple.
  
    const files = [];
  
    // Exemple : server.js
    files.push({
      path: "src/server.js",
      content: `
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.json({ message: 'API générée par CODEFLOW-AI 🚀' });
  });
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
  `.trimStart(),
    });
  
    // Exemple : routes todos si ton plan contient une route "Todos"
    const hasTodoRoute = (plan.routes || []).some(
      (r) => r.name && r.name.toLowerCase() === "todos"
    );
  
    if (hasTodoRoute) {
      files.push({
        path: "src/routes/todos.js",
        content: `
  const express = require('express');
  const router = express.Router();
  
  // GET /todos
  router.get('/', (req, res) => {
    res.json([{ id: 1, title: 'Todo générée', done: false }]);
  });
  
  // POST /todos
  router.post('/', (req, res) => {
    const todo = req.body;
    // ici tu ferais un insert en DB
    res.status(201).json({ ...todo, id: 2 });
  });
  
  module.exports = router;
  `.trimStart(),
      });
    }
  
    return files;
  }
  
  module.exports = {
    generateFilesFromPlan,
  };