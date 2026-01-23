# 🔐 Security Policy — CodeFlow AI

Merci de contribuer à la sécurité de CodeFlow AI.  
Cette plateforme étant encore en version Bêta, des failles peuvent exister.

## 🚨 Signalement de vulnérabilité

Si tu découvres un comportement anormal, une faille ou un risque potentiel :

1. **Ne publie jamais la vulnérabilité publiquement.**
2. Contacte directement :  
   **contact : damien.gamarra.pro@gmail.com** .
3. Fournis les détails suivants :
   - Description du problème
   - Étapes pour reproduire
   - Impact potentiel
   - Environnement utilisé (OS, navigateur, version)

Nous répondrons dans un délai raisonnable.

## 🛡 Types de failles concernées

- Exécution de code non autorisée
- Accès non autorisé à des données
- Failles backend (injections, auth, tokens…)
- Failles frontend (XSS, exposition de clés…)
- Problèmes liés à la génération automatique de code
- Accès aux fichiers générés d'autres utilisateurs

## ✔ Bonnes pratiques pour contribuer

- Ne jamais push un `.env`
- Ne jamais inclure de clé API ou token dans le code
- Tester les modifications avant PR
- Toujours travailler sur une branche dédiée
- Prévenir si un correctif impacte l’IA ou la génération

## 🙏 Merci

Tu contribues à rendre CodeFlow AI plus robuste, sécurisé et fiable pour tous.

## 🔒 Politique de sécurité renforcée

Chez CodeFlow AI, nous nous engageons à maintenir un niveau de sécurité élevé pour protéger les données, les utilisateurs et l’intégrité de la plateforme. Nous appliquons des mesures strictes et des bonnes pratiques rigoureuses pour limiter les risques et garantir un environnement fiable.

Nos attentes en matière de sécurité incluent la mise en place de protections robustes, la gestion rigoureuse des accès, ainsi qu’un suivi continu des vulnérabilités potentielles. Chaque contributeur doit respecter ces règles pour assurer la confidentialité, l’intégrité et la disponibilité des services.

### Contrôle d'accès et permissions

- Appliquer le principe du moindre privilège : chaque utilisateur et service dispose uniquement des droits nécessaires à ses fonctions.
- Protéger les branches principales avec des règles strictes (revues obligatoires, tests automatisés).
- Utiliser des secrets chiffrés pour stocker les clés et tokens, sans jamais les exposer dans le code source.
- Restreindre l’accès aux environnements de production et aux données sensibles.

### Gestion des dépendances

- Scanner régulièrement les dépendances avec des outils automatisés pour détecter les vulnérabilités connues.
- Utiliser `npm audit` ou équivalent pour identifier et corriger les failles dans les paquets utilisés.
- Mettre à jour fréquemment les bibliothèques et frameworks pour bénéficier des correctifs de sécurité.
- Éviter les dépendances obsolètes ou non maintenues.

### Sécurité du backend

- Mettre en place des limitations de taux (rate limiting) pour prévenir les attaques par déni de service.
- Valider et nettoyer toutes les entrées utilisateurs pour éviter les injections SQL, XSS, et autres attaques.
- Utiliser la rotation régulière des tokens JWT pour limiter leur durée de vie.
- Protéger les mots de passe avec des algorithmes de hachage robustes comme bcrypt.
- Surveiller les logs pour détecter toute activité suspecte.

### Sécurité du frontend

- Implémenter une politique de sécurité de contenu (CSP) stricte pour limiter l’exécution de scripts non autorisés.
- Configurer les cookies avec l’attribut SameSite pour réduire les risques de CSRF.
- Éviter les scripts inline et privilégier les fichiers externes signés.
- Échapper systématiquement les entrées utilisateurs affichées pour prévenir les attaques XSS.

### Tests et audits réguliers

- Réaliser des tests d’intrusion (pentests) périodiques pour identifier les vulnérabilités exploitable.
- Effectuer des analyses statiques du code pour détecter les failles avant déploiement.
- Mettre en place une surveillance continue pour alerter en cas de comportement anormal ou de compromission.
- Documenter et corriger rapidement toute faille découverte.

## 🧩 Engagement

CodeFlow AI s’engage à maintenir un environnement sécurisé, en appliquant les meilleures pratiques et en restant vigilant face aux nouvelles menaces. La sécurité est une responsabilité collective, et chaque membre de la communauté contribue à la protection et à la confiance que nous bâtissons ensemble.
