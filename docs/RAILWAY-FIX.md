# 🚨 Résolution erreur Railway Build

## Erreur rencontrée

```
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c cd ../web && pnpm build" did not complete successfully: exit code: 1
```

## Cause

Le problème vient de l'utilisation de chemins relatifs (`cd ../web`) dans un contexte Docker où le répertoire de travail n'est pas celui attendu.

## Solution

### 1. Utiliser les filtres pnpm (✅ Recommandé)

Modifier `nixpacks.toml` :

```toml
[phases.setup]
nixPkgs = ["nodejs_18", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = [
  "pnpm --filter api build",
  "pnpm --filter web build"
]

[start]
cmd = "pnpm --filter api start:prod"
```

### 2. Modifier les configurations Railway

**apps/api/railway.toml :**
```toml
[deploy]
startCommand = "pnpm --filter api start:prod"
```

**apps/web/railway.toml :**
```toml
[deploy]
startCommand = "pnpm --filter web preview --host 0.0.0.0 --port 3000"
```

### 3. Mettre à jour GitHub Actions

**.github/workflows/deploy.yml :**
```yaml
- name: Run tests
  run: |
    pnpm --filter api test
    pnpm --filter web test:run

- name: Build applications
  run: |
    pnpm --filter api build
    pnpm --filter web build
```

## Vérification

Testez en local :

```bash
# Tests
pnpm --filter api test
pnpm --filter web test:run

# Builds
pnpm --filter api build
pnpm --filter web build
```

## Alternative : Déploiement séparé

Si le problème persiste, déployez chaque service séparément :

```bash
# Déployer l'API
cd apps/api
railway up

# Déployer le frontend
cd apps/web
railway up
```

## ✅ Résultat attendu

- Build réussi sur Railway
- Services déployés correctement
- Health check accessible : `https://your-app.railway.app/api/health`

---

**VetaVet** - Résolution erreur Railway 🐾
