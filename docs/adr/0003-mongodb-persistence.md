# ADR 0003 — Persistance MongoDB avec Mongoose (ORM)

## Statut

Accepté

## Décision

**Mongoose** est l’ORM unique pour MongoDB :

| Couche | Fichier | Rôle |
|--------|---------|------|
| Connexion | `src/infrastructure/database/mongoose.js` | Instance Mongoose partagée |
| Connexion | `src/infrastructure/database/connection.js` | `connect` / `disconnect` |
| Schéma ORM | `modules/*/infrastructure/persistence/schemas/*.schema.js` | `mongoose.Schema`, virtuals, `toJSON` |
| Modèle ORM | `modules/*/infrastructure/persistence/models/*.model.js` | `mongoose.model()` |
| Repository | `repositories/` | CRUD via `UserModel` uniquement (`document.toJSON()`) |
| Validators | `validators/` (Joi) | Validation des entrées HTTP |

Pas de couche `domain/*.entity.js` : le modèle Mongoose + Joi couvrent persistance et validation.

## Conséquences

- Validations entrée : Joi (`validators/`)
- Validations persistance : schéma Mongoose (`required`, `unique`, `runValidators` sur update)
- Sérialisation API : `toJSON` + virtual `id`, exclusion du `password`
