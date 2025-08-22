# 🚀 VetaVet - Configuration Railway

## Déploiement automatique avec GitHub Actions + Railway

Ce projet est configuré pour un déploiement automatique sur Railway via GitHub Actions.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions │───▶│    Railway      │
│                 │    │                 │    │                 │
│ - Push main     │    │ - Tests         │    │ - API Service   │
│ - Pull Request  │    │ - Build         │    │ - Web Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prérequis

### 1. Compte Railway
- Créer un compte sur [Railway](https://railway.app)
- Créer un nouveau projet

### 2. GitHub Secrets
Ajouter ces secrets dans votre repository GitHub :

```bash
RAILWAY_TOKEN=your_railway_token
RAILWAY_PROJECT_ID=your_project_id
```

### 3. Railway CLI (optionnel)
```bash
npm install -g @railway/cli
railway login
```

## 🔧 Configuration

### Variables d'environnement Railway
```bash
NODE_ENV=production
PORT=3000
```

### Services Railway
- **API Service** : Port 3000, Health check `/api/health`
- **Web Service** : Port 3000, Build Vite

## 🚀 Déploiement

### Automatique (GitHub Actions)
1. **Push sur main** → Déploiement production
2. **Pull Request** → Déploiement preview

### Manuel
```bash
# Déploiement complet
./scripts/deploy.sh

# Ou déploiement individuel
cd apps/api && railway up
cd apps/web && railway up
```

## ✅ Vérification

### Health Check
```bash
curl https://your-app.railway.app/api/health
```

### Réponse attendue
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

## 📁 Structure des fichiers

```
vitavet/
├── .github/workflows/deploy.yml    # GitHub Actions
├── railway.json                    # Configuration Railway
├── nixpacks.toml                   # Build configuration
├── .railwayignore                  # Fichiers ignorés
├── scripts/deploy.sh               # Script de déploiement
├── docs/ci-cd.md                   # Documentation CI/CD
├── apps/
│   ├── api/
│   │   ├── railway.toml            # Config API
│   │   └── package.json            # Scripts de build/start
│   └── web/
│       ├── railway.toml            # Config Web
│       └── package.json            # Scripts de build/start
```

## 🔍 Monitoring

### Logs
```bash
railway logs --tail
```

### Status
```bash
railway status
```

### Variables
```bash
railway variables
```

## 🐛 Troubleshooting

### Erreurs courantes

1. **Build échoue**
   ```bash
   # Vérifier les logs
   railway logs
   
   # Vérifier la configuration
   cat nixpacks.toml
   ```

2. **Health check échoue**
   ```bash
   # Vérifier que l'API démarre
   curl https://your-app.railway.app/api/health
   
   # Vérifier les variables d'environnement
   railway variables
   ```

3. **Port déjà utilisé**
   ```bash
   # Vérifier la variable PORT
   railway variables
   ```

## 📚 Documentation complète

Voir [docs/ci-cd.md](docs/ci-cd.md) pour la documentation détaillée.

## 🎯 Critères d'acceptation US-09

- ✅ Déploiement via GitHub Actions
- ✅ Preview pour chaque PR
- ✅ Build + start commands configurés
- ✅ PORT=3000 configuré
- ✅ `/api/health` accessible
- ✅ Tests automatiques avant déploiement
- ✅ Documentation complète

---

**VetaVet** - Système de gestion vétérinaire avec CI/CD automatisé 🐾
