# Auto-Clôture des Campagnes - Documentation

## Vue d'ensemble

Le système d'auto-clôture des campagnes permet de :
- ✅ Passer automatiquement les campagnes expirées au statut `TERMINEE`
- ✅ Clôturer les affectations des prestataires (ajout de `date_fin`)
- ✅ Libérer les prestataires (`disponible = true`)

## Architecture

### 1. Fonction Utilitaire
**Fichier** : `lib/utils/campaignAutoTermination.ts`

Contient la logique réutilisable :
- `autoTerminateCampaigns()` : Exécute l'auto-clôture
- `autoTerminationCache` : Cache pour éviter les exécutions trop fréquentes (5 min)

### 2. Endpoint Cron
**Fichier** : `app/api/campagnes/cron/route.ts`
**URL** : `/api/campagnes/cron`

Endpoint dédié protégé par `CRON_SECRET` pour être appelé par Vercel Cron ou un service externe.

### 3. Endpoint GET Principal
**Fichier** : `app/api/campagnes/route.ts`

Exécute l'auto-clôture avec cache lors de chaque requête GET (max toutes les 5 min).

## Configuration

### Variables d'environnement

Ajouter dans `.env` :
```bash
# Générer avec: openssl rand -base64 32
CRON_SECRET="votre-cle-secrete-ici"
```

### Vercel Cron (Plan Pro requis)

Le fichier `vercel.json` configure l'exécution automatique toutes les heures :
```json
{
  "crons": [
    {
      "path": "/api/campagnes/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Note** : Vercel Cron nécessite un plan Pro. Alternatives gratuites :
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)

## Utilisation

### Test Manuel Local

```bash
# 1. Générer une clé secrète
openssl rand -base64 32

# 2. Ajouter dans .env
CRON_SECRET="la-cle-generee"

# 3. Tester l'endpoint
curl -X GET "http://localhost:3000/api/campagnes/cron" \
  -H "Authorization: Bearer la-cle-generee"
```

### Configuration Service Externe (si pas de Vercel Pro)

1. Créer un compte sur [cron-job.org](https://cron-job.org)
2. Créer un nouveau cron job :
   - **URL** : `https://votre-domaine.vercel.app/api/campagnes/cron`
   - **Schedule** : `0 * * * *` (toutes les heures)
   - **Headers** : `Authorization: Bearer VOTRE_CRON_SECRET`

## Monitoring

Les logs sont disponibles dans la console Vercel ou dans les logs de votre serveur :

```
[AUTO-TERMINATION] 2 campagne(s) clôturée(s)
{
  campaigns: [
    { id: 'xxx', name: 'Campagne Test', endDate: '2026-01-25T...' }
  ],
  providersReleased: 5,
  affectationsClosed: 5,
  timestamp: '2026-01-26T...'
}
```

## Sécurité

- ✅ Endpoint cron protégé par clé secrète
- ✅ Transaction Prisma pour garantir la cohérence
- ✅ Cache pour éviter les exécutions multiples
- ✅ Logging détaillé pour le monitoring
