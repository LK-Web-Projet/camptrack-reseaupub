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
