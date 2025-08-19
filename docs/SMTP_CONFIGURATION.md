# Configuration SMTP pour les notifications

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` dans le dossier `apps/api/` :

```bash
# Configuration SMTP principale
SMTP_HOST=smtp.gmail.com          # Serveur SMTP
SMTP_PORT=587                     # Port SMTP
SMTP_USER=votre-email@gmail.com   # Adresse email d'envoi
SMTP_PASS=votre-mot-de-passe-app  # Mot de passe de l'application
SMTP_FROM=noreply@vitavet.com     # Adresse d'expédition (optionnel)

# URL du frontend pour les liens dans les emails
FRONTEND_URL=https://vitavet.com
```

## Configuration par fournisseur

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mon-clinique@gmail.com
SMTP_PASS=abcdefghijklmnop  # Mot de passe d'application Gmail
```

**Note Gmail :** Vous devez activer l'authentification à 2 facteurs et créer un mot de passe d'application spécifique.

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=mon-clinique@outlook.com
SMTP_PASS=mon-mot-de-passe
```

### Serveur SMTP privé
```bash
SMTP_HOST=mail.maclinique.com
SMTP_PORT=587
SMTP_USER=notifications@maclinique.com
SMTP_PASS=mon-mot-de-passe-securise
```

## Mode développement

Si aucune variable SMTP n'est configurée, le système utilise un transporteur de test local :
- Les emails ne sont pas réellement envoyés
- Ils sont loggés dans la console
- Idéal pour le développement et les tests

## Test de la configuration

Une fois configuré, vous pouvez tester la connexion SMTP via l'API :

```bash
curl -X POST http://localhost:3000/notifications/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Sécurité

- Ne jamais commiter les mots de passe dans le code
- Utiliser des mots de passe d'application pour Gmail
- Limiter les permissions de l'email d'envoi
- Surveiller les logs d'envoi pour détecter les abus
