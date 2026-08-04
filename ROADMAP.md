# 🗺️ Roadmap d'Amélioration & Guide d'Implémentation

Ce fichier décrit **étape par étape** comment implémenter les améliorations globales du backend Kouma Academy abordées dans le plan d'action. Les différentes étapes sont triées par ordre de priorité et d'impact.

---

## Étape 1 : Le Plugin Global de *Soft Delete* (Mongoose)

**Le But :** Actuellement, `isActive: false` marque un élément comme supprimé. Au lieu de filtrer manuellement dans chaque contrôleur, on va créer un plugin Mongoose qui cache automatiquement ces éléments.

**Comment procéder :**
1. Créer un fichier `src/infrastructure/database/plugins/softDelete.plugin.js`.
2. Y insérer ce code :
   ```javascript
   export function softDeletePlugin(schema) {
     schema.add({ isActive: { type: Boolean, default: true } });
     
     const filterInactive = function(next) {
       this.where({ isActive: { $ne: false } });
       next();
     };

     // Appliquer le filtre sur toutes les méthodes de recherche
     schema.pre('find', filterInactive);
     schema.pre('findOne', filterInactive);
     schema.pre('findOneAndUpdate', filterInactive);
     schema.pre('countDocuments', filterInactive);
   }
   ```
3. Dans chaque schéma (`user.schema.js`, `equipement.schema.js`, etc.), ajouter :
   ```javascript
   import { softDeletePlugin } from '../../../../infrastructure/database/plugins/softDelete.plugin.js';
   // ... définir le schema
   equipementSchema.plugin(softDeletePlugin);
   ```

---

## Étape 2 : Standardisation des Réponses API (Format JSend)

**Le But :** Avoir une cohérence parfaite pour le Front-End (toujours recevoir un objet avec `.status`, `.data` ou `.message`).

**Comment procéder :**
1. Créer un middleware global `src/shared/utils/responseFormatter.js`.
2. Créer des helpers simples :
   ```javascript
   export const sendSuccess = (res, data, statusCode = 200) => {
       res.status(statusCode).json({ status: 'success', data });
   };
   
   export const sendError = (res, message, statusCode = 400) => {
       res.status(statusCode).json({ status: 'error', message });
   };
   ```
3. Remplacer tous vos appels `res.json(...)` éclatés dans vos contrôleurs par un appel à `sendSuccess(res, resultat)`. Tous vos retours seront sécurisés et formatés de manière stricte.

---

## Étape 3 : Gestion Sécurisée du Logout (Blacklist JWT)

**Le But :** Actuellement, si le Front-End supprime le token, côté serveur, le token reste techniquement valide jusqu'à sa date d'expiration. En cas de vol, c'est risqué.

**Comment procéder :**
1. Créer un modèle `blacklistToken.schema.js` (avec un champ `token` et un `expireAt`).
2. Créer une route `POST /auth/logout` dans `auth.routes.js`.
3. Quand l'utilisateur clique sur "Se déconnecter", inscrire son token dans ce schéma *Blacklist*.
4. Mettre à jour `authMiddleware.js` pour rechercher si le token fourni dans les requêtes n'est pas dans la liste noire avant d'accorder l'accès. S'il y est, rejeter avec `401 Unauthorized`.

---

## Étape 4 : Pipeline CI/CD sur GitHub Actions

**Le But :** Sécuriser la base de code pour empêcher l'envoi sur GitHub d'un code buggé ou mal formaté.

**Comment procéder :**
1. À la racine du projet, créer : `.github/workflows/main.yml`.
2. Y lister les directives :
   ```yaml
   name: Kouma Academy CI
   on: [push, pull_request]
   jobs:
     build-and-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
         - run: npm install
         - run: npm run lint
         - run: npm run test
   ```
3. Pousser sur Github. À chaque *Push*, GitHub s'assurera de valider le linter et les tests avant de valider que la branche est propre !

---

## Étape 5 : Protection Anti-XSS (Input Validation)

**Le But :** Empêcher qu'un utilisateur n'insère du code malveillant comme `<script>alert('hack')</script>` dans les champs texte.

**Comment procéder :**
1. Installer le module xss : `npm install xss-clean`.
2. Dans le fichier routeur d'entrée principal (`src/routes/index.js` ou `app.js`), l'activer globalement :
   ```javascript
   import xss from 'xss-clean';
   app.use(xss());
   ```
3. (Alternativement, configurer *Yup* pour utiliser `.trim()` systématiquement et rejeter les caractères non sécurisés via des REGEX).

---

## Synthèse

Si vous suivez ces 5 étapes l'une après l'autre, vous obtiendrez un Backend extrêmement résilient, sécurisé et prêt à accueillir des dizaines de milliers de requêtes par jour avec une maintenabilité défiant toute concurrence. L'ordre recommandé est d'implémenter le plugin **SoftDelete** en premier.
