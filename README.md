# CampTrack API

> API RESTful pour la gestion des campagnes publicitaires sur tricycles, avec authentification JWT et gestion des rôles.

## Table des matières

- [Description](#description)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Gestion des Campagnes](#gestion-des-campagnes)
- [API Reference](#api-reference)
- [Sécurité](#sécurité--gestion-des-accès)
- [Technique](#technique)
- [Documentation](#documentation)

## Description

CampTrack est une API développée avec Next.js (App Router) permettant de gérer les campagnes publicitaires, les utilisateurs et leurs rôles. Elle propose une authentification sécurisée JWT avec refresh tokens, une gestion fine des permissions, et une documentation OpenAPI.

### Fonctionnalités principales

- 🔐 Authentification JWT avec refresh tokens
- 👥 Gestion sécurisée des sessions (stockage hash)
- 🛡️ CRUD Utilisateurs (admin-only)
- 📊 Gestion des rôles (ADMIN, SUPERVISEUR_CAMPAGNE, etc.)
- 🚀 Gestion des campagnes publicitaires
- 📍 Gestion des lieux et prestataires
- ✅ Validation des données (Joi)
- 📖 Documentation OpenAPI

## Technologies

### Backend
- **Next.js 14** (App Router) - Framework React full-stack
- **Prisma** - ORM avec migrations  
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification sécurisée
- **bcryptjs** - Hashage des mots de passe
- **Joi** - Validation des données
- **TypeScript** - Typage statique

### Frontend
- **Next.js** - Framework React 
- **shadcn/ui** - Composants UI
- **TailwindCSS** - Framework CSS

## Structure du Projet

```
.
├── app/                    # Routes et API handlers
│   ├── api/               # API REST endpoints
│   │   ├── auth/          # Authentication
│   │   ├── users/         # Users management 
│   │   └── ...           # Other endpoints
│   └── ...               # Frontend pages
├── lib/                   # Shared libraries
│   ├── auth/             # Auth utilities
│   ├── validation/       # Joi schemas
│   └── business/         # Business logic
└── prisma/               # Database
    ├── schema.prisma     # DB schema
    └── migrations/       # Migration history
```

## Installation

1. **Prérequis**
   - Node.js >= 18
   - pnpm
   - PostgreSQL >= 15

2. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd camptrack-reseaupub
   ```

3. **Installer les dépendances**
   ```bash
   pnpm install
   ```

## Configuration

1. **Variables d'environnement**

   Créez un fichier `.env` à la racine :

   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/camptrack"
   JWT_ACCESS_SECRET=<votre-secret-jwt-access>
   JWT_REFRESH_SECRET=<votre-secret-jwt-refresh>
   NODE_ENV=development
   CRON_SECRET=<votre-secret-cron>
   ```

   

   Pour générer des secrets JWT sécurisés :
   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

2. **Initialiser la base de données**
   ```bash
   pnpm exec prisma generate    # Génère le client Prisma
   pnpm exec prisma migrate dev # Applique les migrations
   ```

3. **Créer un administrateur**
   ```bash
   pnpm exec prisma db seed
   ```

4. **Lancer le serveur**
   ```bash
   pnpm dev
   ```

   L'API sera disponible sur `http://localhost:3000/api`

## API Reference

### Campagnes (Gestion des campagnes publicitaires)

#### `GET /api/campagnes`
Liste toutes les campagnes (paginée)

Paramètres de requête:
- `page`: numéro de page (défaut: 1)
- `limit`: nombre d'éléments par page (défaut: 50)
- `status`: filtrer par statut
- `clientId`: filtrer par client
- `lieuId`: filtrer par lieu

#### `POST /api/campagnes`
Créer une nouvelle campagne :
```json
{
  "nom_campagne": "string",
  "description": "string",
  "objectif": "string",
  "type_campagne": "MASSE|CIBLEE",
  "date_debut": "2025-01-01T00:00:00Z",
  "date_fin": "2025-01-15T00:00:00Z",
  "id_client": "string",
  "id_lieu": "string",
  "id_service": "string"
}
```

#### `GET /api/campagnes/:id`
Détails d'une campagne avec ses relations (client, lieu, prestataires)

#### `PUT /api/campagnes/:id`
Modifier une campagne

#### `DELETE /api/campagnes/:id`
Supprimer une campagne

#### `PUT /api/campagnes/:id/status`
Changer le statut d'une campagne :
```json
{
  "status": "PLANIFIEE|EN_COURS|TERMINEE|ANNULEE"
}
```

### Prestataires (Gestion des prestataires)

#### `GET /api/prestataires`
Liste tous les prestataires (paginée)

#### `POST /api/prestataires` 
Créer un nouveau prestataire :
```json
{
  "nom": "string",
  "prenom": "string",
  "telephone": "string",
  "email": "string",
  "adresse": "string",
  "zone_intervention": "string"
}
```

#### `GET /api/prestataires/:id`
Détails d'un prestataire

#### `PUT /api/prestataires/:id`
Modifier un prestataire

#### `DELETE /api/prestataires/:id`
Supprimer un prestataire

#### `GET /api/campagnes/:id/prestataires`
Liste les prestataires affectés à une campagne

#### `POST /api/campagnes/:id/prestataires`
Affecter un prestataire à une campagne :
```json
{
  "id_prestataire": "string"
}
```

### Lieux (Gestion des lieux d'intervention)

#### `GET /api/lieux`
Liste tous les lieux (paginée)

#### `POST /api/lieux`
Créer un nouveau lieu :
```json
{
  "nom": "string",
  "adresse": "string",
  "ville": "string",
  "code_postal": "string",
  "type": "QUARTIER|AVENUE|PLACE",
  "description": "string"
}
```

#### `GET /api/lieux/:id`
Détails d'un lieu

#### `PUT /api/lieux/:id`
Modifier un lieu

#### `DELETE /api/lieux/:id`
Supprimer un lieu

### Authentification

#### `POST /api/auth/login`
```json
{
  "email": "string",
  "password": "string"
}
```
Réponse :
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "role": "ADMIN|SUPERVISEUR|EQUIPE"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### `POST /api/auth/refresh`
```json
{
  "refreshToken": "string"
}
```

#### `POST /api/auth/logout`
```json
{
  "refreshToken": "string"
}
```

### Gestion des Campagnes

#### `GET /api/campagnes`
Liste toutes les campagnes (paginée)

Paramètres de requête:
- `page`: numéro de page (défaut: 1)
- `limit`: nombre d'éléments par page (défaut: 50)
- `status`: filtrer par statut
- `clientId`: filtrer par client
- `lieuId`: filtrer par lieu

#### `POST /api/campagnes`
Créer une nouvelle campagne :
```json
{
  "nom_campagne": "string",
  "description": "string",
  "objectif": "string",
  "type_campagne": "MASSE|CIBLEE",
  "date_debut": "2025-01-01T00:00:00Z",
  "date_fin": "2025-01-15T00:00:00Z",
  "id_client": "string",
  "id_lieu": "string",
  "id_service": "string"
}
```

#### `GET /api/campagnes/:id`
Détails d'une campagne avec ses relations (client, lieu, prestataires)

#### `PUT /api/campagnes/:id`
Modifier une campagne

#### `DELETE /api/campagnes/:id`
Supprimer une campagne

#### `PUT /api/campagnes/:id/status`
Changer le statut d'une campagne :
```json
{
  "status": "PLANIFIEE|EN_COURS|TERMINEE|ANNULEE"
}
```

### Gestion des Prestataires

#### `GET /api/campagnes/:id/prestataires`
Liste les prestataires affectés à une campagne

#### `POST /api/campagnes/:id/prestataires`
Affecter un prestataire :
```json
{
  "id_prestataire": "string"
}
```

### Gestion des Fichiers

#### `GET /api/campagnes/:id/fichiers`
Liste les fichiers d'une campagne

Paramètres de requête:
- `type`: filtrer par type de fichier

### Utilisateurs (ADMIN only)

#### `POST /api/users`
Créer un utilisateur :
```json
{
  "email": "string",
  "password": "string",
  "role": "ADMIN|SUPERVISEUR|EQUIPE",
  "nom": "string",
  "prenom": "string"
}
```

#### `GET /api/users`
Liste tous les utilisateurs (paginé)

#### `GET /api/users/:id`
Détails d'un utilisateur

#### `PUT /api/users/:id`
Modifier un utilisateur

#### `DELETE /api/users/:id`
Supprimer un utilisateur

### Documentation API

#### `GET /api/docs`
Documentation OpenAPI complète de l'API

## Sécurité & Gestion des accès

### Authentification JWT

- **Access Token**
  - Durée de validité : 1 heure
  - Stocké côté client
  - Contient : userId, role
  - Algorithme : HS256

- **Refresh Token**
  - Durée de validité : 7 jours
  - Stocké hashé en base
  - Rotation à chaque utilisation
  - Cookie HttpOnly en prod

### Protection des données

- Validation des entrées (Joi)
- Hashage bcrypt (mots de passe)
- Rate limiting sur l'auth
- Middleware CORS configuré
- Headers sécurité (Helmet)

### Gestion des rôles

- ADMIN : Accès total
- SUPERVISEUR : Gestion campagnes
- EQUIPE : Actions limitées

## Architecture du Projet

```
├── app/                  # Routes et API
│   ├── api/             # Endpoints REST
│   │   ├── auth/        # Authentification
│   │   │   ├── login/   # POST /login
│   │   │   ├── refresh/ # POST /refresh
│   │   │   └── logout/  # POST /logout
│   │   ├── users/      # CRUD utilisateurs
│   │   └── ...        # Autres routes
│   └── ...           # Pages frontend
├── lib/              # Utilitaires
│   ├── auth/        # JWT + bcrypt
│   ├── validation/  # Schémas Joi
│   └── business/    # Logique métier
└── prisma/          # Base de données
    ├── schema.prisma    # Modèles
    └── migrations/      # Migrations
```


🚀 Initialisation du Projet (Équipe)

Prérequis :

pnpm

PostgreSQL

Fichier .env configuré

1️⃣ Cloner et installer les dépendances
git clone <repo-url>
cd camptrack-reseaupub
pnpm install

2️⃣ Configurer les variables d’environnement

Fichier .env :

DATABASE_URL="postgresql://user:pass@localhost:5432/camptrack"
JWT_SECRET="super-secret-jwt-key-123456789-change-in-prod"


📄 Copie le fichier .env.example en .env et remplis les valeurs.

3️⃣ Appliquer les migrations Prisma
# Première initialisation
npx prisma migrate dev --name init-camptrack-full-schema

# Pour chaque modification du schéma
# Pour chaque modification du schéma (Recommandé en dev)
npx prisma migrate dev --name <nom-changement>

# Pour prototyper rapidement sans historique (Attention aux données)
npx prisma db push

4️⃣ Générer les types Prisma
npx prisma generate

5️⃣ Lancer le projet en mode développement
pnpm dev


API Backend : http://localhost:3000/api/
...

Interface Frontend : http://localhost:3000

🧰 Scripts Utiles
Script	Commande	Description
dev	pnpm dev	Lance le serveur Next.js
prisma:studio	npx prisma studio	Interface visuelle de la base de données
prisma:generate	npx prisma generate	Régénère les types Prisma
prisma:migrate	npx prisma migrate dev	Crée ou applique les migrations
💻 Développement Backend (Octavio)
🔀 Branche
git checkout init/backend

🔧 Workflow de développement

Modifier le fichier prisma/schema.prisma

Générer et appliquer la migration :

npx prisma generate
npx prisma migrate dev --name <description>


Coder les routes dans app/api/...

Tester avec Postman ou Thunder Client

Commit clair :

git commit -m "feat(api): ajout /users + rôle ADMIN"

🔒 Sécurité & Bonnes Pratiques

🔑 JWT :

Access Token → durée 1h

Refresh Token → durée 7 jours

👥 Rôles utilisateurs : ADMIN, SUPERVISEUR_CAMPAGNE, etc.

🧩 Validation : via Joi sur toutes les entrées API

🕵️ Audit : table audit_logs activée

🔐 HTTPS obligatoire en production

⏱️ Rate limiting à ajouter (ex: express-rate-limit)

📚 Documentation Référente
Thème	Ressource
Framework principal	Next.js Documentation

ORM	Prisma Docs

Migration DB	Prisma Migrations

Authentification	JWT Guide

UI	shadcn/ui Documentation

## Contribution

### Préparer l'environnement

1. **Prérequis**
   - Node.js 18+
   - pnpm
   - PostgreSQL 15
   - Git

2. **Installation**
   ```bash
   # Cloner le repo
   git clone <repo-url>
   cd camptrack-reseaupub

   # Installer dépendances
   pnpm install

   # Configurer environnement
   cp .env.example .env
   # Remplir les variables

   # Setup base de données
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

### Développement

1. **Créer une nouvelle branche**
   ```bash
   git checkout -b feat/ma-feature
   ```

2. **Lancer en local**
   ```bash
   # Terminal 1 - API
   pnpm dev

   # Terminal 2 - DB UI (optionnel)
   pnpm prisma:studio
   ```

3. **Tester les changements**
   ```bash
   # Tests unitaires
   pnpm test
   
   # E2E
   pnpm test:e2e
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   git push origin feat/ma-feature
   ```

### Guide API

1. **Login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"test123"}'
   ```

2. **Créer utilisateur (Admin)**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "email": "user@test.com",
       "password": "test123",
       "role": "EQUIPE"
     }'
   ```

3. **Refresh token**
   ```bash
   curl -X POST http://localhost:3000/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "<token>"}'
   ```

4. **Logout**
   ```bash
   curl -X POST http://localhost:3000/api/auth/logout \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "<token>"}'
   ```

### Bonnes pratiques

1. **Code**
   - TypeScript strict mode
   - ESLint & Prettier
   - Tests unitaires (Jest)
   - Tests E2E (Cypress)

2. **Git**
   - Une feature par branche
   - Commits atomiques
   - PR pour review
   - Squash merge

3. **Sécurité**
   - Tokens JWT en HttpOnly
   - Validation Joi stricte  
   - CORS configuré
   - Rate limiting
   - Audit logs

## 🔑 Sécrets & .env

Créez ou mettez à jour votre fichier `.env.local` avec ces variables (exemples) :

```text
DATABASE_URL="postgresql://user:password@localhost:5432/camptrack"
JWT_ACCESS_SECRET=<généré-avec-crypto-randombytes>
JWT_REFRESH_SECRET=<généré-avec-crypto-randombytes>
SEED_ADMIN_EMAIL=user@admin.com
SEED_ADMIN_PASSWORD=ChangeMe123!
```

Générer des secrets robustes (PowerShell) :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Ne jamais stocker les secrets de production dans le repo.

## 🧪 Processus pour tester localement (auth)

1) Installer & configurer :

```powershell
pnpm install
# copier .env.example -> .env.local et remplir
```

2) Appliquer les migrations / générer client Prisma (si nécessaire) :

```powershell
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

3) (Optionnel) Seeder admin (si vous voulez créer/mettre à jour l'admin) :

```powershell
# Définit SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD dans .env.local si besoin
pnpm exec prisma db seed
```

4) Lancer le serveur :

```powershell
pnpm dev
```

5) Login (obtenir tokens) :

```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"user@admin.com","password":"ChangeMe123!"}'
```

Réponse attendue :
```json
{
	"user": { /* user sans password */ },
	"accessToken": "...",
	"refreshToken": "..."
}
```

6) Créer un nouvel utilisateur (ADMIN only) :

```powershell
curl -X POST http://localhost:3000/api/auth/register \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <ACCESS_TOKEN>" \
	-d '{"email":"newuser@local","password":"Password123!","nom":"Nom","prenom":"Prenom","type_user":"EQUIPE"}'
```

7) Rafraîchir le token (rotation) :

```powershell
curl -X POST http://localhost:3000/api/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

La route va vérifier le refreshToken, comparer le hash en DB, révoquer l'ancien et renvoyer un nouvel accessToken + refreshToken.

8) Logout (révoquer refresh token) :

```powershell
curl -X POST http://localhost:3000/api/auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

## ✅ Bonnes pratiques recommandées

- Stocker les refresh tokens en base hashed (déjà implémenté) — permet la révocation.
- En production, envoyer le refresh token dans un cookie HttpOnly Secure et ne pas le renvoyer dans le body.
- Garder l'access token court (ex: 1 heure) et le refresh token plus long (7 jours) — rotation implémentée.
- Restreindre l'endpoint `register` au rôle ADMIN (déjà fait via `requireAdmin`).
- Ajouter tests E2E pour login/refresh/logout.

## Technique

### Scripts Spécifiques
- **Import Prestataires** : `npx tsx prisma/import-prestataires.ts`
  - Utilise un fichier Excel dans `data/prestataires.xlsx`.
  - Crée les services manquants et génère les IDs.


## Scripts & Commandes

### Scripts NPM
```bash
# Développement
pnpm dev           # Lance le serveur
pnpm build         # Build de production
pnpm start         # Démarre en prod

# Base de données
pnpm prisma:studio      # Interface DB
pnpm prisma:generate    # Génère types
pnpm prisma:migrate     # Migrations
pnpm prisma:seed        # Crée admin
pnpm prisma:import      # MIGRATION: Import prestataires (Excel)

# Tests
pnpm test              # Tests unitaires
pnpm test:watch        # Tests en watch
pnpm test:e2e         # Tests E2E
```

### Workflow Git

```bash
# Nouvelle feature
git checkout -b feat/auth-jwt
git add .
git commit -m "feat(auth): implementation JWT"
git push origin feat/auth-jwt

# Review & merge
git checkout main
git pull origin main
git merge feat/auth-jwt
git push origin main
```

## Documentation

### Docs officielles
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs/)
- [JWT](https://jwt.io/introduction)
- [TailwindCSS](https://tailwindcss.com/docs)

### Outils recommandés
- Thunder Client (VS Code) - Tests API
- Prisma VS Code - Support schema
- Git Graph - Visualisation Git

### API OpenAPI
Spec disponible sur `GET /api/docs`
