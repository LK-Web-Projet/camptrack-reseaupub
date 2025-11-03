🛠️ CampTrack – RéseauPub

Système de gestion des campagnes publicitaires sur tricycles

Backend : Next.js (App Router) + Prisma + PostgreSQL

Frontend : Next.js + shadcn/ui + Tailwind CSS

⚙️ Outils Utilisés
Outil	Rôle
Next.js
	Framework full-stack (API + Pages)
Prisma
	ORM avec migrations versionnées
PostgreSQL
	Base de données relationnelle
Tailwind CSS
	Framework CSS utilitaire
shadcn/ui
	Composants UI réutilisables
JWT (jsonwebtoken)
	Authentification sécurisée
bcryptjs
	Hashage des mots de passe
Joi
	Validation des entrées API
🧩 Structure du Projet
src/
├── app/
│   └── api/                  # Tous les endpoints API
│   |   ├── auth/login/       # POST /api/auth/login
│   |   ├── users/            # GET/POST /api/users (Admin)
│   |   └── ...               # Autres routes
│   └── generated/prisma/     # Types Prisma auto-générés
├── lib/
│   ├── auth/jwt.ts           # Génération / vérification des tokens JWT
│   ├── validation/           # Schémas Joi pour la validation
│   └── business/             # Logique métier (paiement, pénalités)
│
├── prisma/
│   ├── schema.prisma         # Schéma de la base de données (modèles + relations)
│   └── migrations/           # Historique des migrations Prisma
│


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
npx prisma migrate dev --name <nom-changement>

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

## 🚨 Nouvelles fonctionnalités (authentification)

J'ai ajouté une implémentation d'authentification backend avec JWT, stockage sécurisé des refresh tokens et des endpoints pour gérer les sessions.

Principaux fichiers ajoutés / modifiés:

- `lib/auth/jwt.ts` — helpers pour signer / vérifier access & refresh tokens (HS256)
- `lib/auth/hash.ts` — wrappers bcrypt pour hash/compare
- `lib/middleware/authMiddleware.ts` — utilitaire `requireAdmin(req)` qui vérifie que le JWT appartient à un ADMIN
- `app/api/auth/login/route.ts` — login : renvoie `accessToken` et `refreshToken`, stocke le refresh token hashé en base
- `app/api/auth/register/route.ts` — création d'utilisateur (désormais protégée : ADMIN only)
- `app/api/auth/refresh/route.ts` — refresh : rotation du refresh token (vérifie le hash en base, révoque l'ancien, crée le nouveau)
- `app/api/auth/logout/route.ts` — logout : révoque un refresh token
- `app/api/docs/route.ts` — spec OpenAPI JSON minimal pour les endpoints d'auth

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

## 📚 Documentation OpenAPI

- Le spec minimal est disponible à `GET /api/docs` (JSON OpenAPI). Vous pouvez brancher Swagger UI côté frontend ou localement pour visualiser les endpoints.

---

Si tu veux, je peux :

- A : ajouter un exemple Postman / collection Thundger Client
- B : ajouter la mise en place du cookie HttpOnly pour le refresh token
- C : générer une page `/docs` avec Swagger UI intégrée (frontend) — mais tu as précisé que tu touches le backend uniquement

Dis-moi ce que tu veux que j'ajoute ensuite et je l'implémente.
