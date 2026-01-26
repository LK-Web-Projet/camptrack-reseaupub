# Configuration Cron Gratuite pour Auto-Clôture des Campagnes

Puisque Vercel Cron nécessite un plan Pro, voici comment configurer un service de cron **100% gratuit** pour exécuter l'auto-clôture des campagnes.

## Option 1 : cron-job.org (Recommandé)

### Étape 1 : Créer un compte

1. Aller sur [cron-job.org](https://cron-job.org)
2. Créer un compte gratuit (pas de carte bancaire requise)

### Étape 2 : Créer un Cron Job

1. Cliquer sur **"Create cronjob"**
2. Remplir les informations :

   **Title** : `CampTrack - Auto-clôture campagnes`
   
   **URL** : `https://votre-domaine.vercel.app/api/campagnes/cron`
   
   **Schedule** : 
   - Sélectionner **"Every hour"** (Toutes les heures)
   - Ou personnaliser : `0 * * * *`

3. Cliquer sur **"Advanced"** et ajouter le header :
   ```
   Header name: Authorization
   Header value: Bearer VOTRE_CRON_SECRET
   ```
   
   ⚠️ Remplacer `VOTRE_CRON_SECRET` par la valeur dans votre `.env`

4. **Save** le cron job

### Étape 3 : Vérifier

- Le cron job s'exécutera automatiquement toutes les heures
- Vous recevrez des notifications par email en cas d'erreur
- Vous pouvez voir l'historique des exécutions dans le dashboard

---

## Option 2 : EasyCron

### Étape 1 : Créer un compte

1. Aller sur [easycron.com](https://www.easycron.com)
2. Créer un compte gratuit (plan gratuit : jusqu'à 1 cron job)

### Étape 2 : Créer un Cron Job

1. Cliquer sur **"Add Cron Job"**
2. Remplir :
   - **URL** : `https://votre-domaine.vercel.app/api/campagnes/cron`
   - **Cron Expression** : `0 * * * *` (toutes les heures)
   - **HTTP Headers** : 
     ```
     Authorization: Bearer VOTRE_CRON_SECRET
     ```

3. Sauvegarder

---

## Option 3 : GitHub Actions (Pour les développeurs)

Créer `.github/workflows/campaign-cron.yml` :

```yaml
name: Campaign Auto-Termination

on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures
  workflow_dispatch:  # Permet l'exécution manuelle

jobs:
  auto-terminate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET "${{ secrets.VERCEL_URL }}/api/campagnes/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Ajouter les secrets dans GitHub :
- `VERCEL_URL` : `https://votre-domaine.vercel.app`
- `CRON_SECRET` : Votre clé secrète

---

## Vérification

### Test Manuel

Après configuration, testez l'endpoint :

```bash
curl -X GET "https://votre-domaine.vercel.app/api/campagnes/cron" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

Réponse attendue :
```json
{
  "success": true,
  "timestamp": "2026-01-26T...",
  "statistics": {
    "campaignsTerminated": 0,
    "providersReleased": 0,
    "affectationsClosed": 0
  }
}
```

### Monitoring

- **cron-job.org** : Dashboard avec historique et notifications email
- **EasyCron** : Logs d'exécution dans le dashboard
- **GitHub Actions** : Onglet "Actions" dans votre repo

---

## Recommandation

🎯 **Je recommande cron-job.org** car :
- ✅ Gratuit sans limite de cron jobs
- ✅ Interface simple et claire
- ✅ Notifications email automatiques
- ✅ Historique détaillé des exécutions
- ✅ Support des headers personnalisés
- ✅ Pas besoin de compte GitHub

---

## Sécurité

⚠️ **Important** : Ne partagez jamais votre `CRON_SECRET` publiquement. Cette clé permet d'exécuter l'auto-clôture des campagnes.

Si vous pensez que votre clé a été compromise :
1. Générer une nouvelle clé : `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Mettre à jour dans `.env` et Vercel
3. Mettre à jour dans votre service de cron
