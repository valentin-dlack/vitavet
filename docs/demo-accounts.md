# VitaVet — Comptes de démo et données de test

Ces identifiants sont générés par la commande :

```bash
pnpm api:seed
```

Ils couvrent plusieurs rôles pour les démonstrations.

## Comptes (email / mot de passe)

- OWNER : `owner@example.com` / `password123`
- VET #1 : `vet1@example.com` / `password123`
- VET #2 : `vet2@example.com` / `password123`
- ASV : `asv@example.com` / `password123`
- ADMIN CLINIC : `admin@example.com` / `password123`

## Données créées

- Clinique : « Clinique VitaVet » (75011 Paris)
- Rôles associés pour chaque compte ci-dessus
- Animaux (propriétaire = OWNER)
  - Milo
  - Luna
- Type de rendez-vous : « Consultation 30m »
- Règle de rappel (J-7, email activé)
- Rendez-vous d’exemple
  - PENDING (10:00 aujourd’hui, Vet #1, animal Milo)
  - CONFIRMED (10:30 aujourd’hui, Vet #2, animal Luna)
- Instance de rappel programmée (J-7) pour 1 rendez-vous PENDING

> Remarque : la commande peut être exécutée plusieurs fois sans dupliquer les lignes existantes (upsert naïf).

## Dump de la base (PostgreSQL)

Vous pouvez générer un dump SQL de la base courante avec :

```bash
pnpm db:dump
```

Le dump est stocké dans `data/dumps/` avec un horodatage.

Variables d’environnement utilisées si présentes : `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.


