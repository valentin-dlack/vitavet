# 🐾 VitaVet - Plateforme de Gestion Vétérinaire

> **Application web de gestion des rendez-vous vétérinaires avec suivi des animaux et notifications intelligentes**

VitaVet est une plateforme complète permettant la gestion des rendez-vous avec des vétérinaires. Elle offre la recherche de cliniques, la prise de rendez-vous, le suivi des animaux avec profil détaillé, et la gestion des rappels médicamenteux (vaccins, vermifuges, anti-puces) via notifications desktop et push.

## 📋 Cahier de Recette et Documentation Qualité **(C 2.3.1)**

**🎯 [CAHIER DE RECETTE COMPLET](./docs/CAHIER_DE_RECETTE.md)** - Documentation complète des tests. 

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js** 20+ LTS
- **pnpm** 9+ (`npm i -g pnpm`)
- **Docker** (pour PostgreSQL local)
- **Git** pour le clonage

### Installation Complète
```bash
# 1. Cloner le projet
git clone <repo-url>
cd vitavet

# 2. Installer les dépendances
pnpm install

# 3. Lancer PostgreSQL avec Docker
docker compose up -d

# 4. Initialiser la base de données avec données de test
pnpm db:reset      # Reset complet de la DB
pnpm api:seed      # Insertion des données + créneaux automatiques

# 5. Démarrer l'application complète
pnpm dev           # Lance API (3000) + Web (5173) simultanément
```

### URLs d'Accès
- 🌐 **Frontend** : http://localhost:5173
- 🔌 **API** : http://localhost:3000/api/health
- 📚 **Documentation API** : http://localhost:3000/api/docs (Swagger)
- 🗄️ **Base de données** : localhost:5432 (vitavet/postgres/postgres)

### Comptes de Test (Seed Automatique)
```
OWNER     : owner@example.com / password123
VET       : vet1@example.com  / password123
ASV       : asv@example.com   / password123
ADMIN     : admin@example.com / password123
WEBMASTER : webmaster@example.com / password123
```

---

## 🔒 Sécurité - Conformité OWASP Top 10 **(C 2.2.3)**

### Protection Implémentée

#### 🛡️ **A01 - Broken Access Control** → RBAC Complet
- **📁 [Guard RBAC](./apps/api/src/auth/guards/roles.guard.ts)** - Contrôle d'accès basé sur les rôles
- **📁 [Décorateur Roles](./apps/api/src/auth/decorators/roles.decorator.ts)** - Attribution des permissions
- **📁 [Stratégie JWT](./apps/api/src/auth/strategies/jwt.strategy.ts)** - Validation des tokens avec rôles

**Rôles :** OWNER, VET, ASV, ADMIN_CLINIC, WEBMASTER avec permissions granulaires

#### 🔐 **A02 - Cryptographic Failures** → Bcrypt + JWT
- **📁 [Service Utilisateurs](./apps/api/src/users/users.service.ts)** - Hash bcrypt (saltRounds=10)
- **📁 [Service Auth](./apps/api/src/auth/auth.service.ts)** - Génération JWT sécurisé
- **📁 [Configuration JWT](./apps/api/src/auth/strategies/jwt.strategy.ts)** - Secret et expiration

#### 🚦 **A06 - Security Misconfiguration** → Rate Limiting
- **📁 [Configuration Rate Limit](./apps/api/src/main.ts)** - 100 req/min par IP
- **📁 [Tests Rate Limiting](./apps/api/test/throttler.e2e-spec.ts)** - Validation automatisée

#### 🛡️ **A05 - Security Misconfiguration** → Headers Sécurisés
- **📁 [Configuration Helmet](./apps/api/src/main.ts)** - Headers sécurisés (CSP, HSTS)
- **📁 [Tests Sécurité](./apps/api/test/security.e2e-spec.ts)** - Validation headers

**Tests de Sécurité :** [Voir section Tests E2E](#-tests-e2e-et-sécurité)

---

## ♿ Accessibilité - Conformité WCAG 2.1 AA **(C 2.2.3)**

### Implémentation React Accessible

#### 🎯 **Navigation Clavier et Focus**
- **📁 [App Principal](./apps/web/src/App.tsx)** - Skip links et structure sémantique
- **📁 [Composant ProtectedRoute](./apps/web/src/components/ProtectedRoute.tsx)** - Navigation accessible

#### 🏷️ **Labels ARIA et Sémantique**
- **📁 [Formulaire Login](./apps/web/src/components/LoginForm.tsx)** - ARIA labels et validation
- **📁 [Formulaire Register](./apps/web/src/components/RegisterForm.tsx)** - Accessibilité formulaires
- **📁 [Modal Profil](./apps/web/src/components/ProfileEditModal.tsx)** - Gestion focus et ARIA

#### 📱 **Responsive et Messages d'État**
- **📁 [Page d'Accueil](./apps/web/src/pages/Home.tsx)** - Messages aria-live
- **📁 [Composant Pagination](./apps/web/src/components/Pagination.tsx)** - Navigation accessible

#### 🎨 **Design System Accessible**
- **📁 [CSS Principal](./apps/web/src/index.css)** - Contraste et focus ring
- **📁 [Configuration Tailwind](./apps/web/tailwind.config.js)** - Thème accessible

**Cible de score Lighthouse :** ≥ 85/100 sur toutes les pages principales  
**Tests A11Y :** Navigation complète au clavier + lecteur d'écran

---

## 🧪 Couverture de Tests - Qualité du Code **(C 2.2.2)**

### 📊 Rapports de Couverture
- **📈 [Rapport Coverage Détaillé](./docs/coverage_summary.md)** - Métriques complètes
- **🔗 [Dernière Release avec Coverage](https://github.com/valentin-dlack/vitavet/pull/30)** - CI/CD avec résultats

### Métriques Actuelles
```bash
# Générer les rapports localement
pnpm coverage                    # Tests unitaires + E2E
pnpm coverage:summary           # Rapport markdown détaillé
```

**Couverture Cible :**
- **Statements :** ≥ 70%
- **Branches :** ≥ 80%  
- **Functions :** ≥ 70%
- **Lines :** ≥ 70%

### Tests Unitaires (Jest + Vitest)

#### 📁 **Tests API (Jest)**
- **📁 [Tests Auth Service](./apps/api/src/auth/auth.service.spec.ts)** - Sécurité bcrypt + JWT
- **📁 [Tests Users Service](./apps/api/src/users/users.service.spec.ts)** - Gestion utilisateurs + rôles
- **📁 [Tests Appointments](./apps/api/src/appointments/appointments.service.spec.ts)** - Logique métier RDV
- **📁 [Tests Clinics](./apps/api/src/clinics/clinics.service.spec.ts)** - Recherche et gestion cliniques

#### 📁 **Tests Frontend (Vitest)**
- **📁 [Tests Composants](./apps/web/src/components/__tests__/)** - Composants React accessibles
- **📁 [Tests Pages](./apps/web/src/pages/__tests__/)** - Pages principales et navigation
- **📁 [Tests Services](./apps/web/src/services/__tests__/)** - Services API frontend

---

## 🔬 Tests E2E et Sécurité **(C 2.2.2)**

### Tests End-to-End (Supertest)

#### 📁 **Tests Sécurité E2E**
- **📁 [Tests Sécurité Globaux](./apps/api/test/security.e2e-spec.ts)** - RBAC, headers, validation
- **📁 [Tests Rate Limiting](./apps/api/test/throttler.e2e-spec.ts)** - Protection DDoS automatisée
- **📁 [Tests Authentification](./apps/api/test/app.e2e-spec.ts)** - JWT, login, permissions

#### 📁 **Tests Fonctionnels E2E**
- **📁 [Tests Slots](./apps/api/test/slots.e2e-spec.ts)** - Créneaux et disponibilités
- **📁 [Tests Reminders](./apps/api/test/reminders.e2e-spec.ts)** - Notifications et rappels
- **📁 [Tests Health](./apps/api/test/health.e2e-spec.ts)** - Monitoring et disponibilité

### Tests de Sécurité Automatisés
- **Rate Limiting :** 100 req/min par IP → 429
- **RBAC :** Permissions par rôle → 403 si insuffisant
- **JWT :** Tokens expirés/invalides → 401
- **Validation :** Données malformées → 400
- **Headers :** Helmet sécurisé → CSP, HSTS, etc.

**Exécution :** `pnpm test:e2e` - Intégré dans la CI/CD

---

## 🔄 CI/CD - Déploiement Continu **(C 2.1.2 & C 2.2.4)**

### GitHub Actions - Pipeline Automatisé

#### 🚀 **Déclencheurs et Branches**
```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

#### 🧪 **Étapes d'Exécution**
| Déclencheur | Branche | Actions Exécutées |
|-------------|---------|-------------------|
| **Push** | `main` | Build → Tests unitaires → Tests E2E → Déploiement prod |
| **Push** | `develop` | Build → Tests unitaires → Tests E2E → Déploiement preview |
| **Pull Request** | `main` | Build → Tests unitaires → Tests E2E → Blocage si échec |
| **Pull Request** | `develop` | Tests unitaires → Validation code |

#### 📋 **Pipeline Détaillé**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Tests unitaires API
        run: pnpm --filter api test --coverage
      
      - name: Tests unitaires Web  
        run: pnpm --filter web test:run --coverage
        
      - name: Tests E2E sécurité
        run: pnpm --filter api test:e2e
        
      - name: Lint & Format
        run: pnpm lint && pnpm format
        
      - name: Build production
        run: pnpm build
```

#### 🚦 **Critères de Blocage**
- ❌ **Tests unitaires** échoués → PR bloquée
- ❌ **Tests E2E** échoués → Déploiement annulé  
- ❌ **Build** échoué → Pipeline arrêté
- ❌ **Linting** échoué → Qualité code non respectée

---

## 🚂 Déploiement Railway **(C 2.1.2)**

### Configuration Automatisée

#### 🔧 **API Backend**
```toml
# railway.toml - Configuration API
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
```

#### 🌐 **Frontend Web**
```toml
# railway.toml - Configuration Web  
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm build"

[deploy] 
startCommand = "pnpm preview --host 0.0.0.0 --port $PORT"
```

#### 🔗 **Variables d'Environnement**
```bash
# API
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=${{secrets.JWT_SECRET}}

# Web
VITE_API_URL=https://vitavet-api.up.railway.app/api
```

### Déploiement Multi-Environnements
- **Production :** `main` branch → vitavet-prod.up.railway.app
- **Staging :** `develop` branch → vitavet-staging.up.railway.app  
- **Preview :** Pull Requests → URLs temporaires

---

## 🐳 Dockerisation PostgreSQL

### Configuration Docker Compose
```yaml
# docker-compose.yml - Base de données locale
version: '3.8'
services:
  db:
    image: postgres:13
    restart: always
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: vitavet
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: postgres
      
volumes:
  db_data:
```

### Gestion des Données
```bash
# Commandes de gestion DB
pnpm db:reset              # Drop + Create schema
pnpm api:seed             # Insertion données de test
docker compose up -d      # Démarrage PostgreSQL
docker compose down       # Arrêt avec conservation données
docker compose down -v    # Arrêt avec suppression volumes
```

### Migration et Schema
```typescript
// apps/api/src/data-source.ts - Configuration TypeORM
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vitavet',
  synchronize: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
});
```

---

## 🏗️ Architecture du Projet **(C 2.2.1)**

### Structure Monorepo
```
vitavet/
├── apps/
│   ├── api/                    # Backend NestJS + TypeORM
│   │   ├── src/
│   │   │   ├── auth/          # Authentification JWT + RBAC
│   │   │   ├── users/         # Gestion utilisateurs + rôles
│   │   │   ├── clinics/       # Cliniques vétérinaires
│   │   │   ├── appointments/  # Rendez-vous + validation
│   │   │   ├── animals/       # Profils animaux + suivi
│   │   │   ├── agenda/        # Planning vétérinaires
│   │   │   ├── slots/         # Créneaux horaires
│   │   │   ├── reminders/     # Notifications + rappels
│   │   │   └── admin/         # Interface administration
│   │   └── test/              # Tests E2E + sécurité
│   └── web/                   # Frontend React + TypeScript
│       ├── src/
│       │   ├── components/    # Composants réutilisables
│       │   ├── pages/         # Pages routées
│       │   ├── services/      # Services API
│       │   └── hooks/         # Hooks React personnalisés
│       └── __tests__/         # Tests unitaires Vitest
├── scripts/                   # Scripts utilitaires
├── CAHIER_DE_RECETTE.md      # 📋 Documentation tests
└── docker-compose.yml        # 🐳 PostgreSQL local
```

### Stack Technique 
- **Backend :** NestJS + TypeORM + PostgreSQL + JWT + Bcrypt
- **Frontend :** React + TypeScript + TailwindCSS + React Router
- **Tests :** Jest + Vitest + Supertest + Testing Library
- **CI/CD :** GitHub Actions + Railway
- **Base :** Docker + pnpm workspaces

---

## 🎯 Fonctionnalités Principales **(C 2.2.1)**

### 👥 Gestion Multi-Rôles
- **Propriétaires :** Recherche cliniques, prise RDV, suivi animaux
- **Vétérinaires :** Agenda, blocage créneaux, notes consultation  
- **ASV :** Validation RDV, gestion planning
- **Administrateurs :** Création utilisateurs, gestion cliniques
- **Webmasters :** Administration complète

### 🏥 Recherche et Réservation
- Recherche cliniques par code postal
- Affichage créneaux disponibles temps réel
- Prise de rendez-vous avec validation
- Confirmation automatique par email

### 📅 Gestion d'Agenda
- Vue jour/semaine/mois pour vétérinaires
- Blocage de créneaux (congés, formations)
- Notifications temps réel des modifications
- Historique des consultations

### 🐕 Suivi des Animaux
- Profils détaillés (race, âge, poids, puces)
- Historique médical et consultations
- Rappels vaccins et traitements
- Upload documents vétérinaires

---

## 📚 Documentation Supplémentaire

- 📋 **[Cahier de Recette](./docs/CAHIER_DE_RECETTE.md)** - Tests et validation complète
- 📊 **[Coverage Report](./docs/coverage_summary.md)** - Métriques de tests
- 🔗 **[API Documentation](http://localhost:3000/api/docs)** - Swagger interactif
- 📝 **[Changelog](./CHANGELOG.md)** - Historique des versions
- 🚀 **[Railway Deployment](./docs/README-RAILWAY.md)** - Guide déploiement

---

## 🚀 Commandes Rapides

```bash
# Développement
pnpm dev                      # Démarrer tout (API + Web)
pnpm db:reset && pnpm api:seed  # Reset DB + données test

# Tests
pnpm test                     # Tests unitaires
pnpm test:e2e                # Tests E2E + sécurité  
pnpm coverage                # Couverture complète

# Production
pnpm build                   # Build production
pnpm lint                    # Vérification code
pnpm format                  # Formatage automatique
```

---

**VitaVet v1.0.0** - Plateforme vétérinaire sécurisée et accessible  
🏆 **Conforme :** OWASP Top 10 + WCAG 2.1 AA + Tests E2E + CI/CD