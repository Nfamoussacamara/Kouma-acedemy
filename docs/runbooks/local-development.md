# Runbook — Développement local

## Prérequis

- Node.js ≥ 20
- npm ou pnpm
- MongoDB 7+ (local ou Docker)

## MongoDB

```bash
docker compose up -d mongodb
```

URI par défaut : `mongodb://localhost:27017/starterkit_back` (voir `MONGODB_URI` dans `.env`).

## Démarrage

```bash
cp .env.example .env
npm install
npm run dev
```

## Vérifications

| Check | Commande / URL |
|-------|----------------|
| Health | `curl http://localhost:3000/health` |
| Swagger (dev) | http://localhost:3000/docs |

## Inscrire un utilisateur (public)

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123",
    "firstName": "Alice",
    "lastName": "Martin"
  }'
```

## Lister les utilisateurs (auth requise)

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer demo-token"
```

## Dépannage

- **Port occupé** : modifier `PORT` dans `.env`
- **CORS** : ajuster `CORS_ORIGIN` (liste séparée par virgules)
