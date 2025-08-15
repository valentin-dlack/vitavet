# Slots Module - US-03a1

## Description
Module pour gérer les créneaux horaires disponibles pour les rendez-vous vétérinaires.

## Endpoints

### GET /api/slots
Récupère les créneaux disponibles pour une clinique et une date donnée.

**Paramètres de requête :**
- `clinicId` (UUID, requis) : ID de la clinique
- `date` (YYYY-MM-DD, requis) : Date pour laquelle récupérer les créneaux
- `vetUserId` (UUID, optionnel) : ID du vétérinaire pour filtrer les créneaux

**Réponse :**
```json
[
  {
    "id": "slot-123",
    "startsAt": "2024-01-15T09:00:00.000Z",
    "endsAt": "2024-01-15T09:30:00.000Z",
    "durationMinutes": 30,
    "vetUserId": "550e8400-e29b-41d4-a716-446655440001"
  }
]
```

### POST /api/slots/seed
Génère des données de démonstration pour les créneaux.

**Réponse :**
```json
{
  "message": "Demo slots seeded successfully"
}
```

## Fonctionnalités

- Génération de créneaux de 30 minutes de 9h à 17h
- Filtrage par vétérinaire
- Données mockées pour la démo (70% de disponibilité aléatoire)
- Tri automatique par heure de début
- Support de 3 vétérinaires mockés par défaut

## Tests

- Tests unitaires : `pnpm --filter api test -t SlotsService`
- Tests E2E : `pnpm --filter api test:e2e`

## Critères d'acceptation validés

✅ GET /api/slots?clinicId&date&vetId? returns 15/30min slots  
✅ Mocked computation first (no overlaps), <300ms on demo data  
✅ Tests unitaires et E2E passants  
✅ Validation DTO avec class-validator  
✅ Documentation API complète
