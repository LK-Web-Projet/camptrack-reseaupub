# 🚀 Guide Rapide : Configuration des Deux Cron Jobs

## ✅ Ce que vous devez faire

Vous devez ajouter **UN DEUXIÈME** cron job sur cron-job.org pour l'auto-libération des prestataires.

---

## 📋 Étapes Rapides

### 1️⃣ Connectez-vous à cron-job.org

Vous avez déjà un compte et un cron job pour les campagnes. Parfait !

### 2️⃣ Créez le deuxième cron job

1. Cliquez sur **"Create cronjob"**

2. Remplissez :
   - **Title** : `CampTrack - Auto-libération prestataires`
   - **URL** : `https://votre-domaine.vercel.app/api/prestataires/cron`
   - **Schedule** : `Every hour` (ou `0 * * * *`)

3. Dans **"Advanced"**, ajoutez le header :
   ```
   Header name: Authorization
   Header value: Bearer VOTRE_CRON_SECRET
   ```
   
   ⚠️ **Important** : Utilisez la **MÊME** `CRON_SECRET` que votre premier cron job

4. Cliquez sur **"Save"**

### 3️⃣ Vérifiez

Vous devriez maintenant avoir **2 cron jobs** actifs :

| Nom | URL | Fréquence |
|-----|-----|-----------|
| CampTrack - Auto-clôture campagnes | `/api/campagnes/cron` | Toutes les heures |
| CampTrack - Auto-libération prestataires | `/api/prestataires/cron` | Toutes les heures |

---

## 🧪 Test

Testez le nouveau endpoint :

```bash
curl -X GET "https://votre-domaine.vercel.app/api/prestataires/cron" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

Réponse attendue :
```json
{
  "success": true,
  "timestamp": "2026-01-26T...",
  "statistics": {
    "providersReleased": 0,
    "affectationsClosed": 0
  }
}
```

---

## ❓ Questions Fréquentes

### Pourquoi deux cron jobs ?

Parce que maintenant :
- **Cron 1** : Clôture les campagnes (change le statut à `TERMINEE`)
- **Cron 2** : Libère les prestataires selon leur `date_fin` personnalisée

Un prestataire assigné tard peut finir **après** la fin de la campagne, donc on a besoin de deux processus séparés.

### Dois-je payer pour cron-job.org ?

Non ! Le plan gratuit permet un **nombre illimité** de cron jobs. Vous pouvez en créer autant que vous voulez.

### Dois-je créer une nouvelle `CRON_SECRET` ?

Non ! Utilisez la **même** clé secrète pour les deux cron jobs. C'est plus simple.

---

## ✅ C'est tout !

Une fois le deuxième cron job créé, votre système sera complet :
- ✅ Les campagnes seront clôturées automatiquement
- ✅ Les prestataires seront libérés selon leur durée personnalisée
- ✅ Tout fonctionne gratuitement avec cron-job.org
