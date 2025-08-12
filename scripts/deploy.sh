#!/bin/bash

# Script de déploiement local pour Railway
echo "🚀 Déploiement VetaVet sur Railway..."

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installez-le avec: npm install -g @railway/cli"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Railway. Connectez-vous avec: railway login"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Lancer les tests
echo "🧪 Lancement des tests..."
pnpm --filter api test
pnpm --filter web test:run

# Build des applications
echo "🔨 Build des applications..."
pnpm --filter api build
pnpm --filter web build

# Déploiement
echo "🚀 Déploiement sur Railway..."
railway up

echo "✅ Déploiement terminé !"
echo "🌐 Votre application est accessible sur: https://your-app-name.railway.app"
