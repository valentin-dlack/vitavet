# 🐘 Base de données PostgreSQL

## Configuration

VitaVet utilise PostgreSQL comme base de données principale avec TypeORM comme ORM.

### Variables d'environnement

Créez un fichier `.env` dans `apps/api/` avec :

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=vitavet

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Environment
NODE_ENV=development
```

## Installation

### Option 1: Docker (Recommandé)

```bash
# Démarrer PostgreSQL avec Docker
docker compose up -d

# Vérifier que la base de données est prête
docker compose ps
```

### Option 2: Installation locale

1. **Télécharger PostgreSQL** : https://www.postgresql.org/download/
2. **Ou installer via Chocolatey** : `choco install postgresql`
3. **Créer la base de données** :
   ```bash
   psql -U postgres -c "CREATE DATABASE vitavet;"
   ```

## Démarrage

### Avec base de données
```bash
# Démarrer avec vérification automatique de PostgreSQL
pnpm run dev:db
```

### Sans base de données (fallback)
```bash
# Démarrer normalement
pnpm run dev
```

## Structure de la base de données

### Table `users`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `email` | VARCHAR | Email unique |
| `password` | VARCHAR | Mot de passe hashé |
| `firstName` | VARCHAR | Prénom |
| `lastName` | VARCHAR | Nom |
| `isEmailVerified` | BOOLEAN | Email vérifié |
| `createdAt` | TIMESTAMP | Date de création |
| `updatedAt` | TIMESTAMP | Date de modification |

## Migration automatique

En mode développement (`NODE_ENV=development`), TypeORM crée automatiquement les tables avec `synchronize: true`.

⚠️ **Attention** : Désactivez `synchronize` en production et utilisez des migrations.

## Connexion à la base de données

```bash
# Connexion via psql
psql -U postgres -d vitavet

# Lister les tables
\dt

# Voir la structure d'une table
\d users

# Requête simple
SELECT * FROM users;
```

## Sauvegarde et restauration

### Sauvegarde
```bash
pg_dump -U postgres vitavet > backup.sql
```

### Restauration
```bash
psql -U postgres vitavet < backup.sql
```

## Dépannage

### Erreur de connexion
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez les variables d'environnement
- Vérifiez que la base de données `vitavet` existe

### Erreur de permissions
```bash
# Donner les permissions à l'utilisateur postgres
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE vitavet TO postgres;"
```

### Reset de la base de données
```bash
# Supprimer et recréer la base de données
psql -U postgres -c "DROP DATABASE IF EXISTS vitavet;"
psql -U postgres -c "CREATE DATABASE vitavet;"
```

