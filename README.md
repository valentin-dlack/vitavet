# VitaVet - Monorepo React + NestJS + PostgreSQL

Monorepo minimal avec React (front) + NestJS (back) + PostgreSQL, prêt pour le développement local et le déploiement sur Railway.

## 🚀 Quick Start

### Prérequis
- Node 20+
- pnpm (`npm i -g pnpm`)
- (Optionnel) Docker pour PostgreSQL local

### Installation
```bash
# Installer les dépendances
pnpm install

# Lancer les deux applications en local
pnpm dev
```

### URLs locales
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api/health

## 📁 Structure

```
vitavet/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## 🛠️ Développement

### Lancer en local
```bash
# Les deux apps ensemble
pnpm dev

# Ou séparément
cd apps/api && pnpm start:dev
cd apps/web && pnpm dev
```

### Base de données locale (optionnel)
```bash
docker compose up -d
```

## 🚀 Déploiement Railway

### 1. API
- New Project → Deploy from GitHub
- Dossier: `apps/api`
- Variables: `PORT=3000`
- Build: `pnpm install && pnpm build`
- Start: `node dist/main.js`

### 2. Web
- Même projet → Add Service → Deploy from GitHub
- Dossier: `apps/web`
- Variables: `VITE_API_URL=https://your-api-url.up.railway.app/api`
- Build: `pnpm install && pnpm build`
- Start: `pnpm preview --host 0.0.0.0 --port 5173`

## ✅ Checklist

- [x] Bootstrap du monorepo
- [x] API NestJS avec endpoint `/api/health`
- [x] Front React branché sur l'API
- [x] Configuration Docker PostgreSQL
- [x] Script de développement avec concurrently
- [x] Test local fonctionnel
- [ ] Git de base
- [ ] Déploiement Railway - API
- [ ] Déploiement Railway - Web

## 🔧 Prochaines étapes

- Ajouter Prisma pour la base de données
- Tests unitaires et e2e
- CI/CD avec GitHub Actions
- Variables d'environnement pour la production
