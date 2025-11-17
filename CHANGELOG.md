# 📜 CodeFlow AI — CHANGELOG
Suivi des évolutions majeures du projet.  
Format utilisé : *Keep a Changelog* amélioré.

---

## [0.1.0] — Bêta publique initiale
**Date :** 17 novembre 2025

### 🎉 Nouveautés
- Création du monorepo `CODEFLOW-AI` (backend + frontend)
- Intégration complète du moteur IA basé sur Groq
- Ajout de la route `/api/generate` pour générer des architectures backend
- Génération de dossiers structurés dans `backend/generated/<project>/`
- Interface frontend permettant :
  - la saisie d’un prompt
  - l’affichage des entités générées
  - la visualisation et copie des fichiers générés
- Mise en place d’un design simple avec zones dédiées aux images et illustrations

### 🛠 Infrastructure
- Backend Express configuré et stable
- Frontend React + Vite opérationnel
- `.env` avec variables propres (GROQ_API_KEY…)

---

## [0.1.1] — Améliorations UI & Génération
**En cours**

### 🔥 Améliorations prévues
- Refonte de l’interface pour une expérience plus moderne
- Intégration d’un thème graphique basé sur la palette du logo
- Ajout des images explicatives dans les zones dédiées
- Mise en place d’un affichage plus dynamique des fichiers générés

### 🧠 Moteur IA
- Amélioration du parsing JSON pour une génération plus fiable
- Meilleur support des prompts full-stack

---

## 🔮 À venir (Roadmap)
- Génération complète de frontend (React, Next.js…)
- Génération d’un ZIP téléchargeable automatiquement
- Interface façon IDE (explorateur + éditeur intégré)
- Système de presets (API, SaaS, e-commerce…)
- Génération Dockerfile + docker-compose
- Export direct vers GitHub
- Collaboration temps réel

---

## 📌 Notes
Ce changelog évoluera à chaque mise à jour du projet.  
CodeFlow AI étant en **développement constant**, des modifications fréquentes sont prévues.