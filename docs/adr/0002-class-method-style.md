# ADR 0002 — Style des méthodes de module

## Statut

Accepté

## Décision

**Controller**, **service** et **repository** partagent le même format :

```javascript
static createUser = async (dto) => {
  return UserRepository.create({ ... });
};
```

Câblage au démarrage du module (`index.js`) :

```javascript
new UserController();
const routes = createUserRoutes();
```

Appels **toujours sur la classe** :

```javascript
await UserService.createUser(dto);   // ✓
await userService.createUser(dto);   // ✗
```

## Conséquences

- Routes : handlers statiques du controller
- Tests d’intégration : `UserService.createUser(...)` après `setupTestDatabase()`
