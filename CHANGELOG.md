# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [0.1.1] - 2025-08-22

> **Repository:** [valentin-dlack/vitavet](https://github.com/valentin-dlack/vitavet)  
> **Compare:** [0.1.0...develop](https://github.com/valentin-dlack/vitavet/compare/main...develop)  
> **Total nouveaux commits:** 18

### Added

#### Gestion des Rôles Avancée
- Refonte du système de rôles avec distinction rôles généraux vs cliniques ([`ef8663d`](https://github.com/valentin-dlack/vitavet/commit/ef8663d))
- Attribution automatique du rôle Owner aux nouveaux utilisateurs ([`6a27751`](https://github.com/valentin-dlack/vitavet/commit/6a27751))
- Interface d'administration : sélection de rôle lors de la création/édition d'utilisateurs par les Webmasters ([`9e9dd52`](https://github.com/valentin-dlack/vitavet/commit/9e9dd52))

#### Améliorations Fonctionnelles
- Sélection de clinique lors de la création d'animal ([`6a27751`](https://github.com/valentin-dlack/vitavet/commit/6a27751))

#### Documentation et Qualité
- Configuration Swagger complète avec DTOs et descriptions de routes ([`2a2054f`](https://github.com/valentin-dlack/vitavet/commit/2a2054f))
- Tests unitaires supplémentaires frontend/backend pour améliorer la couverture de régression ([`779cdc3`](https://github.com/valentin-dlack/vitavet/commit/779cdc3))
- Nettoyage et optimisation des tests e2e ([`dc28f24`](https://github.com/valentin-dlack/vitavet/commit/dc28f24))

### Fixed

#### Configuration et Déploiement
- Correction de la configuration proxy Vite pour Railway ([`733d1ad`](https://github.com/valentin-dlack/vitavet/commit/733d1ad))
- Fix du health component pointant vers le mauvais lien ([`c7f6da3`](https://github.com/valentin-dlack/vitavet/commit/c7f6da3))
- Correction URL des services auth et slots ([`1d94582`](https://github.com/valentin-dlack/vitavet/commit/1d94582))
- Fix Nixpack pour le ciblage des services API ou Web ([`380ab34`](https://github.com/valentin-dlack/vitavet/commit/380ab34))
- Correction pnpm install sans frozen lockfiles ([`4c123c6`](https://github.com/valentin-dlack/vitavet/commit/4c123c6))

#### Tests et CI/CD
- Correction des tests frontend pour health check sans JSON ([`ab33ca9`](https://github.com/valentin-dlack/vitavet/commit/ab33ca9))
- Ajout de données de seed pour l'environnement de staging ([`b09a76a`](https://github.com/valentin-dlack/vitavet/commit/b09a76a))

### Removed

#### Nettoyage
- Suppression de documentation obsolète et non utilisée ([`f495c72`](https://github.com/valentin-dlack/vitavet/commit/f495c72))

---

## 📚 Liens Utiles

- **Repository GitHub :** [valentin-dlack/vitavet](https://github.com/valentin-dlack/vitavet)
- **Comparaison des versions :** [0.1.0...0.1.1](https://github.com/valentin-dlack/vitavet/compare/main...develop)
- **Issues :** [GitHub Issues](https://github.com/valentin-dlack/vitavet/issues)
- **Pull Requests :** [GitHub PRs](https://github.com/valentin-dlack/vitavet/pulls)

## 📝 Notes de Version

**Cette release (0.1.1)** représente la première version d'amélioration de VitaVet, centrée sur la qualité de code et la gestion Admin.

### 🎯 Focus de cette version

Cette version patch se concentre sur :
- **Amélioration du système de rôles** : Distinction claire entre rôles généraux (Owner, Webmaster) et rôles cliniques (VET, ASV, Manager)
- **Qualité et documentation** : Swagger complet, tests renforcés, nettoyage du code
- **Stabilité du déploiement** : Nombreuses corrections pour Railway et la configuration

### 🔧 Améliorations Techniques

- **API Documentation** : Swagger/OpenAPI maintenant complètement configuré
- **Tests renforcés** : Couverture améliorée pour la sécurité et la maintenabilité
- **Configuration robuste** : Corrections multiples pour l'environnement de production

### 📊 Impact

- **Développeurs** : Documentation API claire avec Swagger
- **Administrateurs** : Gestion des rôles simplifiée et plus intuitive
- **DevOps** : Déploiement plus stable sur Railway
- **QA** : Tests plus fiables et complets