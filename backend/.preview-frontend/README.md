# Frontend React généré avec CODEFLOW-AI

Ce dossier contient un frontend **React + Vite + TailwindCSS** généré automatiquement à partir d'une simple description.

- **Stack** : react-vite-tailwind
- **Description** : Espace client SaaS pour la gestion des comptes et des paramètres

## 🚀 Démarrage rapide

1. Installe les dépendances :
   ```bash
   npm install
   ```
2. Configure les variables d'environnement :
   ```bash
   cp .env.example .env
   ```
   Puis adapte l'URL de ton backend dans `.env`.
3. Lance le serveur de dev :
   ```bash
   npm run dev
   ```
L'application démarre par défaut sur `http://localhost:5173`.

## 🧱 Architecture générée
- Entrée Vite : `index.html`
- App React : `src/main.jsx`, `src/App.jsx`
- Layout global : `src/components/Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx`
- Pages : `src/pages/*.jsx`
- Client HTTP : `src/lib/apiClient.js` (préconfiguré avec axios et `VITE_API_URL`)
- Styles : `src/index.css`, `tailwind.config.js`, `postcss.config.js`

## 🌐 Pages générées
- `/login` → Login
- `/profil` → Profil
- `/parametres` → Paramètres

---
Tu peux maintenant :
- Personnaliser le layout (Sidebar, Topbar, Layout),
- Adapter les pages générées à ton cas métier,
- Connecter ce frontend à un backend Node/Express (ou autre) via `src/lib/apiClient.js`,
- Ajouter tes propres composants UI, formulaires, graphiques, etc., en t'appuyant sur l'API.
