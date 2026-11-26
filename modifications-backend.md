# Modifications à faire côté backend

Ce document liste ce que le frontend attend de l'API (`/api/v1`) et qui n'existe pas encore.
Le frontend est déjà prêt pour chacun de ces points : il n'y a rien à changer de son côté une fois l'API à jour.

---

## 1. Commandes créées par l'admin pour une structure sanitaire

### Le besoin

- L'admin crée une commande **pour une structure** (ex. « HOPITAL REGIONAL DE LABE »).
- Pour ces commandes, aucun bon de commande signé n'est demandé.
- Une fois la commande **réceptionnée**, **tous les utilisateurs de la structure** la voient, impriment le bon de réception et téléversent le bon de réception signé.

### Données envoyées par le frontend

`POST /commandes` (par l'admin) :

```json
{
  "structure_sanitaire": ["HOPITAL REGIONAL DE LABE"],
  "equipements": [{ "equipement": "<id équipement>", "quantiteCommandee": 2 }]
}
```

Le backend renseigne lui-même `demandeur` et `createdBy` à partir de l'utilisateur authentifié. Il déduit `creeParAdmin: true` lorsqu'un Admin fournit au moins une structure sanitaire destinataire. Le frontend ne doit pas envoyer ce champ.

### À faire

**1.1 Modèle `Commande`**

Ajouter deux champs, et les renvoyer dans `GET /commandes` et `GET /commandes/:id` :

| Champ | Type | Défaut |
|---|---|---|
| `structure_sanitaire` | `[String]` (noms de structure) | `[]` |
| `creeParAdmin` | `Boolean` | `false` |

Sans ces champs dans le schéma, Mongoose les ignore sans erreur et la fonctionnalité ne marche pas.

**1.2 `GET /commandes` pour un utilisateur non admin**

Aujourd'hui, il ne reçoit que les commandes dont il est le `demandeur`.
Il doit **aussi** recevoir les commandes dont `structure_sanitaire` contient **sa** structure.

- Le frontend appelle `GET /commandes?structure_sanitaire=<nom>&limit=100`.
- **Important (sécurité)** : la structure doit être lue dans l'utilisateur connecté (token, `user.structure_sanitaire`), **pas** dans le paramètre de l'URL. Sinon un utilisateur peut lire les commandes d'une autre structure.
- Recommandé : ne renvoyer ces commandes qu'une fois réceptionnées (au moins une réception). Le frontend applique déjà ce filtre, mais il est plus sûr côté serveur.

**1.3 Droits d'accès**

Pour une commande dont `structure_sanitaire` contient la structure de l'utilisateur connecté, autoriser :

| Route | Aujourd'hui | Attendu |
|---|---|---|
| `GET /commandes/:id` | 403 | 200 |
| `POST /commandes/:id/bon-reception-signe` | 403 | 200 (fichier dans **un seul** champ `multipart/form-data`) |
| `PATCH /commandes/:id`, `DELETE /commandes/:id` | — | rester **réservés à l'admin** |

---

## 2. Retrouver une commande par son numéro

L'adresse de la page d'une commande affiche maintenant le **numéro** (`/commandes/CMD-20261124-0006`) au lieu de l'identifiant technique.

Aujourd'hui, le frontend retrouve l'identifiant en parcourant la liste (`GET /commandes?search=…&numero=…&limit=100`). Au-delà de 100 commandes, une ancienne commande peut ne plus être trouvée.

### À faire (au choix)

- **Option A (recommandée)** : `GET /commandes/:id` accepte aussi un numéro.
  Si `:id` n'est pas un ObjectId valide, chercher par `numero`.
- **Option B** : `GET /commandes?numero=CMD-…` filtre exactement sur le numéro.

Les mêmes règles d'accès que `GET /commandes/:id` s'appliquent.

---

## 3. Plusieurs factures (plusieurs fournisseurs) — optionnel

Une commande peut contenir des équipements de **plusieurs fournisseurs** (le fournisseur est celui de l'équipement).
Aujourd'hui l'API n'accepte qu'**une facture par réception** (`POST /commandes/:id/receptions/:receptionId/facture`).
Le frontend contourne cela en faisant **une réception par fournisseur**.

Si l'on veut pouvoir tout réceptionner en une fois, il faudrait permettre **plusieurs factures par réception**, chacune rattachée à un fournisseur :

```json
"factures": [
  { "fournisseur": "<id fournisseur>", "url": "...", "nomOriginal": "...", "mimeType": "...", "taille": 12345 }
]
```

Ce point n'est pas bloquant : le fonctionnement actuel (une réception par fournisseur) marche déjà.
