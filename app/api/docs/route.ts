import { NextResponse } from "next/server";

const openApi = {
  openapi: "3.0.0",
  info: {
    title: "CampTrack API - RéseauPub",
    version: "1.0.0",
    description: "API pour la gestion des campagnes publicitaires sur tricycles",
    contact: {
      name: "Support CampTrack",
      email: "support@camptrack.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Serveur de développement",
    },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Connexion utilisateur",
        description: "Authentifie un utilisateur et retourne les tokens JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "admin@camptrack.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "admin123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Connexion réussie",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
                example: {
                  user: {
                    id_user: "cmhj6gt2l0000v6wssjon4cub",
                    email: "admin@camptrack.com",
                    nom: "Admin",
                    prenom: "CampTrack",
                    type_user: "ADMIN",
                  },
                  accessToken: "eyJhbGciOiJIUzI1NiIs...",
                  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
                },
              },
            },
          },
          "400": {
            description: "Données manquantes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Email ou mot de passe incorrect",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Créer un utilisateur (ADMIN seulement)",
        description:
          "Créer un nouvel utilisateur. Nécessite un token JWT d'administrateur.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "email",
                  "password",
                  "nom",
                  "prenom",
                  "type_user",
                ],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "nouveau@camptrack.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                  },
                  nom: { type: "string", example: "Dupont" },
                  prenom: { type: "string", example: "Jean" },
                  type_user: {
                    type: "string",
                    enum: [
                      "ADMIN",
                      "SUPERVISEUR_CAMPAGNE",
                      "CONTROLEUR",
                      "OPERATIONNEL",
                      "EQUIPE",
                    ],
                    example: "EQUIPE",
                  },
                  contact: { type: "string", example: "+225 07 12 34 56 78" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Utilisateur créé avec succès",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": { description: "Données manquantes ou invalides" },
          "401": { description: "Token manquant ou invalide" },
          "403": { description: "Accès refusé - Admin requis" },
          "409": { description: "Email déjà utilisé" },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rafraîchir le token d'accès",
        description:
          "Permet de générer un nouveau token d'accès à partir d'un refresh token valide.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token rafraîchi avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
                example: {
                  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
          "401": {
            description: "Refresh token invalide ou expiré",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Déconnexion",
        description:
          "Révoque le refresh token et déconnecte l'utilisateur du système.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Déconnexion réussie",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Utilisateur déconnecté avec succès",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Token invalide ou manquant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Message d'erreur descriptif",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id_user: { type: "string" },
          email: { type: "string" },
          nom: { type: "string" },
          prenom: { type: "string" },
          type_user: { type: "string" },
          contact: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApi);
}
