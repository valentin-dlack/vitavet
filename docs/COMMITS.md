# 📝 Conventions de Commit - VetaVet

## Format des messages de commit

Tous les messages de commit doivent suivre le format conventionnel :

```
<type>(<scope>)?: <description> (#<issue>)?
```

### Types autorisés

- **`feat`** : Nouvelle fonctionnalité
- **`fix`** : Correction de bug
- **`docs`** : Documentation
- **`style`** : Formatage, points-virgules manquants, etc.
- **`refactor`** : Refactoring du code
- **`test`** : Ajout ou modification de tests
- **`chore`** : Tâches de maintenance
- **`perf`** : Amélioration des performances
- **`other`** : Autres types de changements

### Scope (optionnel)

Le scope indique la partie de l'application concernée :

- **`api`** : Backend API
- **`web`** : Frontend React
- **`ui`** : Interface utilisateur
- **`auth`** : Authentification
- **`db`** : Base de données
- **`ci`** : Intégration continue
- **`deploy`** : Déploiement

### Issue (optionnel)

Référence à une issue JIRA/GitHub :

- **`#1234`** : Issue JIRA
- **`#56`** : Pull Request GitHub

## Exemples

### ✅ Messages valides

```bash
# Nouvelle fonctionnalité
feat: add health check endpoint (#US-10)

# Correction de bug
fix(api): resolve rate limiting issue (#US-12)

# Documentation
docs: add CI/CD setup guide

# Tests
test(web): add HealthCheck component tests

# Refactoring
refactor(api): restructure health module

# Maintenance
chore: update dependencies

# Performance
perf(api): optimize database queries

# Style
style: fix code formatting

# Autre
other: update README
```

### ❌ Messages invalides

```bash
# Pas de type
add new feature

# Type invalide
update: something

# Pas de description
feat:

# Format incorrect
feat - add feature

# Pas de deux-points
feat add feature
```

## Validation automatique

Husky valide automatiquement les messages de commit :

1. **Hook pre-commit** : Vérifie le format
2. **Rejet automatique** : Si le format est incorrect
3. **Message d'aide** : Affiche les exemples valides

## Workflow recommandé

### 1. Préparer le commit
```bash
git add .
```

### 2. Commiter avec un message valide
```bash
git commit -m "feat: add user authentication (#US-15)"
```

### 3. Si le message est invalide
Husky affichera un message d'erreur avec des exemples.

### 4. Corriger et recommiter
```bash
git commit -m "feat: add user authentication (#US-15)"
```

## Intégration avec JIRA

### Format recommandé
```bash
feat: add user management (#US-15)
fix(api): resolve authentication bug (#BUG-123)
docs: update API documentation (#DOC-45)
```

### Avantages
- **Traçabilité** : Lien direct vers les issues
- **Historique** : Suivi des changements par US
- **Reporting** : Génération automatique de rapports

## Configuration

### Husky
- **Fichier** : `.husky/commit-msg`
- **Script** : `scripts/commit-msg.sh`
- **Validation** : Regex pattern

### Regex Pattern
```bash
^(feat|fix|docs|style|refactor|test|chore|perf|other)(\((.*)\))?: (.*)( \(#([0-9]+)\))?$
```

## Troubleshooting

### Erreur "commit-msg.sh not found"
```bash
# Vérifier que le script existe
ls -la scripts/commit-msg.sh

# Rendre exécutable (Linux/Mac)
chmod +x scripts/commit-msg.sh
```

### Erreur "husky not found"
```bash
# Réinstaller Husky
pnpm install

# Réinitialiser
pnpm husky init
```

### Bypass temporaire (déconseillé)
```bash
git commit -m "feat: add feature" --no-verify
```

## Bonnes pratiques

1. **Messages clairs** : Décrire ce qui change
2. **Scope précis** : Indiquer la partie concernée
3. **Issues liées** : Référencer les tickets
4. **Type approprié** : Utiliser le bon type
5. **Description concise** : Maximum 50 caractères

---

**VetaVet** - Conventions de commit 🐾
