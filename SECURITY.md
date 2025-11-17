# 🔐 Security Policy — CodeFlow AI

Merci de contribuer à la sécurité de CodeFlow AI.  
Cette plateforme étant encore en version Bêta, des failles peuvent exister.

## 🚨 Signalement de vulnérabilité

Si tu découvres un comportement anormal, une faille ou un risque potentiel :

1. **Ne publie jamais la vulnérabilité publiquement.**
2. Contacte directement :  
   **contact : damien.gamarra.pro@gmail.com** (ou l’adresse souhaitée).
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