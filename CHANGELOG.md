# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [0.1.0] - 2025-08-20

> **Repository:** [valentin-dlack/vitavet](https://github.com/valentin-dlack/vitavet)  
> **Compare:** [main...develop](https://github.com/valentin-dlack/vitavet/compare/main...develop)  
> **Total commits:** 61

### Added

#### Authentification et Gestion des Utilisateurs
- Système d'authentification JWT avec inscription et connexion (#US-01a, #US-01b) ([`1adba76`](https://github.com/valentin-dlack/vitavet/commit/1adba76))
- Gestion des profils utilisateur avec modification et suppression de compte (#US-05d) ([`b90cea5`](https://github.com/valentin-dlack/vitavet/commit/b90cea5))
- Détails du profil utilisateur avec informations complètes (#US-05d) ([`20f22c4`](https://github.com/valentin-dlack/vitavet/commit/20f22c4))
- Système de changement de mot de passe (#US-01c) ([`b90cea5`](https://github.com/valentin-dlack/vitavet/commit/b90cea5))
- Demande de suppression de compte (#US-13) ([`b90cea5`](https://github.com/valentin-dlack/vitavet/commit/b90cea5))

#### Gestion des Cliniques
- Recherche et affichage des cliniques (#US-02a, #US-15) ([`a855358`](https://github.com/valentin-dlack/vitavet/commit/a855358))
- Création de cliniques par les administrateurs (#US-08e) ([`5ef9c5f`](https://github.com/valentin-dlack/vitavet/commit/5ef9c5f))
- Attribution de rôles aux utilisateurs dans les cliniques (ASV, vétérinaire, manager) (#US-08f) ([`5ef9c5f`](https://github.com/valentin-dlack/vitavet/commit/5ef9c5f))
- Contrôle d'accès basé sur les rôles (RBAC) amélioré (#US-08d) ([`f1fd54b`](https://github.com/valentin-dlack/vitavet/commit/f1fd54b))

#### Gestion des Animaux
- Module complet de gestion des animaux (#US-16) ([`a9b7013`](https://github.com/valentin-dlack/vitavet/commit/a9b7013))
- Interface de création d'animaux avec modal et tests (#US-16) ([`a9b7013`](https://github.com/valentin-dlack/vitavet/commit/a9b7013))
- Accès à l'historique des animaux depuis le panneau propriétaire (#US-05a) ([`4c0129e`](https://github.com/valentin-dlack/vitavet/commit/4c0129e))
- Consultation de l'historique des animaux avant rendez-vous (vétérinaires) (#US-05a) ([`b2b1afb`](https://github.com/valentin-dlack/vitavet/commit/b2b1afb))

#### Système de Rendez-vous
- Sélection de vétérinaire et prise de rendez-vous (#US-03b, #US-03c) ([`eb9cb54`](https://github.com/valentin-dlack/vitavet/commit/eb9cb54))
- Confirmation des rendez-vous par les ASV (#US-06b) ([`56546f1`](https://github.com/valentin-dlack/vitavet/commit/56546f1))
- Détails des cartes de validation ASV (#US-06a) ([`a630418`](https://github.com/valentin-dlack/vitavet/commit/a630418))
- Gestion des créneaux horaires (#US-03a, #US-03a1) ([`56546f1`](https://github.com/valentin-dlack/vitavet/commit/56546f1))

#### Agenda et Planning
- Vue agenda pour les vétérinaires avec détails des rendez-vous (#US-04a) ([`af94b61`](https://github.com/valentin-dlack/vitavet/commit/af94b61))
- Vue calendrier mensuelle et hebdomadaire (#US-04b) ([`671124e`](https://github.com/valentin-dlack/vitavet/commit/671124e))
- Récupération des rendez-vous par semaine ou par mois (#US-04b) ([`f3b1ae4`](https://github.com/valentin-dlack/vitavet/commit/f3b1ae4))
- Fonctionnalité de blocage de périodes (vacances, etc.) pour les vétérinaires (#US-04c) ([`3bd9b52`](https://github.com/valentin-dlack/vitavet/commit/3bd9b52))
- Améliorations de l'agenda vétérinaire avec filtres et légende (#US-04a) ([`fc8f1d1`](https://github.com/valentin-dlack/vitavet/commit/fc8f1d1))

#### Système de Rappels
- Règles de rappels pour les rendez-vous (#US-07a) ([`0999d0b`](https://github.com/valentin-dlack/vitavet/commit/0999d0b))
- Planificateur de tâches cron pour les rappels (#US-07a) ([`0999d0b`](https://github.com/valentin-dlack/vitavet/commit/0999d0b))
- Endpoints d'administration pour les rappels (#US-07a) ([`0999d0b`](https://github.com/valentin-dlack/vitavet/commit/0999d0b))
- Logs des rappels (#US-07b) ([`0999d0b`](https://github.com/valentin-dlack/vitavet/commit/0999d0b))
- Panneau de développement pour traiter les rappels (#US-07a) ([`969efdd`](https://github.com/valentin-dlack/vitavet/commit/969efdd))

#### Système de Documents et Notes
- Système de notes/rapports avec gestion de documents pour les rendez-vous (#US-05b) ([`c99be54`](https://github.com/valentin-dlack/vitavet/commit/c99be54))
- Upload et gestion de fichiers (#US-05c) ([`c99be54`](https://github.com/valentin-dlack/vitavet/commit/c99be54))

#### Notifications
- Système de notifications SMTP (si configuré) (#US-07b) ([`c76cd9b`](https://github.com/valentin-dlack/vitavet/commit/c76cd9b))
- Transporteur en mode développement (#US-07b) ([`c76cd9b`](https://github.com/valentin-dlack/vitavet/commit/c76cd9b))

#### Infrastructure et Monitoring
- Intégration Railway avec tests (e2e & ut) (#US-09, #US-10) ([`5867eff`](https://github.com/valentin-dlack/vitavet/commit/5867eff))
- Intégration Sentry pour les logs et monitoring (#US-14) ([`14f7acb`](https://github.com/valentin-dlack/vitavet/commit/14f7acb))
- Environnement de staging pour Railway (#US-09) ([`7e7b9ec`](https://github.com/valentin-dlack/vitavet/commit/7e7b9ec))
- Validation de commits Husky et tests CI (#US-09) ([`570a836`](https://github.com/valentin-dlack/vitavet/commit/570a836))
- Rapports de couverture automatisés avec détails (#US-10) ([`5277bc5`](https://github.com/valentin-dlack/vitavet/commit/5277bc5))
- Configuration d'environnement dotenv centralisée (#US-14) ([`920f649`](https://github.com/valentin-dlack/vitavet/commit/920f649))

#### Interface Utilisateur
- Amélioration de l'interface de la page "Mes animaux" ([`48a710b`](https://github.com/valentin-dlack/vitavet/commit/48a710b))
- Meilleur style pour la page de profil ([`04f82d9`](https://github.com/valentin-dlack/vitavet/commit/04f82d9))
- Système de pagination pour la confirmation des rendez-vous ASV ([`5046ace`](https://github.com/valentin-dlack/vitavet/commit/5046ace))
- Tests unitaires frontend liés aux modifications de sécurité RBAC ([`9a8ad13`](https://github.com/valentin-dlack/vitavet/commit/9a8ad13))

### Fixed

#### Sécurité
- Correction des payloads des tokens JWT pour les rôles ([`80e8cc9`](https://github.com/valentin-dlack/vitavet/commit/80e8cc9))
- Correction des problèmes de sécurité RBAC ([`80e8cc9`](https://github.com/valentin-dlack/vitavet/commit/80e8cc9))

#### Interface et Affichage
- Correction : les notes internes des vétérinaires étaient visibles dans l'historique des animaux des propriétaires ([`15368fc`](https://github.com/valentin-dlack/vitavet/commit/15368fc))
- Correction du bug d'affichage hors écran avec trop de rendez-vous à confirmer ([`5046ace`](https://github.com/valentin-dlack/vitavet/commit/5046ace))

#### Tests et CI/CD
- Correction des tests e2e - suppression de l'endpoint de seeding obsolète ([`b70edb0`](https://github.com/valentin-dlack/vitavet/commit/b70edb0))
- Utilisation de vraies données pour les tests au lieu d'IDs statiques ([`727736f`](https://github.com/valentin-dlack/vitavet/commit/727736f))
- Correction de la compatibilité des tests avec le changement d'affichage de timezone ([`2fd9a2d`](https://github.com/valentin-dlack/vitavet/commit/2fd9a2d))
- Correction des fuites dans les fonctions async en configuration e2e ([`6900eaa`](https://github.com/valentin-dlack/vitavet/commit/6900eaa))
- Correction des erreurs d'espace de noms dans les tests frontend ([`9026118`](https://github.com/valentin-dlack/vitavet/commit/9026118))
- Correction du service de base de données en CI/CD ([`314eb7e`](https://github.com/valentin-dlack/vitavet/commit/314eb7e))
- Correction des tests de prise de créneaux avec données de démonstration ([`b3197e7`](https://github.com/valentin-dlack/vitavet/commit/b3197e7))

#### Développement et Qualité de Code
- Suppression des logs/erreurs de débogage ([`79daac7`](https://github.com/valentin-dlack/vitavet/commit/79daac7))
- Correction du problème d'upload de fichier présent dans git mais sans contenu ([`6d66280`](https://github.com/valentin-dlack/vitavet/commit/6d66280))
- Résolution des conflits git dans les pull requests ([`6887ed9`](https://github.com/valentin-dlack/vitavet/commit/6887ed9))
- Correction de toutes les erreurs de lint ([`6944ae8`](https://github.com/valentin-dlack/vitavet/commit/6944ae8))
- Suppression des guards Throttle non utilisés ([`2461381`](https://github.com/valentin-dlack/vitavet/commit/2461381))

#### Configuration et Déploiement
- Suppression de l'upload des sourcemaps Sentry lors des tests ([`dc80cad`](https://github.com/valentin-dlack/vitavet/commit/dc80cad))
- Correction de la configuration Railway ([`7e7b9ec`](https://github.com/valentin-dlack/vitavet/commit/7e7b9ec))

### Changed

#### Refactoring et Améliorations
- Système dotenv refactorisé pour utiliser uniquement la racine ([`7e8e86a`](https://github.com/valentin-dlack/vitavet/commit/7e8e86a))
- Suppression de l'upload des sourcemaps Sentry lors des tests ([`ee25cb1`](https://github.com/valentin-dlack/vitavet/commit/ee25cb1))
- Amélioration de la gestion des rôles et de la sécurité ([`f1fd54b`](https://github.com/valentin-dlack/vitavet/commit/f1fd54b))
- Amélioration de l'interface des cartes de validation ASV ([`805463e`](https://github.com/valentin-dlack/vitavet/commit/805463e))

### Technical Details

#### Architecture
- Monorepo React + NestJS avec configuration complète ([`e219c63`](https://github.com/valentin-dlack/vitavet/commit/e219c63))
- Configuration TypeScript et ESLint ([`e219c63`](https://github.com/valentin-dlack/vitavet/commit/e219c63))
- Configuration de base de données avec TypeORM ([`e219c63`](https://github.com/valentin-dlack/vitavet/commit/e219c63))
- Tests unitaires et e2e avec Jest et Vitest ([`e219c63`](https://github.com/valentin-dlack/vitavet/commit/e219c63))

#### Commits de Maintenance
- Mises à jour diverses de configuration : [`a41355e`](https://github.com/valentin-dlack/vitavet/commit/a41355e), [`7e41c26`](https://github.com/valentin-dlack/vitavet/commit/7e41c26), [`9248f26`](https://github.com/valentin-dlack/vitavet/commit/9248f26)
- Mises à jour des tests : [`d9f65db`](https://github.com/valentin-dlack/vitavet/commit/d9f65db), [`0c64bfe`](https://github.com/valentin-dlack/vitavet/commit/0c64bfe), [`6b68ea6`](https://github.com/valentin-dlack/vitavet/commit/6b68ea6)
- Corrections de style et de lint : [`c78b2fb`](https://github.com/valentin-dlack/vitavet/commit/c78b2fb), [`5c9f6a3`](https://github.com/valentin-dlack/vitavet/commit/5c9f6a3), [`ff21397`](https://github.com/valentin-dlack/vitavet/commit/ff21397)

## 📝 Notes de Version

**Cette release (0.1.0)** représente la version initiale complète de VitaVet, une application de gestion vétérinaire avec toutes les fonctionnalités de base pour :

- 👥 **Propriétaires d'animaux** : Gestion des animaux, prise de rendez-vous, suivi médical
- 🩺 **Vétérinaires** : Agenda, consultation des dossiers, notes médicales
- 🏥 **ASV (Assistants)** : Validation des rendez-vous, support administratif  
- 👨‍💼 **Administrateurs** : Gestion des cliniques, des utilisateurs et des rôles

### Technologies Utilisées

- **Frontend :** React + TypeScript + Vite + Tailwind CSS
- **Backend :** NestJS + TypeORM + PostgreSQL
- **CI/CD :** GitHub Actions + Railway
- **Monitoring :** Sentry
- **Tests :** Jest + Vitest + E2E Testing

### Prochaines Étapes

Cette version pose les bases solides pour les futures améliorations. Les prochaines versions se concentreront sur :
- Amélioration de l'UX/UI
- Fonctionnalités avancées de gestion vétérinaire
- Intégrations tierces
- Performance et scalabilité
