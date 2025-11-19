   _____ ____  _____  ______ ______ _      ______          __           _____ 
  / ____/ __ \|  __ \|  ____|  ____| |    / __ \ \        / /     /\   |_   _|
 | |   | |  | | |  | | |__  | |__  | |   | |  | \ \  /\  / /     /  \    | |  
 | |   | |  | | |  | |  __| |  __| | |   | |  | |\ \/  \/ /     / /\ \   | |  
 | |___| |__| | |__| | |____| |    | |___| |__| | \  /\  /     / ____ \ _| |_ 
  \_____\____/|_____/|______|_|    |______\____/   \/  \/     /_/    \_\_____|
                                                                              

# 🚀 CodeFlow AI — Version Bêta Avancée

![CodeFlow Logo](./frontend/public/images/codeflow-logo.png)

<p align="left">
  <img src="https://img.shields.io/badge/version-Beta_0.2-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Backend_Generator-Operational-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/Refactor_Engine-Active-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Powered_by-Groq_AI-blue?style=flat-square" />
</p>

CodeFlow AI est un générateur de code IA en **version bêta avancée**, conçu pour créer, modifier et améliorer des architectures backend **à partir d’une simple phrase**.  
Cette version introduit une génération professionnelle des fichiers backend ainsi qu’un moteur d’édition intelligente permettant de modifier n’importe quel fichier sans jamais casser le code existant.

---

# 🎯 Vision de CodeFlow AI

CodeFlow AI a été imaginé comme un véritable **assistant développeur IA** :

- Comprendre une demande en langage naturel.  
- Générer une architecture professionnelle et cohérente.  
- Produire du code propre, organisé et commenté.  
- Permettre à l'utilisateur de modifier un fichier existant via une simple instruction.  
- (Bientôt) Générer un ZIP complet du projet.  
- (Bientôt) Générer aussi le frontend.  
- (Objectif final) Générer un projet full‑stack entier en une seule phrase.

> **Créer une application complète, en quelques secondes, sans quitter CodeFlow.**

---

# 🧠 Capacités actuelles — État réel de la bêta

## 🔹 1. Génération automatique d’un backend complet

À partir d’un prompt comme :  
> “Crée une API Node.js Express avec authentification JWT, CRUD utilisateurs et base PostgreSQL.”

L’IA génère :

### ✔️ Une arborescence professionnelle
```
src/
 ├── config/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── server.js
```

### ✔️ Des fichiers complets prêts à être utilisés  
- `server.js` (Express, CORS, logger, autoload routes)  
- Config JWT  
- Config base de données  
- Modèles (selon les entités identifiées)  
- Services CRUD complets  
- Controllers propres avec gestion des erreurs  
- Routes mappées automatiquement  
- Docker-compose (PostgreSQL)  
- `.env.example`  
- README backend généré automatiquement  

Le code est **propre, modulaire et cohérent**.

---

## 🔹 2. Moteur “Refactor File” — Modifier un fichier existant par IA

L’endpoint `/api/generate/refactor-file` permet :

- d’éditer un fichier existant,  
- sans jamais supprimer le code présent,  
- en ajoutant uniquement ce qui est demandé,  
- en respectant la syntaxe du projet,  
- en produisant un résultat propre.

Exemple d’instruction :  
> “Ajoute une route GET /users qui renvoie un tableau JSON, sans supprimer le code existant.”

---

## 🔹 3. Édition type VSCode dans le frontend

Le frontend propose déjà :

- un explorateur de fichiers avec icônes (dossiers, JS, JSON…)  
- un éditeur intégré (Monaco Editor)  
- sélection d’un fichier → affichage du contenu  
- mode édition IA :  
  - “Tu modifies : src/routes/users.js”  
  - champ instruction séparé du prompt principal  

---

## 🔹 4. Export des fichiers générés

Le backend écrit automatiquement le projet généré dans :

```
backend/generated/<nom-du-projet>
```

Préparé pour :
- ZIP export,  
- push GitHub automatique (bientôt),  
- téléchargement complet.

---

# 🚧 Roadmap à venir

### 🔥 En développement
- Génération frontend (React / Next / Tailwind)  
- Génération ZIP téléchargeable  
- Templates pré‑configurés (SaaS, e‑commerce, API…)  
- Dockerfile + docker-compose complets  
- Validation des schémas (Zod/Joi)  

### 🚀 Version finale
- Interface complète façon IDE  
- Projets full‑stack complets  
- Collaboration temps réel  
- Assistant IA intégré au projet généré  
- Marketplace de templates  

---

# 🛠 Installation

## Backend
```
cd backend
npm install
npm start
```
👉 http://localhost:4000

## Frontend
```
cd frontend
npm install
npm run dev
```
👉 http://localhost:5173

---

# 🧪 Exemple de prompt

> “Crée une API Express avec CRUD utilisateurs, JWT et base PostgreSQL.”

---

# 💬 Statut actuel

CodeFlow AI est en **bêta stable** :
- Génération backend solide  
- Refactor file fonctionnel  
- Interface file explorer + éditeur IA opérationnelle  
- Base prête pour le full‑stack  

Chaque mise à jour rapproche CodeFlow AI de son objectif :  
> **Devenir la plateforme la plus rapide pour créer un projet complet.**

---

# ❤️ Contributeurs & objectifs

Toute idée ou amélioration est bienvenue pour faire évoluer CodeFlow AI vers un outil professionnel complet.
