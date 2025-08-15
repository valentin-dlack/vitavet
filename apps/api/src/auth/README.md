# 🔐 Authentication Module

Ce module gère l'authentification des utilisateurs avec inscription, connexion et gestion des tokens JWT.

## Endpoints

### POST /api/auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse:**
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token",
  "message": "User registered successfully. Please check your email for verification."
}
```

### POST /api/auth/login
Connexion d'un utilisateur existant.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Réponse:**
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token",
  "message": "Login successful"
}
```

## Validation

### Email
- Format email valide
- Requis

### Password
- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial (@$!%*?&)

### First Name / Last Name
- Minimum 2 caractères
- Maximum 50 caractères
- Requis

## Sécurité

- **Bcrypt** : Hachage des mots de passe avec salt rounds = 10
- **JWT** : Tokens d'authentification avec expiration 24h
- **Rate Limiting** : Protection contre les attaques par force brute
- **Validation DTO** : Validation stricte des données d'entrée

## Tests

```bash
# Tests unitaires
pnpm test

# Tests e2e
pnpm test:e2e
```

## Utilisation

### Frontend
```typescript
import { authService } from '../services/auth.service';

// Inscription
const response = await authService.register({
  email: 'user@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe'
});

// Connexion
const response = await authService.login({
  email: 'user@example.com',
  password: 'Password123!'
});
```

### Stockage du token
Le token JWT est automatiquement stocké dans le localStorage et peut être utilisé pour les requêtes authentifiées.

## Erreurs

- **409 Conflict** : Email déjà utilisé
- **401 Unauthorized** : Identifiants invalides
- **400 Bad Request** : Données de validation invalides
- **429 Too Many Requests** : Rate limit dépassé
