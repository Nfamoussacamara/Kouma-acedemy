# ADR 0001 — Architecture modulaire par feature

## Statut

Accepté

## Contexte

Le backend doit évoluer avec plusieurs domaines métier sans couplage fort ni fichiers monolithiques.

## Décision

Organiser le code par **module** (`src/modules/<name>/`) avec les couches :

| Couche | Responsabilité |
|--------|----------------|
| `repositories/` | Persistance et accès données (modèles Mongoose) |
| `services/` | Orchestration des cas d’usage |
| `controllers/` | Adaptation HTTP (req/res) |
| `routes/` | Définition des endpoints et middlewares de route |
| `infrastructure/` | Schémas/modèles ORM, clients HTTP, brokers, etc. |
| `validators/` | Schémas Joi spécifiques au module |

Les éléments transverses (`middlewares/`, `validators/common`, `config/`, `shared/`) restent à la racine de `src/`.

## Conséquences

- Chaque nouveau domaine = nouveau dossier sous `modules/` + enregistrement dans `src/routes/index.js`.
- Les tests peuvent cibler une couche (unit sur schémas ORM, integration sur `services/` + `repositories/`).
- Le fichier `index.js` du module sert de **composition root** (injection de dépendances manuelle).
