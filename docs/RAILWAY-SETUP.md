# 🚀 Configuration Railway - Guide étape par étape

## Prérequis

- Compte GitHub
- Repository `vitavet` sur GitHub
- Railway CLI installé : `npm install -g @railway/cli`

## Étape 1 : Créer le projet Railway

### 1.1 Aller sur Railway
- Ouvrir [Railway](https://railway.app)
- Se connecter avec votre compte GitHub

### 1.2 Créer un nouveau projet
- Cliquer sur "New Project"
- Choisir "Deploy from GitHub repo"
- Sélectionner votre repository `vitavet`
- Donner un nom au projet (ex: "vitavet")
- Cliquer sur "Deploy Now"

## Étape 2 : Obtenir les informations de connexion

### 2.1 Railway Token
1. Dans le projet Railway, aller dans "Settings"
2. Section "Tokens"
3. Cliquer sur "New Token"
4. Donner un nom (ex: "GitHub Actions")
5. Copier le token généré

### 2.2 Project ID
1. Dans "Settings" du projet
2. Section "General"
3. Copier le "Project ID"

## Étape 3 : Configurer GitHub Secrets

### 3.1 Aller dans GitHub
1. Ouvrir votre repository `vitavet` sur GitHub
2. Aller dans "Settings" > "Secrets and variables" > "Actions"

### 3.2 Ajouter les secrets
Cliquer sur "New repository secret" et ajouter :

```
Name: RAILWAY_TOKEN
Value: votre_token_railway
```

```
Name: RAILWAY_PROJECT_ID
Value: votre_project_id
```

## Étape 4 : Lier le projet local

### 4.1 Se connecter à Railway CLI
```bash
railway login
```

### 4.2 Lier le projet
```bash
railway link
```
- Sélectionner votre projet "vitavet"

## Étape 5 : Configurer les variables d'environnement

### 5.1 Dans Railway Dashboard
1. Aller dans votre projet
2. Section "Variables"
3. Ajouter :
   ```
   NODE_ENV=production
   PORT=3000
   ```

## Étape 6 : Premier déploiement

### 6.1 Test local
```bash
# Vérifier que tout fonctionne
pnpm install
cd apps/api && pnpm test
cd ../web && pnpm test:run
cd ../api && pnpm build
cd ../web && pnpm build
```

### 6.2 Déploiement manuel

#### Option A : Déploiement depuis la racine (recommandé)
```bash
# Déployer l'API
railway up --service api

# Déployer le frontend
railway up --service web
```

#### Option B : Déploiement depuis les sous-dossiers
```bash
# Déployer l'API
cd apps/api
railway up

# Déployer le frontend
cd apps/web
railway up
```

### 6.3 Déploiement automatique
- Faire un push sur la branche `main`
- Le workflow GitHub Actions se déclenchera automatiquement

## Étape 7 : Vérification

### 7.1 Health Check
```bash
curl https://your-app.railway.app/api/health
```

### 7.2 Réponse attendue
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

## Troubleshooting

### Erreur "No linked project found"
```bash
# Vérifier que vous êtes connecté
railway whoami

# Lier le projet
railway link
```

### Erreur de build
```bash
# Vérifier les logs
railway logs

# Vérifier la configuration
cat nixpacks.toml

# Erreur "cd ../web && pnpm build" échoue
# Solution : Utiliser les filtres pnpm
# Modifier nixpacks.toml pour utiliser :
# pnpm --filter api build
# pnpm --filter web build
```

### Erreur de variables d'environnement
```bash
# Vérifier les variables
railway variables

# Ajouter les variables manquantes
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

## Commandes utiles

```bash
# Voir les projets
railway projects

# Voir le status
railway status

# Voir les logs
railway logs --tail

# Redémarrer un service
railway service restart

# Voir les variables
railway variables
```

## Structure finale

```
vitavet/
├── .github/workflows/deploy.yml    # ✅ GitHub Actions
├── railway.json                    # ✅ Configuration Railway
├── nixpacks.toml                   # ✅ Build configuration
├── .railwayignore                  # ✅ Fichiers ignorés
├── scripts/deploy.sh               # ✅ Script de déploiement
├── docs/ci-cd.md                   # ✅ Documentation CI/CD
├── docs/RAILWAY-SETUP.md           # ✅ Ce guide
├── apps/
│   ├── api/
│   │   ├── railway.toml            # ✅ Config API
│   │   └── package.json            # ✅ Scripts de build/start
│   └── web/
│       ├── railway.toml            # ✅ Config Web
│       └── package.json            # ✅ Scripts de build/start
```

## ✅ Checklist de configuration

- [ ] Projet créé sur Railway
- [ ] Railway Token obtenu
- [ ] Project ID obtenu
- [ ] GitHub Secrets configurés
- [ ] Projet local lié
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Health check accessible
- [ ] Tests automatiques fonctionnels

---

**VetaVet** - Configuration Railway complète 🐾
