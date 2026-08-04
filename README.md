# 🎓 Kouma Academy — Backend API

> **API RESTful modulaire, robuste et sécurisée** servant de socle backend pour la plateforme Kouma Academy.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)
![Express.js](https://img.shields.io/badge/Express-4.21.2-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Ce backend a été conçu selon les strictes exigences de l'industrie (Clean Architecture, conception modulaire) pour garantir **scalabilité**, **maintenabilité** et **sécurité stricte**. 

---

## 🚀 Fonctionnalités Clés

- **Architecture Modulaire** : Isolation totale des responsabilités métiers par modules indépendants (`user`, `equipement`, `fournisseur`, `auditLog`).
- **Gestion Sécurisée des Identités (IAM/Auth)** :
  - Authentification par jetons **JWT**.
  - Hashage de pointe des mots de passe via **Argon2**.
  - Contrôle d'Accès Basé sur les Rôles (RBAC : `Admin`, `Utilisateur`).
- **Traçabilité et Audit (Audit Log)** : Système de journalisation global via middleware pour tracer toutes les actions asymétriques ou sensibles.
- **Sécurité et Anti-DDoS** :
  - **Rate Limiting granulaire** (limites propres à la route de connexion `/login` et limites selon le rôle de l'utilisateur).
  - Sécurité des headers via **Helmet** et règles **CORS** complètes.
- **Validation Haute Performance** : Validation déclarative stricte par le biais de schémas utilisant **Yup**.

## 🛠 Stack Technique

- **Runtime** : Node.js (v20+)
- **Framework REST** : Express.js
- **Base de données** : MongoDB (Object Modeling via Mongoose)
- **Validation** : Yup
- **Tests** : Node.js Native Test Runner (`node --test`), Supertest, MongoDB Memory Server
- **Linting** : ESLint (v9)

## 📁 Structure du Projet

```text
src/
├── config/              # Configuration & variables d'environnement
├── shared/              # Utilitaires globaux et gestion d'erreurs
├── middlewares/         # Middlewares globaux (Auth, Rate Limit, Validation, Audit)
├── routes/              # Point d'entrée du routage de l'API
└── modules/             # Coeur métier de l'application
    ├── user/            # Entité Utilisateur et Authentification
    ├── equipement/      # Entité Équipement
    ├── fournisseur/     # Entité Fournisseur
    └── auditLog/        # Trace et historique des actions serveur
        ├── controllers/
        ├── routes/
        ├── services/
        ├── repositories/
        ├── infrastructure/
        └── validators/
```

## ⚙️ Démarrage Rapide (Local)

### 1. Prérequis

- **Node.js** (v20.0.0 ou supérieur)
- **MongoDB** en fonctionnement (localement, cluster Atlas ou via Docker)
- **npm** (ou yarn)

### 2. Installation

Clonez le projet et installez les dépendances :

```bash
git clone <votre_url_git>
cd kouma-academy-back
npm install
```

### 3. Variables d'Environnement

Copiez le fichier d'exemple et remplissez vos identifiants (secret JWT, URI Mongo, etc.) :

```bash
cp .env.example .env
```

### 4. Lancement de l'API

Lancer le serveur en mode développement (rechargement à chaud avec nodemon) :

```bash
npm run dev
```

L'API sera prête à recevoir des requêtes sur : `http://localhost:3000/api/v1`

## 🧪 Qualité & Tests

Le projet intègre une suite de tests robuste (Unitaire, Intégration et End-to-End) en utilisant des bases de données isolées en mémoire (`mongodb-memory-server`) afin de ne pas altérer votre base de développement.

### Piloter l'API

| Commande                   | Description                                                |
|----------------------------|------------------------------------------------------------|
| `npm start`                | Lance l'API en production                                  |
| `npm run dev`              | Lance l'API en mode développement (`nodemon`)              |
| `npm test`                 | Exécute l'intégralité des suites de tests                  |
| `npm run test:unit`        | Exécute uniquement les tests unitaires                     |
| `npm run test:integration` | Exécute les tests d'intégration des services/repositories  |
| `npm run test:e2e`         | Exécute les tests fonctionnels complets (Supertest)        |
| `npm run lint`             | Analyse statique du code (ESLint)                          |
| `npm run seed:admin`       | Génère l'administrateur système de base en BDD             |

## 🔑 Permissions & Rôles

Le système exploite deux niveaux primaires d'autorisations, protégés en cascade via des middlewares sur les routes :
- **Utilisateur (*User*)** : Droit de lecture/écriture basique.
- **Administrateur (*Admin*)** : Accès étendu (Création/Modification/Suppression d'utilisateurs, gestion des fournisseurs et équipements sensibles).
