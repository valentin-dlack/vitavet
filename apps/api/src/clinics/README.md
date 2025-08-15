# Clinics Module - US-02a & US-03b

## Description
Module pour gérer les cliniques vétérinaires et leurs vétérinaires.

## Endpoints

### GET /api/clinics
Récupère les cliniques par code postal.

**Paramètres de requête :**
- `postcode` (string, optionnel) : Code postal pour filtrer les cliniques

**Réponse :**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Clinique Vétérinaire du Centre",
    "city": "Paris",
    "postcode": "75001"
  }
]
```

### POST /api/clinics/seed
Génère des données de démonstration pour les cliniques.

**Réponse :**
```json
{
  "message": "Demo clinics seeded successfully"
}
```

### GET /api/clinics/:clinicId/vets
Récupère les vétérinaires d'une clinique spécifique.

**Paramètres de chemin :**
- `clinicId` (UUID, requis) : ID de la clinique

**Réponse :**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "firstName": "Dr. Martin",
    "lastName": "Dubois",
    "email": "martin.dubois@vitavet.fr",
    "specialty": "Chirurgie générale"
  }
]
```

## Fonctionnalités implémentées

### US-02a - Search clinic postcode
- ✅ Recherche de cliniques par code postal
- ✅ Données fictives pour la démo
- ✅ Validation des paramètres
- ✅ Tests unitaires et E2E

### US-03b - Select vet
- ✅ Endpoint pour récupérer les vétérinaires d'une clinique
- ✅ Données fictives de vétérinaires
- ✅ Validation de l'existence de la clinique
- ✅ Tests unitaires et E2E
- ✅ Interface Vet pour le frontend
- ✅ Composant VetSelector React
- ✅ Tests frontend

## Structure des données

### Clinic Entity
```typescript
{
  id: string;
  name: string;
  city: string;
  postcode: string;
  address: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Vet Interface
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}
```

## Tests

### Backend
- `clinics.service.spec.ts` : Tests unitaires du service
- `clinics.controller.spec.ts` : Tests unitaires du contrôleur
- Tests E2E pour les endpoints

### Frontend
- `VetSelector.test.tsx` : Tests du composant de sélection de vétérinaire
- Tests de rendu, états de chargement et d'erreur
