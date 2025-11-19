# 📜 CodeFlow AI — CHANGELOG
Suivi des évolutions majeures du projet.  
Format utilisé : *Keep a Changelog* enrichi et adapté au workflow IA.

---

## [0.2.0] — Backend Génération V2 (Ultra‑Solide)
**Date :** 19 novembre 2025

### 🚀 Améliorations majeures
- Génération backend totalement réécrite :
  - architecture **Express modulaire** (routes / controllers / services / models / utils)
  - génération automatique de fichiers complets (CRUD, validations, erreurs)
  - modèles enrichis : champs par défaut, typage JS, commentaires dev-friendly
  - services auto‑documentés avec logique prête à étendre
  - contrôleurs structurés, blocs try/catch et réponses normalisées
  - routes REST complètes (GET / POST / PUT / DELETE)
- Ajout d’un générateur de README automatique basé sur le projet généré
- Ajout du système **refactor-file** :
  - l’IA modifie un seul fichier sans effacer le reste
  - merge intelligent du nouveau code avec l’existant
  - identité du fichier analysée et préservée
- Meilleure protection contre la suppression accidentelle de code

### 🔧 Stabilisation & Robustesse
- Parsing Groq totalement sécurisé
- Nettoyage de la logique JSON + fallback Markdown → JSON
- Séparation claire des responsabilités dans `codegenService.js`
- Normalisation des réponses API

---

## [0.1.2] — Nouvelle UI façon VSCode
### 🎨 Interface
- Sidebar avec structure de fichiers + icônes (JS, JSON, dossier…)
- Intégration de **Monaco Editor** avec thème Dark+
- Ouverture/fermeture dynamique des fichiers générés
- Ligne d’état affichant :  
  _“Tu modifies : src/routes/users.js”_ lorsque l'éditeur IA est actif

### ⚡ Interaction IA améliorée
- Ajout du mode :  
  **« continue la conversation avec le projet »**
- Deux champs séparés :
  - description backend
  - instruction d’édition du fichier ciblé

---

## [0.1.1] — Améliorations IA & UI initiales
### 🎯 Moteur IA
- Reconstruction du plan backend plus propre
- Ajout de la validation JSON multi-niveaux
- Gestion avancée des entités

### 🎨 UI
- Integration images / visuels dans l’interface
- Palette accordée au logo

---

## [0.1.0] — Bêta publique initiale
**Date :** 17 novembre 2025  
Version fondatrice du projet CodeFlow AI.

### Fonctionnalités initiales
- Génération backend simple (routes + fichiers basiques)
- Interface React/Vite
- Copie des fichiers générés
- Moteur Groq branché pour les prompts backend
- Monorepo backend + frontend

---

## 🔮 Roadmap
- Génération frontend (React / Next.js / Tailwind)
- Génération full-stack synchronisée backend ↔ frontend
- Export ZIP complet
- Déploiement automatique (Docker + Render + GitHub Actions)
- Mode collaboratif en temps réel
- Marketplace de presets prêts à l’emploi

---

## 📌 Notes
CodeFlow AI évolue très vite.  
Chaque mise à jour intègre :
- plus de puissance IA,
- plus de fiabilité dans le code généré,
- plus de logique prête pour un vrai projet pro.