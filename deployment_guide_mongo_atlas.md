# Guide de Déploiement : Backend Kouma Academy avec MongoDB Atlas

Ce guide détaille les étapes nécessaires pour configurer et déployer votre API backend Express.js en ligne, en utilisant une base de données **MongoDB Atlas** (cloud).

## 1. Préparation de la Base de Données (MongoDB Atlas)

MongoDB Atlas est une plateforme cloud qui héberge votre base de données MongoDB.

### Étapes de configuration :
1. **Créer un compte et un cluster** : Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) et créez un compte gratuit. Créez un nouveau cluster (le niveau gratuit "M0 Sandbox" est parfait pour commencer).
2. **Créer un utilisateur de base de données** : Dans le menu de gauche sous "Database Access", créez un nouvel utilisateur avec un nom d'utilisateur et un mot de passe sécurisé. **Notez bien ces informations**, vous en aurez besoin.
3. **Autoriser les adresses IP (Network Access)** : Dans le menu "Network Access", cliquez sur "Add IP Address" et sélectionnez **"Allow Access from Anywhere"** (`0.0.0.0/0`). Cela permettra à votre serveur distant de se connecter à la base de données.
4. **Récupérer l'URI de connexion** : 
   - Allez dans "Database" et cliquez sur le bouton **Connect** de votre cluster.
   - Choisissez **"Drivers"** (Node.js).
   - Copiez la chaîne de connexion (URI) fournie (elle commencera par `mongodb+srv://...`).
   - Remplacez `<password>` dans la chaîne par le mot de passe de l'utilisateur créé à l'étape 2.

## 2. Configuration des Variables d'Environnement (.env)

Lors du déploiement public (sur Render, Railway, Heroku, etc.), vous ne poussez PAS votre fichier `.env`. Au lieu de cela, vous devez configurer ces variables directement dans le panneau de contrôle de votre hébergeur.

Les variables essentielles à configurer en production sont :

- `NODE_ENV` : Doit être réglé sur **production**.
- `PORT` : (La plupart des hébergeurs définissent ce port automatiquement).
- `API_PREFIX` : Laissez par défaut `/api/v1` ou définissez selon vos besoins.
- `CORS_ORIGIN` : **Très important !** Mettez l'URL publique de votre Frontend (ex: `https://kouma-academy.vercel.app`), pour des raisons de sécurité. Évitez de laisser l'astérisque `*` en production.
- `JWT_SECRET` : Utilisez une phrase secrète complexe et longue, **différente** de celle du développement (générez une chaîne aléatoire).
- `MONGODB_URI` : Collez ici la chaîne de connexion obtenue sur MongoDB Atlas.

## 3. Déploiement du Backend (Exemple avec Render ou Railway)

Ces plateformes sont idéales car elles s'intègrent directement avec GitHub et détectent automatiquement les projets Node.js.

### Chemin à suivre pour déployer (ex. sur Render.com) :
1. **Héberger votre code sur GitHub/GitLab** : Assurez-vous que votre projet est poussé sur un dépôt distant (`git push`).
2. **Créer un Web Service** : Connectez-vous à Render (ou Railway), créez un nouveau "Web Service" et liez-le à votre dépôt GitHub.
3. **Configuration du service** :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start` (cela correspond à votre script `node src/server.js` dans le `package.json`).
4. **Ajout des variables (Environment Variables)** :
   Dans la section "Environment Variables", ajoutez toutes les clés citées à l'étape 2 (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`).
5. **Déploiement** : Lancez le déploiement. L'hébergeur va installer les dépendances et exécuter votre serveur. 

## 4. Vérification Post-Déploiement

Une fois déployé, votre hébergeur vous donnera une URL publique (ex: `https://kouma-academy-api.onrender.com`).
1. Testez l'API via Postman ou l'interface de test Swagger en visitant `https://[URL_DE_VOTRE_API]/api/v1/docs` (si Swagger est activé en production).
2. Vérifiez que la création d'un utilisateur fonctionne : les données devraient apparaître immédiatement dans votre cluster MongoDB Atlas.
