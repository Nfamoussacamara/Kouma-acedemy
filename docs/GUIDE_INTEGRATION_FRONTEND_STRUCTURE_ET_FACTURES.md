# Guide d'Intégration Frontend — Structure Sanitaire & Gestion des Factures

> **Document de Référence pour l'Équipe Frontend**  
> **Backend :** Kouma Academy API (`/api/v1`)  
> **Date :** Septembre 2026  
> **Version :** 2.0.0  

---

## Sommaire
1. [Contexte des dernières évolutions](#1-contexte-des-dernières-évolutions)
2. [Volet 1 : Le champ structure_sanitaire rattaché à l'Utilisateur](#2-volet-1--le-champ-structure_sanitaire-rattaché-à-lutilisateur)
   - [2.1 Pourquoi ce changement ?](#21-pourquoi-ce-changement-)
   - [2.2 Référentiel des structures sanitaires valides](#22-référentiel-des-structures-sanitaires-valides)
   - [2.3 Inscription (POST /auth/register)](#23-inscription-post-authregister)
   - [2.4 Connexion & Session (POST /auth/login)](#24-connexion--session-post-authlogin)
   - [2.5 Modification de profil (PATCH /users/:id) & Gestion des droits](#25-modification-de-profil-patch-usersid--gestion-des-droits)
3. [Volet 2 : Simplification du Module Panne côté Frontend](#3-volet-2--simplification-du-module-panne-côté-frontend)
   - [3.1 Création de panne (POST /pannes) : Allègement du formulaire](#31-création-de-panne-post-pannes--allègement-du-formulaire)
   - [3.2 Consultation & Immuabilité (GET et PATCH /pannes/:id)](#32-consultation--immuabilité-get-et-patch-pannesid)
4. [Volet 3 : Gestion Complète des Factures sur les Commandes](#4-volet-3--gestion-complète-des-factures-sur-les-commandes)
   - [4.1 Principe & Stockage Cloudinary](#41-principe--stockage-cloudinary)
   - [4.2 Téléversement d'une facture (POST .../facture)](#42-téléversement-dune-facture-post-facture)
   - [4.3 Structure des données reçues (reception.facture)](#43-structure-des-données-reçues-receptionfacture)
   - [4.4 Suppression d'une facture (DELETE .../facture)](#44-suppression-dune-facture-delete-facture)
   - [4.5 Restauration d'une facture (PATCH .../facture/restore)](#45-restauration-dune-facture-patch-facturerestore)
5. [Récapitulatif Rapide pour le Frontend](#5-récapitulatif-rapide-pour-le-frontend)

---

## 1. Contexte des dernières évolutions

Deux améliorations majeures ont été déployées sur le backend :
1. **La structure sanitaire est désormais une propriété de l'utilisateur**, et non plus une valeur saisie à chaque panne. Les formulaires de déclaration de panne sont allégés et automatisés.
2. **Gestion complète des fichiers de facture** : possibilité de téléverser, visualiser, supprimer et restaurer les factures fournisseurs associées aux réceptions de commandes via **Cloudinary**.

---

## 2. Volet 1 : Le champ `structure_sanitaire` rattaché à l'Utilisateur

### 2.1 Pourquoi ce changement ?
- Auparavant, un utilisateur devait sélectionner son hôpital à chaque déclaration de panne.
- Désormais, **chaque compte utilisateur est rattaché à une structure sanitaire spécifique**. 
- Dès qu'un utilisateur connecté déclare une panne, le backend sait automatiquement à quel hôpital il appartient.
- Cela garantit une traçabilité sans faille et une génération automatique des références uniques (ex: `PA-HRL-0001-0409`).

---

### 2.2 Référentiel des structures sanitaires valides

Voici les **9 valeurs exactes autorisées** (à utiliser dans vos menus déroulants `<select>` ou composants d'autocomplétion) :

| Libellé exact (à envoyer au backend) | Code Référence Backend |
| :--- | :--- |
| `HOPITAL REGIONAL DE LABE` | `HRL` |
| `HOPITAL REGIONAL DE BOKE` | `HRB` |
| `HOPITAL REGIONAL DE NZEREKORE` | `HRN` |
| `HOPITAL PREFECTORAL DE BEYLA` | `HPB` |
| `HOPITAL PREFECTORAL DE MANDIANA` | `HPM` |
| `HOPITAL PREFECTORAL DE BOFFA` | `HPBO` |
| `HOPITAL PREFECTORAL DE KOUROUSSA` | `HPK` |
| `CMC DE MATAM` | `CMC-MA` |
| `CMC DE RATOMA` | `CMC-RA` |

---

### 2.3 Inscription (`POST /api/v1/auth/register`)

Le champ `structure_sanitaire` est **obligatoire** lors de la création d'un compte.

#### Exemple de Payload JSON :
```json
{
  "username": "dr_camara",
  "password": "Password123!",
  "nom": "Camara",
  "prenom": "Ibrahima",
  "tel": "621000001",
  "type": "Utilisateur",
  "structure_sanitaire": "HOPITAL REGIONAL DE LABE"
}
```

---

### 2.4 Connexion & Session (`POST /api/v1/auth/login`)

Lorsque l'utilisateur se connecte, l'objet `user` renvoyé contient sa structure sanitaire :

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": "66d010000000000000000001",
      "username": "dr_camara",
      "nom": "Camara",
      "prenom": "Ibrahima",
      "tel": "621000001",
      "type": "Utilisateur",
      "structure_sanitaire": "HOPITAL REGIONAL DE LABE"
    }
  }
}
```

#### Ce que le Frontend doit faire :
- Sauvegarder `structure_sanitaire` dans votre store global (Redux, Zustand, ou `localStorage`).
- L'afficher dans la barre de navigation ou sur la page profil (ex: « Dr. Camara — Hôpital Régional de Labé »).

---

### 2.5 Modification de profil (`PATCH /api/v1/users/:id`) & Gestion des droits

Le backend applique une règle de sécurité stricte :
- **Utilisateur standard (`Utilisateur`)** : peut modifier son propre `nom`, `prenom`, `tel`.
- **Seul un `Admin`** peut modifier le rôle `type` ou la `structure_sanitaire` d'un utilisateur.

> **Erreur HTTP 403 Forbidden :**  
> Si un utilisateur non-admin tente d'envoyer `structure_sanitaire` ou `type` dans le body de mise à jour, l'API renvoie :
> ```json
> {
>   "success": false,
>   "statusCode": 403,
>   "message": "Vous n'avez pas le droit de modifier votre structure sanitaire"
> }
> ```
> **Côté UI :** Désactiver ou masquer le champ de sélection de la structure sanitaire sur la page "Mon Profil", et ne le rendre éditable que dans le panneau d'administration des utilisateurs (`Admin`).

---

## 3. Volet 2 : Simplification du Module Panne côté Frontend

### 3.1 Création de panne (`POST /api/v1/pannes`) : Allègement du formulaire

#### Ce qu'il NE FAUT PLUS envoyer :
- Ne plus envoyer `structure_sanitaire` dans le payload de création.
- Ne pas envoyer de champ `reference`.

#### Ce qu'il faut envoyer :
Le backend injecte automatiquement le déclarant connecté et sa structure sanitaire.

```json
{
  "description": "L'échographe de la salle 2 ne démarre plus",
  "type_panne": "Equipement",
  "niveau_urgence": "Critique",
  "besoin_intervention": true,
  "equipements": [
    {
      "equipement": "66bc30000000000000000001",
      "quantite": 1,
      "modele": "Mindray DC-70",
      "traitement": "REPARATION"
    }
  ]
}
```

#### Réponse HTTP 201 Created retournée par le backend :
```json
{
  "success": true,
  "data": {
    "_id": "66d801111111111111111111",
    "reference": "PA-HRL-0001-0409",
    "structure_sanitaire": "HOPITAL REGIONAL DE LABE",
    "statut": "NOUVELLE",
    "description": "L'échographe de la salle 2 ne démarre plus",
    "declarant": {
      "_id": "66d010000000000000000001",
      "nom": "Camara",
      "prenom": "Ibrahima"
    }
  }
}
```

---

### 3.2 Consultation & Immuabilité (`GET` et `PATCH /pannes/:id`)

- **Affichage (`GET /pannes/:id`)** :  
  Afficher la `reference` (ex: `PA-HRL-0001-0409`) et la `structure_sanitaire` sous forme de texte ou badges bien visibles.
- **Modification (`PATCH /pannes/:id`)** :  
  La référence et la structure sanitaire sont **strictement immuables**. Dans votre formulaire d'édition, ces champs doivent être en lecture seule (`disabled` ou `readOnly`).

---

## 4. Volet 3 : Gestion Complète des Factures sur les Commandes

### 4.1 Principe & Stockage Cloudinary
- Une commande peut comporter plusieurs réceptions de matériels.
- Chaque réception peut recevoir **une facture d'achat / bon de livraison scanné**.
- Les fichiers sont hébergés sur **Cloudinary** avec des URLs HTTPS sécurisées.

---

### 4.2 Téléversement d'une facture (`POST .../facture`)

* **URL :** `POST /api/v1/commandes/:commandeId/receptions/:receptionId/facture`
* **Headers :**
  - `Authorization: Bearer <TOKEN>`
  - `Content-Type: multipart/form-data`
* **Corps de requête (FormData) :**
  - Nom du champ : **`file`** (fichier binaire)
* **Formats autorisés :**
  - PDF (`application/pdf`)
  - Images (`image/jpeg`, `image/png`, `image/webp`)
* **Taille maximale :** `5 Mo`

---

### 4.3 Structure des données reçues (`reception.facture`)

Chaque réception de commande (`commande.receptions[]`) contient un sous-objet `facture` :

```typescript
interface Facture {
  url: string;            // URL HTTPS sécurisée Cloudinary pour téléchargement / visualisation
  publicId: string;       // Identifiant Cloudinary
  nomOriginal: string;    // Ex: "Facture_Fournisseur_F-2026-089.pdf"
  mimeType: string;       // Ex: "application/pdf" ou "image/jpeg"
  taille: number;         // Taille en octets
  uploadedAt: string;     // Date d'upload ISO
  uploadedBy?: string;    // ID utilisateur ayant uploadé
  deletedAt: string | null; // null si active, Date si supprimée (soft delete)
}
```

#### Exemple de structure dans la commande :
```json
{
  "_id": "66c055555555555555555555",
  "numero": "CMD-202608-0001",
  "status": "RECUE",
  "receptions": [
    {
      "_id": "66d900000000000000000001",
      "dateReception": "2026-09-04T12:00:00.000Z",
      "facture": {
        "url": "https://res.cloudinary.com/.../Facture_F-2026-089.pdf",
        "nomOriginal": "Facture_Fournisseur_F-2026-089.pdf",
        "mimeType": "application/pdf",
        "taille": 245120,
        "uploadedAt": "2026-09-04T12:05:00.000Z",
        "deletedAt": null
      }
    }
  ]
}
```

> **Affichage Frontend :**  
> Si `reception.facture?.url` existe et que `reception.facture.deletedAt === null`, afficher un lien ou bouton :  
> `<a href={facture.url} target="_blank" rel="noreferrer">Voir la facture ({facture.nomOriginal})</a>`.

---

### 4.4 Suppression d'une facture (`DELETE .../facture`)

Supprime logiquement la facture (soft delete) sans détruire immédiatement le fichier Cloudinary.

* **URL :** `DELETE /api/v1/commandes/:commandeId/receptions/:receptionId/facture`
* **Méthode :** `DELETE`
* **Réponse HTTP :** `200 OK` (retourne la commande mise à jour avec `facture.deletedAt` renseigné).

---

### 4.5 Restauration d'une facture (`PATCH .../facture/restore`)

Permet d'annuler une suppression accidentelle.

* **URL :** `PATCH /api/v1/commandes/:commandeId/receptions/:receptionId/facture/restore`
* **Méthode :** `PATCH`
* **Réponse HTTP :** `200 OK` (retourne la commande avec `facture.deletedAt: null`).

---

## 5. Récapitulatif Rapide pour le Frontend

| Action | Ce qui change pour le Frontend |
| :--- | :--- |
| **Création d'un utilisateur (`register`)** | Ajouter le champ `structure_sanitaire` (liste déroulante obligatoire parmi les 9 structures). |
| **Connexion (`login`)** | Stocker `user.structure_sanitaire` dans le state pour affichage dans l'application. |
| **Création d'une panne (`POST /pannes`)** | **Supprimer** le champ `structure_sanitaire` du formulaire (le backend l'injecte automatiquement). |
| **Consultation d'une panne** | Afficher la référence (`PA-HRL-0001-...`) et la structure en lecture seule. |
| **Facture de commande** | Envoyer une requête `multipart/form-data` avec la clé `file` sur `POST .../facture` (PDF/images, max 5 Mo). |
