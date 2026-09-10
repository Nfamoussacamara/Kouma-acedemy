# Guide d'Intégration Frontend — Tableaux de Bord (Dashboard) & Statistiques

> Document technique de référence pour l'équipe Frontend
> Backend : Kouma Academy API (/api/v1)
> Date : Septembre 2026
> Version : 2.2.0

---

## Sommaire

1. Contexte & Architecture des Tableaux de Bord
2. Matrice des Droits et des Endpoints
3. Endpoint 1 : Tableau de Bord Global Admin (GET /api/v1/dashboard)
   - 3.1 Droits & Paramètres
   - 3.2 Structure exacte de la réponse
   - 3.3 Description détaillée des métriques
   - 3.4 Conseils d'intégration UI
4. Endpoint 2 : Statistiques Utilisateur / Pannes (GET /api/v1/pannes/stats)
   - 4.1 Droits & Filtrage automatique
   - 4.2 Structure exacte de la réponse
   - 4.3 Description détaillée des métriques
   - 4.4 Conseils d'intégration UI
5. Endpoint 3 : Évolution Mensuelle pour Graphiques (GET /api/v1/dashboard/charts/monthly)
   - 5.1 Droits & Paramètres de requête
   - 5.2 Structure exacte de la réponse (12 mois complets garantis)
   - 5.3 Exploitation pour les graphiques
6. Rappel : Droits Harmonisés sur le Module Panne
7. Résumé des Pièges à Éviter (Anti-Erreurs Frontend)

---

## 1. Contexte & Architecture des Tableaux de Bord

Le backend met à disposition des endpoints optimisés et décentralisés :

1. **Dashboard Global (`/api/v1/dashboard`)** : indicateurs opérationnels complets du parc hospitalier (utilisateurs, équipements, fournisseurs, commandes par statut et montants, pannes globales, répartition par hôpital, équipements en panne et les 5 derniers signalements). Réservé à l'**Admin**.
2. **Dashboard Graphiques (`/api/v1/dashboard/charts/monthly`)** : série chronologique complète sur 12 mois (Janvier à Décembre) pour tracer l'évolution des pannes (totales vs résolues) et des commandes (nombre et montants engagés). Réservé à l'**Admin**.
3. **Statistiques Utilisateur (`/api/v1/pannes/stats`)** : indicateurs filtrés automatiquement sur l'utilisateur connecté via son jeton JWT (ses déclarations, urgences, demandes d'intervention, en cours, résolues). Sert à la fois pour la vue d'accueil utilisateur et pour la page de gestion des pannes.

---

## 2. Matrice des Droits et des Endpoints

### 2.1 Tableaux de Bord Généraux (Admin)
| Endpoint | Méthode | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/dashboard` | GET | `Admin` | Vue globale complète du système (KPIs multi-modules) |
| `/api/v1/dashboard/charts/monthly` | GET | `Admin` | Données temporelles sur 12 mois (pannes et commandes) |

### 2.2 Statistiques par Section / Module (Idéal pour les pages Frontend)
| Endpoint | Méthode | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/pannes/stats` | GET | `Admin`, `Utilisateur` | KPIs pannes : `total`, `nouvelles`, `enAttente`, `enCours`, `resolues`, `cloturees`, `urgentes`, `critiques` |
| `/api/v1/commandes/stats` | GET | `Admin` | KPIs des commandes (totaux par statut, montant total engagé) |
| `/api/v1/equipements/stats` | GET | `Admin`, `Utilisateur` | KPIs des équipements (actifs, inactifs, valeur totale, en panne) |
| `/api/v1/fournisseurs/stats` | GET | `Admin` | KPIs des fournisseurs (total, actifs/inactifs, montant global) |
| `/api/v1/users/stats` | GET | `Admin` | KPIs des utilisateurs (total, par rôle, actifs/inactifs) |

#### Format de réponse `GET /api/v1/pannes/stats` :
```json
{
  "success": true,
  "data": {
    "total": 54,        // Total déclaré (personnel pour Utilisateur, global pour Admin)
    "nouvelles": 10,    // Nouvelles — à traiter
    "enAttente": 8,     // En attente d'intervention sur site (besoin_intervention)
    "enCours": 5,       // En cours de réparation
    "resolues": 30,     // Résolues
    "cloturees": 5,     // Clôturées
    "urgentes": 15,     // Priorité urgente (Critique ou Élevé)
    "critiques": 8      // Priorité strictement Critique
  }
}
```

Toutes ces requêtes nécessitent l'envoi du jeton JWT dans l'en-tête HTTP :
```http
Authorization: Bearer <access_token>
```

---

## 3. Endpoint 1 : Statistiques Globales (GET /api/v1/dashboard)

### 3.1 Droits & Paramètres

- URL : `/api/v1/dashboard`
- Méthode : `GET`
- Rôles autorisés : `Admin`
- Paramètres : Aucun

### 3.2 Structure exacte de la réponse (200 OK)

```json
{
  "success": true,
  "data": {
    "usersCount": 6,
    "equipementsCount": 6,
    "typeEquipementsCount": 13,
    "fournisseursCount": 6,
    "montantTotal": 87949,
    "equipementsEnPanne": 2,
    "commandes": {
      "total": 9,
      "brouillon": 2,
      "emises": 0,
      "partiellementRecues": 3,
      "recues": 4,
      "annulees": 0,
      "montantTotal": 188170
    },
    "pannes": {
      "total": 54,
      "nouvelles": 54,
      "enCours": 0,
      "resolues": 0,
      "cloturees": 0,
      "critiques": 41,
      "besoinIntervention": 52,
      "repartitionParStructure": [
        {
          "structure": "CMC DE RATOMA",
          "total": 20
        },
        {
          "structure": "HOPITAL REGIONAL DE LABE",
          "total": 8
        },
        {
          "structure": "HOPITAL PREFECTORAL DE KOUROUSSA",
          "total": 7
        }
      ],
      "dernieresPannes": [
        {
          "_id": "6a9e8d0731c4e0a273835488",
          "reference": "PA-HRL-0008-0709",
          "structure_sanitaire": "HOPITAL REGIONAL DE LABE",
          "description": "Arrêt complet du serveur de gestion",
          "type_panne": "Espace/Système",
          "niveau_urgence": "Critique",
          "besoin_intervention": true,
          "statut": "NOUVELLE",
          "createdAt": "2026-09-07T10:08:07.014Z",
          "declarant": {
            "_id": "6a9e8ab131c4e0a273835469",
            "username": "mous",
            "nom": "camara",
            "prenom": "moussa",
            "tel": "620000000",
            "structure_sanitaire": "HOPITAL REGIONAL DE LABE"
          }
        }
      ]
    }
  }
}
```

### 3.3 Description détaillée des métriques

#### Inventaire & Ressources
- `usersCount` (number) : Nombre total d'utilisateurs actifs enregistrés.
- `equipementsCount` (number) : Nombre total d'équipements répertoriés.
- `typeEquipementsCount` (number) : Nombre de catégories d'équipements.
- `fournisseursCount` (number) : Nombre de fournisseurs et prestataires enregistrés.
- `montantTotal` (number) : Valeur totale cumulée du parc d'équipements (champ `prix` des équipements).
- `equipementsEnPanne` (number) : Nombre d'équipements distincts immobilisés dans une panne au statut `NOUVELLE` ou `EN_COURS`.

#### Commandes (`commandes`)
- `total` : Nombre total de commandes enregistrées.
- `brouillon` : Commandes au statut `BROUILLON`.
- `emises` : Commandes envoyées au fournisseur.
- `partiellementRecues` : Commandes ayant eu au moins une livraison partielle.
- `recues` : Commandes totalement réceptionnées.
- `annulees` : Commandes annulées.
- `montantTotal` : Total financier cumulé de toutes les commandes (champ `prixtotal`).

#### Pannes (`pannes`)
- `total` : Nombre total de déclarations de panne actives.
- `nouvelles` : Pannes au statut `NOUVELLE`.
- `enCours` : Pannes en cours de traitement (`EN_COURS`).
- `resolues` : Pannes résolues (`RESOLUE`).
- `cloturees` : Pannes clôturées (`CLOTUREE`).
- `critiques` : Pannes avec `niveau_urgence === "Critique"`.
- `besoinIntervention` : Pannes nécessitant une intervention physique (`besoin_intervention === true`).
- `repartitionParStructure` : Tableau d'objets `{ structure, total }` ordonné du plus grand au plus petit nombre de pannes par établissement de santé.
- `dernieresPannes` : Les 5 dernières pannes créées avec coordonnées du déclarant (`declarant.username`, `declarant.nom`, `declarant.prenom`, `declarant.tel`, `declarant.structure_sanitaire`).

---

## 4. Endpoint 2 : Statistiques Utilisateur / Pannes (GET /api/v1/pannes/stats)

### 4.1 Droits & Filtrage automatique

- URL : `/api/v1/pannes/stats`
- Méthode : `GET`
- Rôles autorisés : `Utilisateur`, `Admin`
- Paramètres : Aucun
- **Filtrage automatique** :
  - Si l'utilisateur connecté a le rôle `Utilisateur`, le backend filtre automatiquement sur `declarant: user.id`. Il ne reçoit que ses propres statistiques.
  - Si l'utilisateur a le rôle `Admin`, il reçoit les statistiques globales des pannes.

### 4.2 Structure exacte de la réponse (200 OK)

```json
{
  "success": true,
  "data": {
    "total": 48,
    "nouvelles": 48,
    "enAttente": 46,
    "besoinIntervention": 46,
    "enCours": 0,
    "resolues": 0,
    "cloturees": 0,
    "urgentes": 36,
    "critiques": 36
  }
}
```

> **Note :** Les 5 dernières pannes (`dernieresPannes`) et la répartition par structure (`repartitionParStructure`) ne sont **pas** présentes ici : elles sont réservées exclusivement au Dashboard Admin global (`GET /api/v1/dashboard`).

### 4.3 Description détaillée des métriques

Toutes ces valeurs concernent uniquement les déclarations faites par l'utilisateur connecté :
- `total` : Nombre total de pannes qu'il a signalées.
- `nouvelles` : Ses déclarations au statut `NOUVELLE` (à traiter).
- `enAttente` / `besoinIntervention` : Ses pannes nécessitant une intervention (`besoin_intervention === true`).
- `enCours` : Ses signalements en cours de prise en charge (`EN_COURS`).
- `resolues` : Ses pannes réparées (`RESOLUE`).
- `cloturees` : Ses pannes clôturées (`CLOTUREE`).
- `urgentes` : Ses signalements à priorité urgente (`Critique` ou `Élevé`).
- `critiques` : Ses signalements strictement classés `Critique`.

---

## 5. Endpoint 3 : Évolution Mensuelle pour Graphiques (GET /api/v1/dashboard/charts/monthly)

### 5.1 Droits & Paramètres de requête

- URL : `/api/v1/dashboard/charts/monthly`
- Méthode : `GET`
- Rôles autorisés : `Admin`
- Paramètre Query :
  - `year` (optionnel, entier) : Année souhaitée (ex: `?year=2026`). Si absent ou invalide, l'année courante est prise par défaut.

### 5.2 Structure exacte de la réponse (200 OK)

Le tableau `mois` contient **toujours exactement 12 éléments** ordonnés de Janvier (1) à Décembre (12) :

```json
{
  "success": true,
  "data": {
    "annee": 2026,
    "mois": [
      {
        "mois": "Janvier",
        "moisNumero": 1,
        "pannes": {
          "total": 12,
          "resolues": 9
        },
        "commandes": {
          "total": 3,
          "montantTotal": 4500000
        }
      },
      {
        "mois": "Février",
        "moisNumero": 2,
        "pannes": {
          "total": 8,
          "resolues": 7
        },
        "commandes": {
          "total": 5,
          "montantTotal": 8200000
        }
      }
    ]
  }
}
```

### 5.3 Exploitation pour les graphiques

- Graphique Pannes (Courbe / Barres) :
  - Axe X : `item.mois`
  - Série Total : `item.pannes.total`
  - Série Résolues : `item.pannes.resolues` (englobe statuts `RESOLUE` et `CLOTUREE`)
- Graphique Commandes & Budget :
  - Axe X : `item.mois`
  - Axe Y1 : `item.commandes.total`
  - Axe Y2 : `item.commandes.montantTotal`

---

## 6. Rappel : Droits Harmonisés sur le Module Panne

Pour rappel, les routes `/pannes` sont toutes ouvertes aux rôles `Admin` et `Utilisateur` :

| Route | Méthode | Rôles | Note |
| :--- | :--- | :--- | :--- |
| `/api/v1/pannes` | GET | `Admin`, `Utilisateur` | Liste filtrable et paginée |
| `/api/v1/pannes/:id` | GET | `Admin`, `Utilisateur` | Détail d'une panne |
| `/api/v1/pannes` | POST | `Admin`, `Utilisateur` | Déclaration d'une panne |
| `/api/v1/pannes/:id` | PATCH | `Admin`, `Utilisateur` | Modification d'une panne |
| `/api/v1/pannes/:id` | DELETE | `Admin`, `Utilisateur` | Suppression logique |

Lors du `POST /pannes`, les champs `reference`, `structure_sanitaire` et `declarant` sont automatiquement assignés par le backend depuis le compte de l'utilisateur connecté.

---

## 7. Résumé des Pièges à Éviter (Anti-Erreurs Frontend)

1. **Préfixe d'URL :** Toujours préfixer par `/api/v1` (ex: `/api/v1/dashboard`).
2. **Pas d'email dans le profil utilisateur :** Le schéma `User` contient `username`, `nom`, `prenom`, `tel`, `type`, `structure_sanitaire`. Il n'y a pas de champ `email`. Utiliser `declarant.username` ou `declarant.tel` pour contacter l'auteur.
3. **Cas de casse des statuts :**
   - En base et en retour d'API : `NOUVELLE`, `EN_COURS`, `RESOLUE`, `CLOTUREE` (majuscules).
   - En paramètre de requête pour lister les pannes : minuscules acceptées (`?statut=nouvelle`).
4. **Gestion des rôles :**
   - Les deux rôles officiels sont `"Admin"` et `"Utilisateur"`.
   - `GET /api/v1/dashboard` et `GET /api/v1/dashboard/charts/monthly` sont strictement réservés au rôle `"Admin"`.
   - `GET /api/v1/pannes/stats` est accessible aux rôles `"Utilisateur"` et `"Admin"`.
5. **Tableau des 12 mois :** Pas besoin de combler les mois vides, le backend renvoie toujours 12 entrées avec des valeurs à 0 si aucun événement n'a eu lieu.
