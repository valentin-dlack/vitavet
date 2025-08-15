# 🔄 Configuration du Proxy Vite

## Problème résolu

Le frontend React (port 5173) doit communiquer avec l'API NestJS (port 3000). Sans proxy, les appels API seraient faits sur le mauvais port.

## Solution : Proxy Vite

### Configuration dans `apps/web/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

### Comment ça fonctionne

1. **Frontend** : Fait un appel à `/api/auth/register`
2. **Vite Dev Server** : Intercepte l'appel et le redirige vers `http://localhost:3000/api/auth/register`
3. **API NestJS** : Reçoit l'appel sur le port 3000

### URLs utilisées dans le code

#### ✅ URLs relatives (correctes)
```typescript
// Service d'authentification
const response = await fetch('/api/auth/register', {
  method: 'POST',
  // ...
});

// Composant HealthCheck
const response = await fetch('/api/health');
```

#### ❌ URLs absolues (incorrectes)
```typescript
// Ne pas faire ça
const response = await fetch('http://localhost:3000/api/auth/register');
```

## Avantages du proxy

- ✅ **Développement simplifié** : Pas besoin de gérer les CORS
- ✅ **URLs relatives** : Code portable entre environnements
- ✅ **Hot reload** : Les changements sont reflétés immédiatement
- ✅ **Sécurité** : Pas d'exposition directe de l'API

## Dépannage

### Erreur "Connection refused"
- Vérifiez que l'API NestJS est démarrée sur le port 3000
- Vérifiez que le proxy est bien configuré dans `vite.config.ts`

### Erreur CORS
- Le proxy devrait résoudre les problèmes CORS
- Si l'erreur persiste, vérifiez la configuration CORS dans l'API

### Appels API qui ne fonctionnent pas
- Vérifiez que les URLs commencent par `/api/`
- Vérifiez que l'API est accessible directement sur `http://localhost:3000`

## Production

En production, le proxy n'est pas nécessaire car :
- Le frontend et l'API sont servis par le même serveur
- Ou ils utilisent des domaines différents avec CORS configuré
