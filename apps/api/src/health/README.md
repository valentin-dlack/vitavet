# Health Module

Module de surveillance de la santé de l'API VetaVet.

## Endpoints

### GET /api/health

Retourne le statut de santé de l'API.

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

**Codes de statut :**
- `200 OK` : API fonctionnelle
- `500 Internal Server Error` : Erreur serveur

## Tests

### Tests unitaires
```bash
pnpm test
```

### Tests e2e
```bash
pnpm test:e2e
```

## Utilisation

L'endpoint health est utilisé pour :
- Vérifier que l'API est opérationnelle
- Surveiller le temps de fonctionnement
- Identifier l'environnement de déploiement
- Monitoring et alertes

## Critères d'acceptation US-10

- [x] Jest + Supertest pour API
- [x] Vitest pour web
- [x] Scripts de test qui passent
- [x] Endpoint `/api/health` fonctionnel
- [x] Tests unitaires et e2e implémentés
