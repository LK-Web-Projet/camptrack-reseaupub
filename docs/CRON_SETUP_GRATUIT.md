# Configuration Cron Gratuite - Auto-Clôture et Libération

Puisque Vercel Cron nécessite un plan Pro, voici comment configurer un service de cron **100% gratuit** pour exécuter l'auto-clôture des campagnes et l'auto-libération des prestataires.

## 🎯 Deux Cron Jobs Nécessaires

Vous devez configurer **deux cron jobs distincts** :

1. **Auto-clôture des campagnes** → `/api/campagnes/cron`
   - Change le statut des campagnes expirées à `TERMINEE`
   
2. **Auto-libération des prestataires** → `/api/prestataires/cron`
   - Libère les prestataires selon leur `date_fin` personnalisée

---

## Option 1 : cron-job.org (Recommandé) ⭐

### Étape 1 : Créer un compte

1. Aller sur [cron-job.org](https://cron-job.org)
2. Créer un compte gratuit (pas de carte bancaire requise)

### Étape 2 : Créer le Premier Cron Job (Campagnes)

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

### Étape 3 : Créer le Deuxième Cron Job (Prestataires)

1. Cliquer à nouveau sur **"Create cronjob"**
2. Remplir les informations :

   **Title** : `CampTrack - Auto-libération prestataires`
   
   **URL** : `https://votre-domaine.vercel.app/api/prestataires/cron`
   
   **Schedule** : 
   - Sélectionner **"Every hour"** (Toutes les heures)
   - Ou personnaliser : `0 * * * *`

3. Cliquer sur **"Advanced"** et ajouter le header :
   ```
   Header name: Authorization
   Header value: Bearer VOTRE_CRON_SECRET
   ```
   
   ⚠️ Utiliser la **même** `CRON_SECRET` que pour le premier job

4. **Save** le cron job

### Étape 4 : Vérifier

- Les deux cron jobs s'exécuteront automatiquement toutes les heures
- Vous recevrez des notifications par email en cas d'erreur
- Vous pouvez voir l'historique des exécutions dans le dashboard

---

## Option 2 : GitHub Actions (Pour les développeurs)

### Créer Deux Workflows

#### 1. Auto-clôture des campagnes

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
      - name: Call Campaign Cron Endpoint
        run: |
          curl -X GET "${{ secrets.VERCEL_URL }}/api/campagnes/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### 2. Auto-libération des prestataires

Créer `.github/workflows/provider-cron.yml` :

```yaml
name: Provider Auto-Release

on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures
  workflow_dispatch:  # Permet l'exécution manuelle

jobs:
  auto-release:
    runs-on: ubuntu-latest
    steps:
      - name: Call Provider Cron Endpoint
        run: |
          curl -X GET "${{ secrets.VERCEL_URL }}/api/prestataires/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Ajouter les secrets dans GitHub

- `VERCEL_URL` : `https://votre-domaine.vercel.app`
- `CRON_SECRET` : Votre clé secrète

---

## Vérification

### Test Manuel des Deux Endpoints

#### 1. Test Auto-clôture Campagnes

```bash
curl -X GET "https://votre-domaine.vercel.app/api/campagnes/cron" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

Réponse attendue :
```json
{
  "success": true,
  "timestamp": "2026-01-26T...",
  "executionTimeMs": 150,
  "statistics": {
    "campaignsTerminated": 0,
    "providersReleased": 0,
    "affectationsClosed": 0
  },
  "terminatedCampaignIds": []
}
```

#### 2. Test Auto-libération Prestataires

```bash
curl -X GET "https://votre-domaine.vercel.app/api/prestataires/cron" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

Réponse attendue :
```json
{
  "success": true,
  "timestamp": "2026-01-26T...",
  "executionTimeMs": 120,
  "statistics": {
    "providersReleased": 0,
    "affectationsClosed": 0
  },
  "releasedProviderIds": []
}
```

### Monitoring

- **cron-job.org** : Dashboard avec historique et notifications email pour les deux jobs
- **GitHub Actions** : Onglet "Actions" dans votre repo avec les deux workflows

---

## 📊 Résumé de la Configuration

| Service | Cron Job 1 | Cron Job 2 |
|---------|-----------|-----------|
| **Nom** | Auto-clôture campagnes | Auto-libération prestataires |
| **URL** | `/api/campagnes/cron` | `/api/prestataires/cron` |
| **Fréquence** | Toutes les heures | Toutes les heures |
| **Header** | `Authorization: Bearer CRON_SECRET` | `Authorization: Bearer CRON_SECRET` |

---

## Recommandation

🎯 **Je recommande cron-job.org** car :
- ✅ Gratuit **sans limite** de cron jobs (vous pouvez en créer autant que nécessaire)
- ✅ Interface simple et claire
- ✅ Notifications email automatiques en cas d'erreur
- ✅ Historique détaillé des exécutions pour chaque job
- ✅ Support des headers personnalisés
- ✅ Pas besoin de compte GitHub
- ✅ Gestion facile de plusieurs cron jobs

---

## Sécurité

⚠️ **Important** : Ne partagez jamais votre `CRON_SECRET` publiquement. Cette clé permet d'exécuter l'auto-clôture des campagnes et la libération des prestataires.

Si vous pensez que votre clé a été compromise :
1. Générer une nouvelle clé : `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Mettre à jour dans `.env` et Vercel
3. Mettre à jour dans **tous** vos cron jobs (campagnes ET prestataires)

---

## ❓ FAQ

### Q: Pourquoi deux cron jobs au lieu d'un seul ?

**R:** Parce que nous avons maintenant deux processus distincts :
- **Campagnes** : Clôture uniquement le statut de la campagne
- **Prestataires** : Libère les prestataires selon leur `date_fin` personnalisée (qui peut être après la fin de la campagne)

### Q: Les deux cron jobs doivent-ils s'exécuter en même temps ?

**R:** Non, ils peuvent s'exécuter indépendamment. Ils utilisent tous les deux la fréquence "toutes les heures" mais ce n'est pas grave s'ils ne s'exécutent pas exactement au même moment.

### Q: Puis-je utiliser la même `CRON_SECRET` pour les deux ?

**R:** Oui ! Utilisez la même clé secrète pour les deux endpoints. C'est plus simple à gérer.
