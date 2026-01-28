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
    // ==================== AUTHENTIFICATION ====================
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
            description: "Connexion réussie (cookies `accessToken` et `refreshToken` également envoyés)",
            headers: {
              "Set-Cookie": {
                description: "Cookies `accessToken` et `refreshToken` sont définis (httpOnly, secure en production)",
                schema: { type: "string" }
              }
            },
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
                    contact: "+225 01 23 45 67 89",
                    is_active: true,
                    created_at: "2025-01-03T10:00:00.000Z"
                  },
                  accessToken: "eyJhbGciOiJIUzI1NiIs...",
                  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
                },
              },
            },
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Email et mot de passe requis"
                }
              },
            },
          },
          "401": {
            description: "Email ou mot de passe incorrect",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Utilisateur non trouvé"
                }
              },
            },
          },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rafraîchir le token d'accès",
        description: "Génère un nouveau token d'accès. Le `refreshToken` peut être fourni dans le body ou envoyé automatiquement via le cookie `refreshToken`.",
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
            description: "Token rafraîchi avec succès (cookies mis à jour)",
            headers: {
              "Set-Cookie": {
                description: "Nouveaux cookies `accessToken` et `refreshToken` définis",
                schema: { type: "string" }
              }
            },
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
          "400": {
            description: "Refresh token manquant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Refresh token manquant"
                }
              },
            },
          },
          "401": {
            description: "Refresh token invalide",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Refresh token invalide ou expiré"
                }
              },
            },
          },
        },
      },
    },

    "/auth/logout": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Déconnexion de l'utilisateur",
        "description": "Révoque le refresh token, supprime les cookies d'authentification et déconnecte l'utilisateur. Le token peut être envoyé dans le body ou via un cookie. Après déconnexion, l'utilisateur ne pourra plus accéder aux routes protégées même si son access token n'est pas expiré.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "refreshToken": {
                    "type": "string",
                    "description": "Refresh token à révoquer (optionnel si présent dans les cookies)",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Déconnexion réussie",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "ok": {
                      "type": "boolean",
                      "description": "Statut de l'opération",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "description": "Message de confirmation",
                      "example": "Déconnexion réussie"
                    },
                    "tokens_revoked": {
                      "type": "integer",
                      "description": "Nombre de tokens révoqués",
                      "example": 1
                    }
                  },
                  "required": ["ok", "message"]
                },
                "examples": {
                  "successWithToken": {
                    "summary": "Déconnexion avec token révoqué",
                    "value": {
                      "ok": true,
                      "message": "Déconnexion réussie",
                      "tokens_revoked": 1
                    }
                  },
                  "successNoToken": {
                    "summary": "Déconnexion sans token à révoquer",
                    "value": {
                      "ok": true,
                      "message": "Aucun token à révoquer - Déconnexion effectuée",
                      "tokens_revoked": 0
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non autorisé - Token d'accès invalide ou expiré",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "invalidToken": {
                    "summary": "Token invalide",
                    "value": {
                      "error": "Token invalide",
                      "message": "Le token d'accès est invalide ou expiré"
                    }
                  },
                  "userNotFound": {
                    "summary": "Utilisateur non trouvé",
                    "value": {
                      "error": "Utilisateur non trouvé",
                      "message": "L'utilisateur associé au token n'existe pas ou a été désactivé"
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Erreur interne du serveur",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "serverError": {
                    "summary": "Erreur serveur",
                    "value": {
                      "error": "Erreur serveur",
                      "message": "Une erreur est survenue lors de la déconnexion"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES UTILISATEURS ====================
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Lister tous les utilisateurs (ADMIN seulement)",
        description: "Récupère la liste paginée de tous les utilisateurs",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre d'utilisateurs par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Liste des utilisateurs récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  users: [
                    {
                      id_user: "cmhj6gt2l0000v6wssjon4cub",
                      email: "admin@camptrack.com",
                      nom: "Admin",
                      prenom: "CampTrack",
                      type_user: "ADMIN",
                      contact: "+225 01 23 45 67 89",
                      is_active: true,
                      created_at: "2025-01-03T10:00:00.000Z",
                      updated_at: "2025-01-03T10:00:00.000Z"
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Créer un nouvel utilisateur (ADMIN seulement)",
        description: "Crée un nouvel utilisateur dans le système",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nom", "prenom", "type_user"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "nouveau@camptrack.com"
                  },
                  password: {
                    type: "string",
                    format: "password",
                    minLength: 6,
                    example: "password123"
                  },
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Dupont"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    example: "Jean"
                  },
                  type_user: {
                    type: "string",
                    enum: ["ADMIN", "SUPERVISEUR_CAMPAGNE", "CONTROLEUR", "OPERATIONNEL", "EQUIPE"],
                    example: "EQUIPE"
                  },
                  contact: {
                    type: "string",
                    example: "+225 07 12 34 56 78"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Utilisateur créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                },
                example: {
                  message: "Utilisateur créé avec succès",
                  user: {
                    id_user: "cmkj7ht3m0001w7xttkpoc5d",
                    email: "nouveau@camptrack.com",
                    nom: "Dupont",
                    prenom: "Jean",
                    type_user: "EQUIPE",
                    contact: "+225 07 12 34 56 78",
                    is_active: true,
                    created_at: "2025-01-03T14:00:00.000Z",
                    updated_at: "2025-01-03T14:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le mot de passe doit contenir au moins 6 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          },
          "409": {
            description: "Email déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un utilisateur avec cet email existe déjà"
                }
              }
            }
          }
        }
      }
    },

    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Récupérer un utilisateur spécifique (ADMIN seulement)",
        description: "Récupère les détails d'un utilisateur par son ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de l'utilisateur",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Utilisateur récupéré avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                },
                example: {
                  user: {
                    id_user: "cmhj6gt2l0000v6wssjon4cub",
                    email: "admin@camptrack.com",
                    nom: "Admin",
                    prenom: "CampTrack",
                    type_user: "ADMIN",
                    contact: "+225 01 23 45 67 89",
                    is_active: true,
                    created_at: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T10:00:00.000Z"
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Utilisateur non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Utilisateur non trouvé"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Modifier un utilisateur (ADMIN seulement)",
        description: "Modifie les informations d'un utilisateur existant",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de l'utilisateur à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "nouveau-email@camptrack.com"
                  },
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "NouveauNom"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    example: "NouveauPrenom"
                  },
                  type_user: {
                    type: "string",
                    enum: ["ADMIN", "SUPERVISEUR_CAMPAGNE", "CONTROLEUR", "OPERATIONNEL", "EQUIPE"],
                    example: "SUPERVISEUR_CAMPAGNE"
                  },
                  contact: {
                    type: "string",
                    example: "+225 08 76 54 32 10"
                  },
                  is_active: {
                    type: "boolean",
                    example: true
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Utilisateur modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                },
                example: {
                  message: "Utilisateur modifié avec succès",
                  user: {
                    id_user: "cmhj6gt2l0000v6wssjon4cub",
                    email: "nouveau-email@camptrack.com",
                    nom: "NouveauNom",
                    prenom: "NouveauPrenom",
                    type_user: "SUPERVISEUR_CAMPAGNE",
                    contact: "+225 08 76 54 32 10",
                    is_active: true,
                    created_at: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Utilisateur non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Email déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un utilisateur avec cet email existe déjà"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Supprimer un utilisateur (ADMIN seulement)",
        description: "Supprime un utilisateur du système. Impossible de se supprimer soi-même.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de l'utilisateur à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Utilisateur supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Utilisateur supprimé avec succès"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Vous ne pouvez pas supprimer votre propre compte"
                }
              }
            }
          },
          "404": {
            description: "Utilisateur non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/users/{id}/password": {
      put: {
        tags: ["Users"],
        summary: "Modifier le mot de passe d'un utilisateur (ADMIN seulement)",
        description: "Permet à un administrateur de modifier le mot de passe d'un utilisateur spécifique",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de l'utilisateur dont on veut modifier le mot de passe",
            schema: {
              type: "string",
              example: "cmhj6gt2l0000v6wssjon4cub"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["newPassword"],
                properties: {
                  newPassword: {
                    type: "string",
                    format: "password",
                    minLength: 6,
                    description: "Nouveau mot de passe (minimum 6 caractères)",
                    example: "nouveauMotDePasse123"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Mot de passe modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                },
                example: {
                  message: "Mot de passe modifié avec succès",
                  user: {
                    id_user: "cmhj6gt2l0000v6wssjon4cub",
                    email: "admin@camptrack.com",
                    nom: "Admin",
                    prenom: "CampTrack",
                    type_user: "ADMIN",
                    contact: "+225 01 23 45 67 89",
                    is_active: true,
                    created_at: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le mot de passe doit contenir au moins 6 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Utilisateur non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES SERVICES ====================
    "/services": {
      get: {
        tags: ["Services"],
        summary: "Lister tous les services",
        description: "Récupère la liste paginée de tous les services avec leurs statistiques",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de services par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Liste des services récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    services: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ServiceWithStats" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  services: [
                    {
                      id_service: "cmservice001",
                      nom: "Publicité sur tricycles",
                      description: "Service de publicité mobile sur tricycles",
                      created_at: "2025-01-03T10:00:00.000Z",
                      _count: {
                        campagnes: 5,
                        prestataires: 12
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Services"],
        summary: "Créer un nouveau service (ADMIN seulement)",
        description: "Crée un nouveau service dans le système",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nom"],
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Publicité digitale"
                  },
                  description: {
                    type: "string",
                    example: "Service de publicité sur écrans digitaux"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Service créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    service: { $ref: "#/components/schemas/Service" }
                  }
                },
                example: {
                  message: "Service créé avec succès",
                  service: {
                    id_service: "cmservice002",
                    nom: "Publicité digitale",
                    description: "Service de publicité sur écrans digitaux",
                    created_at: "2025-01-03T16:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le nom doit contenir au moins 2 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Nom de service déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un service avec ce nom existe déjà"
                }
              }
            }
          }
        }
      }
    },

    "/services/{id}": {
      get: {
        tags: ["Services"],
        summary: "Récupérer un service spécifique",
        description: "Récupère les détails d'un service par son ID avec ses prestataires et campagnes associées",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du service",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Service récupéré avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: { $ref: "#/components/schemas/ServiceWithDetails" }
                  }
                },
                example: {
                  service: {
                    id_service: "cmservice001",
                    nom: "Publicité sur tricycles",
                    description: "Service de publicité mobile sur tricycles",
                    created_at: "2025-01-03T10:00:00.000Z",
                    prestataires: [
                      {
                        id_prestataire: "cmpresta001",
                        nom: "Koné",
                        prenom: "Moussa",
                        contact: "+225 07 12 34 56 78",
                        disponible: true,
                        created_at: "2025-01-03T11:00:00.000Z"
                      }
                    ],
                    campagnes: [
                      {
                        id_campagne: "cmcamp001",
                        nom_campagne: "Campagne Coca-Cola",
                        date_debut: "2025-01-10T00:00:00.000Z",
                        date_fin: "2025-01-20T00:00:00.000Z",
                        status: "PLANIFIEE",
                        client: {
                          nom: "Traoré",
                          prenom: "Aïcha",
                          entreprise: "Coca-Cola CI"
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Service non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Service non trouvé"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Services"],
        summary: "Modifier un service (ADMIN seulement)",
        description: "Modifie les informations d'un service existant",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du service à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau nom du service"
                  },
                  description: {
                    type: "string",
                    example: "Nouvelle description du service"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Service modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    service: { $ref: "#/components/schemas/Service" }
                  }
                },
                example: {
                  message: "Service modifié avec succès",
                  service: {
                    id_service: "cmservice001",
                    nom: "Nouveau nom du service",
                    description: "Nouvelle description du service",
                    created_at: "2025-01-03T10:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Service non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Nom de service déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un service avec ce nom existe déjà"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Services"],
        summary: "Supprimer un service (ADMIN seulement)",
        description: "Supprime un service du système. Impossible de supprimer un service utilisé dans des campagnes ou par des prestataires.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du service à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Service supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Service supprimé avec succès"
                }
              }
            }
          },
          "400": {
            description: "Service utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Impossible de supprimer ce service car il est utilisé dans des campagnes ou par des prestataires"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Service non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/services/{id}/prestataires": {
      get: {
        tags: ["Services"],
        summary: "Lister les prestataires d'un service",
        description: "Récupère la liste paginée des prestataires associés à un service spécifique. **Tri appliqué :** Les prestataires disponibles apparaissent en premier, puis tri par ancienneté (les plus anciens d'abord).",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du service",
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de prestataires par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          },
          {
            name: "disponible",
            in: "query",
            required: false,
            description: "Filtrer par disponibilité",
            schema: { type: "boolean" }
          }
        ],
        responses: {
          "200": {
            description: "Liste des prestataires récupérée avec succès. Tri : disponibles d'abord, puis par ancienneté.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: {
                      type: "object",
                      properties: {
                        id_service: { type: "string" },
                        nom: { type: "string" }
                      }
                    },
                    prestataires: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PrestataireWithStats" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  service: {
                    id_service: "cmservice001",
                    nom: "Publicité sur tricycles"
                  },
                  prestataires: [
                    {
                      id_prestataire: "cmpresta001",
                      nom: "Koné",
                      prenom: "Moussa",
                      contact: "+225 07 12 34 56 78",
                      disponible: true,
                      created_at: "2025-01-03T11:00:00.000Z",
                      vehicule: {
                        type_panneau: "GRAND",
                        marque: "Toyota",
                        modele: "Hilux",
                        plaque: "AB-123-CD"
                      },
                      _count: {
                        affectations: 3
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Service non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES CLIENTS ====================
    "/clients": {
      get: {
        tags: ["Clients"],
        summary: "Lister tous les clients",
        description: "Récupère la liste paginée de tous les clients avec leurs statistiques",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de clients par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Liste des clients récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    clients: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ClientWithStats" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  clients: [
                    {
                      id_client: "cmclient001",
                      nom: "Dupont",
                      prenom: "Jean",
                      entreprise: "Entreprise ABC",
                      domaine_entreprise: "Informatique",
                      adresse: "123 Rue Example",
                      contact: "+225 01 23 45 67 89",
                      mail: "jean.dupont@example.com",
                      type_client: "Entreprise",
                      created_at: "2025-01-03T10:00:00.000Z",
                      updated_at: "2025-01-03T10:00:00.000Z",
                      _count: {
                        campagnes: 5
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Clients"],
        summary: "Créer un nouveau client (ADMIN seulement)",
        description: "Crée un nouveau client dans le système",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nom", "prenom", "type_client"],
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Dupont"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    example: "Jean"
                  },
                  entreprise: {
                    type: "string",
                    example: "Entreprise ABC"
                  },
                  domaine_entreprise: {
                    type: "string",
                    example: "Informatique"
                  },
                  adresse: {
                    type: "string",
                    example: "123 Rue Example"
                  },
                  contact: {
                    type: "string",
                    example: "+225 01 23 45 67 89"
                  },
                  mail: {
                    type: "string",
                    format: "email",
                    example: "jean.dupont@example.com"
                  },
                  type_client: {
                    type: "string",
                    example: "Entreprise"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Client créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    client: { $ref: "#/components/schemas/Client" }
                  }
                },
                example: {
                  message: "Client créé avec succès",
                  client: {
                    id_client: "cmclient001",
                    nom: "Dupont",
                    prenom: "Jean",
                    entreprise: "Entreprise ABC",
                    domaine_entreprise: "Informatique",
                    adresse: "123 Rue Example",
                    contact: "+225 01 23 45 67 89",
                    mail: "jean.dupont@example.com",
                    type_client: "Entreprise",
                    created_at: "2025-01-03T10:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le nom doit contenir au moins 2 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Email déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un client avec cet email existe déjà"
                }
              }
            }
          }
        }
      }
    },

    "/clients/{id}": {
      get: {
        tags: ["Clients"],
        summary: "Récupérer un client spécifique",
        description: "Récupère les détails d'un client par son ID avec ses campagnes associées",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du client",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Client récupéré avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client: { $ref: "#/components/schemas/ClientWithDetails" }
                  }
                },
                example: {
                  client: {
                    id_client: "cmclient001",
                    nom: "Dupont",
                    prenom: "Jean",
                    entreprise: "Entreprise ABC",
                    domaine_entreprise: "Informatique",
                    adresse: "123 Rue Example",
                    contact: "+225 01 23 45 67 89",
                    mail: "jean.dupont@example.com",
                    type_client: "Entreprise",
                    created_at: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T10:00:00.000Z",
                    campagnes: [
                      {
                        id_campagne: "cmcamp001",
                        nom_campagne: "Campagne Printemps 2025",
                        date_debut: "2025-03-01T00:00:00.000Z",
                        date_fin: "2025-03-15T00:00:00.000Z",
                        status: "PLANIFIEE",
                        lieu: {
                          nom: "Abidjan",
                          ville: "Abidjan"
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Client non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Client non trouvé"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Clients"],
        summary: "Modifier un client (ADMIN seulement)",
        description: "Modifie les informations d'un client existant",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du client à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau nom"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau prénom"
                  },
                  entreprise: {
                    type: "string",
                    example: "Nouvelle entreprise"
                  },
                  domaine_entreprise: {
                    type: "string",
                    example: "Nouveau domaine"
                  },
                  adresse: {
                    type: "string",
                    example: "Nouvelle adresse"
                  },
                  contact: {
                    type: "string",
                    example: "+225 07 12 34 56 78"
                  },
                  mail: {
                    type: "string",
                    format: "email",
                    example: "nouveau@example.com"
                  },
                  type_client: {
                    type: "string",
                    example: "Nouveau type"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Client modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    client: { $ref: "#/components/schemas/Client" }
                  }
                },
                example: {
                  message: "Client modifié avec succès",
                  client: {
                    id_client: "cmclient001",
                    nom: "Nouveau nom",
                    prenom: "Nouveau prénom",
                    entreprise: "Nouvelle entreprise",
                    domaine_entreprise: "Nouveau domaine",
                    adresse: "Nouvelle adresse",
                    contact: "+225 07 12 34 56 78",
                    mail: "nouveau@example.com",
                    type_client: "Nouveau type",
                    created_at: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Client non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Email déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un client avec cet email existe déjà"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Clients"],
        summary: "Supprimer un client (ADMIN seulement)",
        description: "Supprime un client du système. Impossible de supprimer un client ayant des campagnes associées.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du client à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Client supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Client supprimé avec succès"
                }
              }
            }
          },
          "400": {
            description: "Client utilisé dans des campagnes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Impossible de supprimer ce client car il a des campagnes associées"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Client non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/clients/{id}/campagnes": {
      get: {
        tags: ["Clients"],
        summary: "Lister les campagnes d'un client",
        description: "Récupère la liste paginée des campagnes associées à un client spécifique",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du client",
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de campagnes par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filtrer par statut",
            schema: {
              type: "string",
              enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
            }
          }
        ],
        responses: {
          "200": {
            description: "Liste des campagnes récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client: {
                      type: "object",
                      properties: {
                        id_client: { type: "string" },
                        nom: { type: "string" },
                        prenom: { type: "string" }
                      }
                    },
                    campagnes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id_campagne: { type: "string" },
                          nom_campagne: { type: "string" },
                          description: { type: "string" },
                          objectif: { type: "string" },
                          type_campagne: { type: "string" },
                          date_debut: { type: "string", format: "date-time" },
                          date_fin: { type: "string", format: "date-time" },
                          status: {
                            type: "string",
                            enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                          },
                          date_creation: { type: "string", format: "date-time" },
                          lieu: {
                            type: "object",
                            properties: {
                              nom: { type: "string" },
                              ville: { type: "string" }
                            }
                          },
                          service: {
                            type: "object",
                            properties: {
                              nom: { type: "string" }
                            }
                          },
                          _count: {
                            type: "object",
                            properties: {
                              affectations: { type: "integer" },
                              fichiers: { type: "integer" }
                            }
                          }
                        }
                      }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  client: {
                    id_client: "cmclient001",
                    nom: "Dupont",
                    prenom: "Jean"
                  },
                  campagnes: [
                    {
                      id_campagne: "cmcamp001",
                      nom_campagne: "Campagne Printemps 2025",
                      description: "Campagne de publicité pour le printemps",
                      objectif: "Augmenter la visibilité",
                      type_campagne: "MASSE",
                      date_debut: "2025-03-01T00:00:00.000Z",
                      date_fin: "2025-03-15T00:00:00.000Z",
                      status: "PLANIFIEE",
                      created_at: "2025-01-03T10:00:00.000Z",
                      lieu: {
                        nom: "Abidjan",
                        ville: "Abidjan"
                      },
                      service: {
                        nom: "Publicité sur tricycles"
                      },
                      _count: {
                        affectations: 5,
                        fichiers: 2
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Client non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES LIEUX ====================
    "/lieux": {
      get: {
        tags: ["Lieux"],
        summary: "Lister tous les lieux",
        description: "Récupère la liste paginée de tous les lieux avec leurs statistiques",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de lieux par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Liste des lieux récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lieux: {
                      type: "array",
                      items: { $ref: "#/components/schemas/LieuWithStats" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  lieux: [
                    {
                      id_lieu: "cmlieu001",
                      nom: "Abidjan Plateau",
                      ville: "Abidjan",
                      created_at: "2025-01-03T10:00:00.000Z",
                      _count: {
                        campagnes: 8
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Lieux"],
        summary: "Créer un nouveau lieu (ADMIN seulement)",
        description: "Crée un nouveau lieu dans le système",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nom", "ville"],
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Abidjan Plateau"
                  },
                  ville: {
                    type: "string",
                    minLength: 2,
                    example: "Abidjan"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Lieu créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    lieu: { $ref: "#/components/schemas/Lieu" }
                  }
                },
                example: {
                  message: "Lieu créé avec succès",
                  lieu: {
                    id_lieu: "cmlieu001",
                    nom: "Abidjan Plateau",
                    ville: "Abidjan",
                    created_at: "2025-01-03T10:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le nom doit contenir au moins 2 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Lieu déjà existant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un lieu avec ce nom et cette ville existe déjà"
                }
              }
            }
          }
        }
      }
    },

    "/lieux/{id}": {
      get: {
        tags: ["Lieux"],
        summary: "Récupérer un lieu spécifique",
        description: "Récupère les détails d'un lieu par son ID avec ses campagnes associées",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du lieu",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Lieu récupéré avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lieu: { $ref: "#/components/schemas/LieuWithDetails" }
                  }
                },
                example: {
                  lieu: {
                    id_lieu: "cmlieu001",
                    nom: "Abidjan Plateau",
                    ville: "Abidjan",
                    created_at: "2025-01-03T10:00:00.000Z",
                    campagnes: [
                      {
                        id_campagne: "cmcamp001",
                        nom_campagne: "Campagne Printemps 2025",
                        date_debut: "2025-03-01T00:00:00.000Z",
                        date_fin: "2025-03-15T00:00:00.000Z",
                        status: "PLANIFIEE",
                        client: {
                          nom: "Dupont",
                          prenom: "Jean",
                          entreprise: "Entreprise ABC"
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Lieu non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Lieu non trouvé"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Lieux"],
        summary: "Modifier un lieu (ADMIN seulement)",
        description: "Modifie les informations d'un lieu existant",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du lieu à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau nom"
                  },
                  ville: {
                    type: "string",
                    minLength: 2,
                    example: "Nouvelle ville"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Lieu modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    lieu: { $ref: "#/components/schemas/Lieu" }
                  }
                },
                example: {
                  message: "Lieu modifié avec succès",
                  lieu: {
                    id_lieu: "cmlieu001",
                    nom: "Nouveau nom",
                    ville: "Nouvelle ville",
                    created_at: "2025-01-03T10:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Lieu non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Lieu déjà existant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un lieu avec ce nom et cette ville existe déjà"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Lieux"],
        summary: "Supprimer un lieu (ADMIN seulement)",
        description: "Supprime un lieu du système. Impossible de supprimer un lieu utilisé dans des campagnes.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du lieu à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Lieu supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Lieu supprimé avec succès"
                }
              }
            }
          },
          "400": {
            description: "Lieu utilisé dans des campagnes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Impossible de supprimer ce lieu car il est utilisé dans des campagnes"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Lieu non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/lieux/{id}/campagnes": {
      get: {
        tags: ["Lieux"],
        summary: "Lister les campagnes d'un lieu",
        description: "Récupère la liste paginée des campagnes associées à un lieu spécifique",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du lieu",
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de campagnes par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filtrer par statut",
            schema: {
              type: "string",
              enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
            }
          }
        ],
        responses: {
          "200": {
            description: "Liste des campagnes récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lieu: {
                      type: "object",
                      properties: {
                        id_lieu: { type: "string" },
                        nom: { type: "string" },
                        ville: { type: "string" }
                      }
                    },
                    campagnes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id_campagne: { type: "string" },
                          nom_campagne: { type: "string" },
                          description: { type: "string" },
                          objectif: { type: "string" },
                          type_campagne: { type: "string" },
                          date_debut: { type: "string", format: "date-time" },
                          date_fin: { type: "string", format: "date-time" },
                          status: {
                            type: "string",
                            enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                          },
                          date_creation: { type: "string", format: "date-time" },
                          client: {
                            type: "object",
                            properties: {
                              nom: { type: "string" },
                              prenom: { type: "string" },
                              entreprise: { type: "string" }
                            }
                          },
                          service: {
                            type: "object",
                            properties: {
                              nom: { type: "string" }
                            }
                          },
                          _count: {
                            type: "object",
                            properties: {
                              affectations: { type: "integer" },
                              fichiers: { type: "integer" }
                            }
                          }
                        }
                      }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  lieu: {
                    id_lieu: "cmlieu001",
                    nom: "Abidjan Plateau",
                    ville: "Abidjan"
                  },
                  campagnes: [
                    {
                      id_campagne: "cmcamp001",
                      nom_campagne: "Campagne Printemps 2025",
                      description: "Campagne de publicité pour le printemps",
                      objectif: "Augmenter la visibilité",
                      type_campagne: "MASSE",
                      date_debut: "2025-03-01T00:00:00.000Z",
                      date_fin: "2025-03-15T00:00:00.000Z",
                      status: "PLANIFIEE",
                      date_creation: "2025-01-03T10:00:00.000Z",
                      client: {
                        nom: "Dupont",
                        prenom: "Jean",
                        entreprise: "Entreprise ABC"
                      },
                      service: {
                        nom: "Publicité sur tricycles"
                      },
                      _count: {
                        affectations: 5,
                        fichiers: 2
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Lieu non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES CAMPAGNES ====================
    "/campagnes": {
      get: {
        tags: ["Campagnes"],
        summary: "Lister toutes les campagnes",
        description: "Récupère la liste paginée de toutes les campagnes avec filtres optionnels par statut, client ou lieu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page pour la pagination",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de campagnes par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filtrer par statut de campagne",
            schema: {
              type: "string",
              enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
            }
          },
          {
            name: "clientId",
            in: "query",
            required: false,
            description: "Filtrer par ID de client",
            schema: { type: "string" }
          },
          {
            name: "lieuId",
            in: "query",
            required: false,
            description: "Filtrer par ID de lieu",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Liste des campagnes récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campagnes: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CampagneWithRelations" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  campagnes: [
                    {
                      id_campagne: "cmcamp001",
                      nom_campagne: "Campagne Printemps 2025",
                      description: "Campagne de publicité mobile pour la saison printanière",
                      objectif: "Augmenter la visibilité de la marque de 30%",
                      quantite_service: 100,
                      nbr_prestataire: 3,
                      type_campagne: "MASSE",
                      date_debut: "2025-03-01T00:00:00.000Z",
                      date_fin: "2025-03-15T00:00:00.000Z",
                      status: "PLANIFIEE",
                      date_creation: "2025-01-03T10:00:00.000Z",
                      client: {
                        nom: "Dupont",
                        prenom: "Jean",
                        entreprise: "Entreprise ABC"
                      },
                      lieu: {
                        nom: "Abidjan Plateau",
                        ville: "Abidjan"
                      },
                      service: {
                        nom: "Publicité sur tricycles"
                      },
                      gestionnaire: {
                        nom: "Admin",
                        prenom: "CampTrack",
                        email: "admin@camptrack.com"
                      },
                      _count: {
                        affectations: 5,
                        fichiers: 2
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Campagnes"],
        summary: "Créer une nouvelle campagne",
        description: "Crée une nouvelle campagne publicitaire avec vérification des conflits de dates et validation des relations",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id_client", "id_lieu", "id_service", "nom_campagne", "date_debut", "date_fin"],
                properties: {
                  id_client: {
                    type: "string",
                    description: "ID du client pour la campagne",
                    example: "cmclient001"
                  },
                  id_lieu: {
                    type: "string",
                    description: "ID du lieu où se déroule la campagne",
                    example: "cmlieu001"
                  },
                  id_service: {
                    type: "string",
                    description: "ID du service publicitaire utilisé",
                    example: "cmservice001"
                  },
                  nom_campagne: {
                    type: "string",
                    minLength: 2,
                    description: "Nom de la campagne",
                    example: "Campagne Printemps 2025"
                  },
                  description: {
                    type: "string",
                    description: "Description détaillée de la campagne",
                    example: "Campagne de publicité mobile pour promouvoir les nouveaux produits"
                  },
                  objectif: {
                    type: "string",
                    description: "Objectifs marketing de la campagne",
                    example: "Augmenter la notoriété de la marque de 25%"
                  },
                  quantite_service: {
                    type: "integer",
                    minimum: 1,
                    description: "Quantité de services publicitaires requis",
                    example: 100
                  },
                  nbr_prestataire: {
                    type: "integer",
                    minimum: 1,
                    description: "Nombre de prestataires à affecter à la campagne",
                    example: 3
                  },
                  type_campagne: {
                    type: "string",
                    enum: ["MASSE", "PROXIMITE"],
                    description: "Type de campagne publicitaire",
                    example: "MASSE"
                  },
                  date_debut: {
                    type: "string",
                    format: "date-time",
                    description: "Date et heure de début de la campagne",
                    example: "2025-03-01T00:00:00.000Z"
                  },
                  date_fin: {
                    type: "string",
                    format: "date-time",
                    description: "Date et heure de fin de la campagne",
                    example: "2025-03-15T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Campagne créée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    campagne: { $ref: "#/components/schemas/CampagneWithRelations" }
                  }
                },
                example: {
                  message: "Campagne créée avec succès",
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Campagne Printemps 2025",
                    description: "Campagne de publicité mobile pour promouvoir les nouveaux produits",
                    objectif: "Augmenter la notoriété de la marque de 25%",
                    quantite_service: 100,
                    nbr_prestataire: 3,
                    type_campagne: "MASSE",
                    date_debut: "2025-03-01T00:00:00.000Z",
                    date_fin: "2025-03-15T00:00:00.000Z",
                    status: "PLANIFIEE",
                    date_creation: "2025-01-03T10:00:00.000Z",
                    client: {
                      nom: "Dupont",
                      prenom: "Jean",
                      entreprise: "Entreprise ABC"
                    },
                    lieu: {
                      nom: "Abidjan Plateau",
                      ville: "Abidjan"
                    },
                    service: {
                      nom: "Publicité sur tricycles"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "La date de fin doit être après la date de début"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Ressource non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Client non trouvé"
                }
              }
            }
          },
          "409": {
            description: "Conflit de dates",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Une campagne existe déjà pour ce lieu pendant cette période: Campagne Hiver 2025"
                }
              }
            }
          }
        }
      }
    },

    "/campagnes/{id}": {
      get: {
        tags: ["Campagnes"],
        summary: "Récupérer une campagne spécifique",
        description: "Obtenir tous les détails d'une campagne incluant client, lieu, service, prestataires affectés, fichiers et statistiques",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Détails de la campagne récupérés avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campagne: { $ref: "#/components/schemas/CampagneWithFullDetails" }
                  }
                },
                example: {
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Campagne Printemps 2025",
                    description: "Campagne de publicité mobile pour promouvoir les nouveaux produits",
                    objectif: "Augmenter la notoriété de la marque de 25%",
                    quantite_service: 100,
                    nbr_prestataire: 3,
                    type_campagne: "MASSE",
                    date_debut: "2025-03-01T00:00:00.000Z",
                    date_fin: "2025-03-15T00:00:00.000Z",
                    status: "PLANIFIEE",
                    date_creation: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T10:00:00.000Z",
                    client: {
                      id_client: "cmclient001",
                      nom: "Dupont",
                      prenom: "Jean",
                      entreprise: "Entreprise ABC",
                      contact: "+225 01 23 45 67 89",
                      mail: "jean.dupont@example.com"
                    },
                    lieu: {
                      id_lieu: "cmlieu001",
                      nom: "Abidjan Plateau",
                      ville: "Abidjan"
                    },
                    service: {
                      id_service: "cmservice001",
                      nom: "Publicité sur tricycles",
                      description: "Service de publicité mobile sur tricycles"
                    },
                    gestionnaire: {
                      id_user: "cmuser001",
                      nom: "Admin",
                      prenom: "CampTrack",
                      email: "admin@camptrack.com",
                      type_user: "ADMIN"
                    },
                    "affectations": [
                      {
                        "prestataire": {
                          "id_prestataire": "cmpresta001",
                          "nom": "Koné",
                          "prenom": "Moussa",
                          "contact": "+225 07 12 34 56 78",
                          "disponible": true,
                          "type_panneau": "GRAND",
                          "plaque": "AB-123-CD",
                          "marque": "Toyota",
                          "modele": "Hilux",
                          "couleur": "Bleu"
                        },
                        "date_creation": "2025-01-03T11:00:00.000Z",
                        "status": "ACTIF"
                      }
                    ],
                    fichiers: [
                      {
                        id_fichier: "cmfile001",
                        nom_fichier: "planning_campagne.pdf",
                        description: "Planning détaillé de la campagne",
                        type_fichier: "RAPPORT_JOURNALIER",
                        date_creation: "2025-01-03T12:00:00.000Z"
                      }
                    ],
                    _count: {
                      affectations: 5,
                      fichiers: 2,
                      dommages: 0
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Campagne non trouvée"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Campagnes"],
        summary: "Modifier une campagne",
        description: "Met à jour les informations d'une campagne existante avec vérification des conflits de dates si modification",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nom_campagne: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau nom de campagne"
                  },
                  description: {
                    type: "string",
                    example: "Nouvelle description"
                  },
                  objectif: {
                    type: "string",
                    example: "Nouveaux objectifs"
                  },
                  quantite_service: {
                    type: "integer",
                    minimum: 1,
                    example: 150
                  },
                  nbr_prestataire: {
                    type: "integer",
                    minimum: 1,
                    example: 4
                  },
                  type_campagne: {
                    type: "string",
                    enum: ["MASSE", "PROXIMITE"],
                    example: "PROXIMITE"
                  },
                  date_debut: {
                    type: "string",
                    format: "date-time",
                    example: "2025-03-05T00:00:00.000Z"
                  },
                  date_fin: {
                    type: "string",
                    format: "date-time",
                    example: "2025-03-20T00:00:00.000Z"
                  },
                  status: {
                    type: "string",
                    enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"],
                    example: "EN_COURS"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Campagne modifiée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    campagne: { $ref: "#/components/schemas/CampagneWithRelations" }
                  }
                },
                example: {
                  message: "Campagne modifiée avec succès",
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Nouveau nom de campagne",
                    description: "Nouvelle description",
                    objectif: "Nouveaux objectifs",
                    quantite_service: 150,
                    nbr_prestataire: 4,
                    type_campagne: "PROXIMITE",
                    date_debut: "2025-03-05T00:00:00.000Z",
                    date_fin: "2025-03-20T00:00:00.000Z",
                    status: "EN_COURS",
                    date_creation: "2025-01-03T10:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z",
                    client: {
                      nom: "Dupont",
                      prenom: "Jean",
                      entreprise: "Entreprise ABC"
                    },
                    lieu: {
                      nom: "Abidjan Plateau",
                      ville: "Abidjan"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Conflit de dates",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Une autre campagne existe déjà pour ce lieu pendant cette période: Campagne Été 2025"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Campagnes"],
        summary: "Supprimer une campagne",
        description: "Supprime définitivement une campagne. Impossible si des prestataires sont affectés ou des fichiers sont associés.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Campagne supprimée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Campagne supprimée avec succès"
                }
              }
            }
          },
          "400": {
            description: "Suppression impossible",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Impossible de supprimer cette campagne car elle a des prestataires affectés ou des fichiers associés"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/campagnes/{id}/status": {
      put: {
        tags: ["Campagnes"],
        summary: "Changer le statut d'une campagne",
        description: "Modifie le statut d'une campagne avec validation des transitions autorisées et vérification des prérequis",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"],
                    description: "Nouveau statut de la campagne",
                    example: "EN_COURS"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Statut modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    campagne: {
                      type: "object",
                      properties: {
                        id_campagne: { type: "string" },
                        nom_campagne: { type: "string" },
                        status: { type: "string" },
                        date_debut: { type: "string", format: "date-time" },
                        date_fin: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" }
                      }
                    }
                  }
                },
                example: {
                  message: "Statut de la campagne modifié avec succès",
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Campagne Printemps 2025",
                    status: "EN_COURS",
                    date_debut: "2025-03-01T00:00:00.000Z",
                    date_fin: "2025-03-15T00:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Transition non autorisée ou prérequis manquants",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  "Transition invalide": {
                    value: {
                      error: "Transition de statut non autorisée: TERMINEE → EN_COURS"
                    }
                  },
                  "Prestataires manquants": {
                    value: {
                      error: "Impossible de démarrer une campagne sans prestataires affectés"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES PRESTATAIRES ====================
    "/prestataires": {
      get: {
        tags: ["Prestataires"],
        summary: "Lister tous les prestataires",
        description: "Récupère la liste paginée de tous les prestataires avec leurs véhicules intégrés",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page",
            schema: { type: "integer", default: 1, minimum: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de prestataires par page",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }
          },
          {
            name: "disponible",
            in: "query",
            required: false,
            description: "Filtrer par disponibilité",
            schema: { type: "boolean" }
          },
          {
            name: "serviceId",
            in: "query",
            required: false,
            description: "Filtrer par ID de service",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Liste des prestataires récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    prestataires: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PrestataireWithStats" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                },
                example: {
                  prestataires: [
                    {
                      id_prestataire: "cmpresta001",
                      nom: "Koné",
                      prenom: "Moussa",
                      contact: "+225 07 12 34 56 78",
                      disponible: true,
                      type_panneau: "GRAND",
                      marque: "Toyota",
                      modele: "Hilux",
                      plaque: "AB-123-CD",
                      couleur: "Bleu",
                      id_verification: "VERIF-001",
                      created_at: "2025-01-03T11:00:00.000Z",
                      _count: {
                        affectations: 3,
                        dommages: 0
                      }
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 50,
                    total: 1,
                    totalPages: 1
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Prestataires"],
        summary: "Créer un nouveau prestataire",
        description: "Crée un nouveau prestataire avec ses informations de véhicule intégrées",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id_service", "nom", "prenom", "contact", "type_panneau"],
                properties: {
                  id_service: {
                    type: "string",
                    description: "ID du service auquel le prestataire est associé",
                    example: "cmservice001"
                  },
                  nom: {
                    type: "string",
                    minLength: 2,
                    description: "Nom du prestataire",
                    example: "Koné"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    description: "Prénom du prestataire",
                    example: "Moussa"
                  },
                  contact: {
                    type: "string",
                    description: "Numéro de contact",
                    example: "+225 07 12 34 56 78"
                  },
                  disponible: {
                    type: "boolean",
                    description: "Statut de disponibilité",
                    example: true
                  },
                  // CHAMPS VÉHICULE INTÉGRÉS
                  type_panneau: {
                    type: "string",
                    enum: ["PETIT", "GRAND"],
                    description: "Type de panneau publicitaire",
                    example: "GRAND"
                  },
                  couleur: {
                    type: "string",
                    description: "Couleur du véhicule",
                    example: "Bleu"
                  },
                  marque: {
                    type: "string",
                    description: "Marque du véhicule",
                    example: "Toyota"
                  },
                  modele: {
                    type: "string",
                    description: "Modèle du véhicule",
                    example: "Hilux"
                  },
                  plaque: {
                    type: "string",
                    description: "Plaque d'immatriculation",
                    example: "AB-123-CD"
                  },
                  id_verification: {
                    type: "string",
                    description: "ID de vérification du véhicule",
                    example: "VERIF-001"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Prestataire créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    prestataire: { $ref: "#/components/schemas/PrestataireWithStats" }
                  }
                },
                example: {
                  message: "Prestataire créé avec succès",
                  prestataire: {
                    id_prestataire: "cmpresta001",
                    nom: "Koné",
                    prenom: "Moussa",
                    contact: "+225 07 12 34 56 78",
                    disponible: true,
                    type_panneau: "GRAND",
                    marque: "Toyota",
                    modele: "Hilux",
                    plaque: "AB-123-CD",
                    couleur: "Bleu",
                    id_verification: "VERIF-001",
                    created_at: "2025-01-03T11:00:00.000Z",
                    _count: {
                      affectations: 0,
                      dommages: 0
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le nom doit contenir au moins 2 caractères"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Service non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Service non trouvé"
                }
              }
            }
          },
          "409": {
            description: "Plaque déjà utilisée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un prestataire avec cette plaque existe déjà"
                }
              }
            }
          }
        }
      }
    },

    "/prestataires/{id}": {
      get: {
        tags: ["Prestataires"],
        summary: "Récupérer un prestataire spécifique",
        description: "Obtenir tous les détails d'un prestataire incluant son véhicule, affectations et dommages",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du prestataire",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Détails du prestataire récupérés avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    prestataire: { $ref: "#/components/schemas/PrestataireWithFullDetails" }
                  }
                },
                example: {
                  prestataire: {
                    id_prestataire: "cmpresta001",
                    nom: "Koné",
                    prenom: "Moussa",
                    contact: "+225 07 12 34 56 78",
                    disponible: true,
                    type_panneau: "GRAND",
                    couleur: "Bleu",
                    marque: "Toyota",
                    modele: "Hilux",
                    plaque: "AB-123-CD",
                    id_verification: "VERIF-001",
                    created_at: "2025-01-03T11:00:00.000Z",
                    updated_at: "2025-01-03T11:00:00.000Z",
                    service: {
                      id_service: "cmservice001",
                      nom: "Publicité sur tricycles",
                      description: "Service de publicité mobile sur tricycles"
                    },
                    affectations: [
                      {
                        campagne: {
                          id_campagne: "cmcamp001",
                          nom_campagne: "Campagne Printemps 2025",
                          date_debut: "2025-03-01T00:00:00.000Z",
                          date_fin: "2025-03-15T00:00:00.000Z",
                          status: "PLANIFIEE"
                        },
                        date_creation: "2025-01-03T12:00:00.000Z",
                        status: "ACTIF"
                      }
                    ],
                    dommages: [
                      {
                        id_materiels_case: "cmdommage001",
                        etat: "MAUVAIS",
                        description: "Panneau endommagé lors de la campagne",
                        montant_penalite: 50000,
                        penalite_appliquer: true,
                        date_creation: "2025-01-10T10:00:00.000Z",
                        campagne: {
                          nom_campagne: "Campagne Hiver 2024"
                        }
                      }
                    ],
                    _count: {
                      affectations: 3,
                      dommages: 1
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Prestataire non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Prestataire non trouvé"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Prestataires"],
        summary: "Modifier un prestataire",
        description: "Met à jour les informations d'un prestataire existant et son véhicule",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du prestataire à modifier",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau nom"
                  },
                  prenom: {
                    type: "string",
                    minLength: 2,
                    example: "Nouveau prénom"
                  },
                  contact: {
                    type: "string",
                    example: "+225 08 76 54 32 10"
                  },
                  disponible: {
                    type: "boolean",
                    example: false
                  },
                  id_service: {
                    type: "string",
                    example: "cmservice002"
                  },
                  // CHAMPS VÉHICULE INTÉGRÉS
                  type_panneau: {
                    type: "string",
                    enum: ["PETIT", "GRAND"],
                    example: "PETIT"
                  },
                  couleur: {
                    type: "string",
                    example: "Rouge"
                  },
                  marque: {
                    type: "string",
                    example: "Nissan"
                  },
                  modele: {
                    type: "string",
                    example: "Navara"
                  },
                  plaque: {
                    type: "string",
                    example: "EF-456-GH"
                  },
                  id_verification: {
                    type: "string",
                    example: "VERIF-002"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Prestataire modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    prestataire: { $ref: "#/components/schemas/PrestataireWithStats" }
                  }
                },
                example: {
                  message: "Prestataire modifié avec succès",
                  prestataire: {
                    id_prestataire: "cmpresta001",
                    nom: "Nouveau nom",
                    prenom: "Nouveau prénom",
                    contact: "+225 08 76 54 32 10",
                    disponible: false,
                    type_panneau: "PETIT",
                    marque: "Nissan",
                    modele: "Navara",
                    plaque: "EF-456-GH",
                    couleur: "Rouge",
                    id_verification: "VERIF-002",
                    created_at: "2025-01-03T11:00:00.000Z",
                    updated_at: "2025-01-03T15:30:00.000Z",
                    _count: {
                      affectations: 3,
                      dommages: 1
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Au moins un champ doit être fourni pour la modification"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Prestataire non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "409": {
            description: "Plaque déjà utilisée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Un autre prestataire avec cette plaque existe déjà"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Prestataires"],
        summary: "Supprimer un prestataire",
        description: "Supprime définitivement un prestataire. Impossible s'il a des affectations en cours.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du prestataire à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Prestataire supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Prestataire supprimé avec succès"
                }
              }
            }
          },
          "400": {
            description: "Suppression impossible",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Impossible de supprimer ce prestataire car il a des affectations en cours"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Prestataire non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/prestataires/{id}/statut": {
      put: {
        tags: ["Prestataires"],
        summary: "Changer le statut de disponibilité",
        description: "Active ou désactive un prestataire (pour maintenance, congés, etc.)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du prestataire",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["disponible"],
                properties: {
                  disponible: {
                    type: "boolean",
                    description: "Nouveau statut de disponibilité",
                    example: false
                  },
                  raison: {
                    type: "string",
                    description: "Raison du changement de statut",
                    example: "Véhicule en réparation"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Statut modifié avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    prestataire: {
                      type: "object",
                      properties: {
                        id_prestataire: { type: "string" },
                        nom: { type: "string" },
                        prenom: { type: "string" },
                        disponible: { type: "boolean" },
                        updated_at: { type: "string", format: "date-time" }
                      }
                    }
                  }
                },
                example: {
                  message: "Prestataire désactivé avec succès",
                  prestataire: {
                    id_prestataire: "cmpresta001",
                    nom: "Koné",
                    prenom: "Moussa",
                    disponible: false,
                    updated_at: "2025-01-03T15:30:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le champ 'disponible' doit être un booléen"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Prestataire non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES CAMPAGNES - PRESTATAIRES ====================
    "/campagnes/{id}/prestataires": {
      get: {
        tags: ["Prestataires Campagnes"],
        summary: "Lister les prestataires d'une campagne",
        description: "Récupère la liste complète des prestataires affectés à une campagne spécifique avec leurs détails et informations de paiement. Inclut le comptage des affectations actives et la limite de prestataires.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Liste des prestataires récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campagne: {
                      type: "object",
                      properties: {
                        id_campagne: { type: "string" },
                        nom_campagne: { type: "string" },
                        nbr_prestataire: {
                          type: "integer",
                          nullable: true,
                          description: "Nombre maximum de prestataires autorisés (null = pas de limite)"
                        },
                        affectations_actuelles: {
                          type: "integer",
                          description: "Nombre d'affectations actives (date_fin = null)"
                        }
                      }
                    },
                    affectations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prestataire: { $ref: "#/components/schemas/PrestataireWithDetails" },
                          date_creation: { type: "string", format: "date-time" },
                          date_fin: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                            description: "Date de fin d'affectation (null = actif)"
                          },
                          status: {
                            type: "string",
                            description: "Statut de l'affectation (ACTIF/INACTIF)"
                          },
                          image_affiche: {
                            type: "string",
                            nullable: true
                          },
                          paiement: {
                            type: "object",
                            properties: {
                              paiement_base: { type: "number" },
                              paiement_final: { type: "number" },
                              statut_paiement: { type: "boolean" }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Campagne Printemps 2025",
                    nbr_prestataire: 3,
                    affectations_actuelles: 2
                  },
                  affectations: [
                    {
                      prestataire: {
                        id_prestataire: "cmpresta001",
                        nom: "Koné",
                        prenom: "Moussa",
                        contact: "+225 07 12 34 56 78",
                        disponible: true,
                        type_panneau: "GRAND",
                        marque: "Toyota",
                        modele: "Hilux",
                        plaque: "AB-123-CD",
                        couleur: "Bleu",
                        id_verification: "VERIF-001",
                        service: {
                          nom: "Publicité sur tricycles"
                        }
                      },
                      date_creation: "2025-01-03T11:00:00.000Z",
                      date_fin: null,
                      status: "ACTIF",
                      image_affiche: null,
                      paiement: {
                        paiement_base: 150000,
                        paiement_final: 150000,
                        statut_paiement: false
                      }
                    }
                  ]
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Prestataires Campagnes"],
        summary: "Ajouter un prestataire à une campagne",
        description: "Affecte un prestataire à une campagne existante avec vérifications : **même service**, disponibilité, non-doublon, et limite du nombre de prestataires actifs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id_prestataire"],
                properties: {
                  id_prestataire: {
                    type: "string",
                    description: "ID du prestataire à affecter",
                    example: "cmpresta001"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Prestataire affecté avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    affectation: {
                      type: "object",
                      properties: {
                        prestataire: { $ref: "#/components/schemas/PrestataireWithDetails" },
                        date_creation: { type: "string", format: "date-time" },
                        status: {
                          type: "string",
                          description: "Statut de l'affectation (ACTIF)"
                        }
                      }
                    }
                  }
                },
                example: {
                  message: "Prestataire affecté à la campagne avec succès",
                  affectation: {
                    prestataire: {
                      id_prestataire: "cmpresta001",
                      nom: "Koné",
                      prenom: "Moussa",
                      contact: "+225 07 12 34 56 78",
                      service: {
                        nom: "Publicité sur tricycles"
                      },
                      type_panneau: "GRAND",
                      plaque: "AB-123-CD",
                      marque: "Toyota",
                      modele: "Hilux",
                      couleur: "Bleu"
                    },
                    date_creation: "2025-01-03T11:00:00.000Z",
                    status: "ACTIF"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides ou conditions non remplies",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                "examples": {
                  "Service différent": {
                    "value": {
                      "error": "Ce prestataire n'appartient pas au même service que la campagne"
                    }
                  },
                  "Prestataire non disponible": {
                    "value": {
                      "error": "Ce prestataire n'est pas disponible"
                    }
                  },
                  "Limite atteinte": {
                    "value": {
                      "error": "Le nombre maximum de prestataires (3) pour cette campagne est déjà atteint. Impossible d'ajouter un nouveau prestataire."
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne ou prestataire non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Prestataire non trouvé"
                }
              }
            }
          },
          "409": {
            description: "Prestataire déjà affecté",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Ce prestataire est déjà affecté à cette campagne"
                }
              }
            }
          }
        }
      }
    },

    "/campagnes/{id}/prestataires/{prestataireId}": {
      delete: {
        tags: ["Prestataires Campagnes"],
        summary: "Retirer un prestataire d'une campagne (Soft Delete)",
        description: "Retire un prestataire spécifique d'une campagne en utilisant un soft delete (mise à jour de date_fin et statut INACTIF). Impossible si un paiement est déjà finalisé ou si des dommages non résolus sont associés.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          },
          {
            name: "prestataireId",
            in: "path",
            required: true,
            description: "ID du prestataire à retirer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Prestataire retiré avec succès (soft delete)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Prestataire retiré de la campagne avec succès"
                }
              }
            }
          },
          "400": {
            description: "Retrait impossible",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  "Paiement finalisé": {
                    value: {
                      error: "Impossible de retirer ce prestataire car son paiement a déjà été finalisé"
                    }
                  },
                  "Dommages non résolus": {
                    value: {
                      error: "Impossible de retirer ce prestataire car des dommages non résolus sont associés à cette campagne"
                    }
                  },
                  "Déjà retiré": {
                    value: {
                      error: "Ce prestataire a déjà été retiré de cette campagne"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Affectation non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Cette affectation n'existe pas"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Prestataires Campagnes"],
        summary: "Modifier une affectation de prestataire",
        description: "Met à jour les informations d'une affectation existante (statut, image_affiche)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          },
          {
            name: "prestataireId",
            in: "path",
            required: true,
            description: "ID du prestataire",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    description: "Nouveau statut de l'affectation",
                    example: "ACTIF"
                  },
                  image_affiche: {
                    type: "string",
                    description: "URL de l'image d'affiche",
                    example: "https://example.com/image.jpg"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Affectation mise à jour avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    affectation: {
                      type: "object",
                      properties: {
                        prestataire: {
                          type: "object",
                          properties: {
                            id_prestataire: { type: "string" },
                            nom: { type: "string" },
                            prenom: { type: "string" }
                          }
                        },
                        status: { type: "string" },
                        image_affiche: { type: "string" }
                      }
                    }
                  }
                },
                example: {
                  message: "Affectation mise à jour avec succès",
                  affectation: {
                    prestataire: {
                      id_prestataire: "cmpresta001",
                      nom: "Koné",
                      prenom: "Moussa"
                    },
                    status: "ACTIF",
                    image_affiche: "https://example.com/image.jpg"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Statut invalide"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Affectation non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Cette affectation n'existe pas"
                }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES CAMPAGNES - FICHIERS ====================
    "/campagnes/{id}/fichiers": {
      get: {
        tags: ["Fichiers Campagnes"],
        summary: "Lister les fichiers d'une campagne",
        description: "Récupère tous les fichiers associés à une campagne avec possibilité de filtrage par type",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          },
          {
            name: "type",
            in: "query",
            required: false,
            description: "Filtrer par type de fichier",
            schema: {
              type: "string",
              enum: ["RAPPORT_JOURNALIER", "RAPPORT_FINAL", "PIGE"]
            }
          }
        ],
        responses: {
          "200": {
            description: "Liste des fichiers récupérée avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campagne: {
                      type: "object",
                      properties: {
                        id_campagne: { type: "string" },
                        nom_campagne: { type: "string" }
                      }
                    },
                    fichiers: {
                      type: "array",
                      items: { $ref: "#/components/schemas/FichierCampagne" }
                    }
                  }
                },
                example: {
                  campagne: {
                    id_campagne: "cmcamp001",
                    nom_campagne: "Campagne Printemps 2025"
                  },
                  fichiers: [
                    {
                      id_fichier: "cmfile001",
                      nom_fichier: "rapport_journalier_20250301.pdf",
                      description: "Rapport d'activité du premier jour",
                      type_fichier: "RAPPORT_JOURNALIER",
                      lien_canva_drive: "https://drive.google.com/file/...",
                      date_creation: "2025-03-01T18:00:00.000Z"
                    },
                    {
                      id_fichier: "cmfile002",
                      nom_fichier: "photos_campagne.zip",
                      description: "Photos de la campagne",
                      type_fichier: "PIGE",
                      lien_canva_drive: "https://drive.google.com/file/...",
                      date_creation: "2025-03-02T10:00:00.000Z"
                    }
                  ]
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Fichiers Campagnes"],
        summary: "Ajouter un fichier à une campagne",
        description: "Associe un nouveau fichier (lien externe) à une campagne avec validation du type",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nom_fichier", "lien_canva_drive", "type_fichier"],
                properties: {
                  nom_fichier: {
                    type: "string",
                    description: "Nom du fichier",
                    example: "rapport_final_campagne.pdf"
                  },
                  description: {
                    type: "string",
                    description: "Description du fichier",
                    example: "Rapport final de la campagne avec statistiques"
                  },
                  lien_canva_drive: {
                    type: "string",
                    description: "Lien vers le fichier sur Google Drive ou autre stockage",
                    example: "https://drive.google.com/file/..."
                  },
                  type_fichier: {
                    type: "string",
                    enum: ["RAPPORT_JOURNALIER", "RAPPORT_FINAL", "PIGE"],
                    description: "Type de document",
                    example: "RAPPORT_FINAL"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Fichier ajouté avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    fichier: { $ref: "#/components/schemas/FichierCampagne" }
                  }
                },
                example: {
                  message: "Fichier ajouté à la campagne avec succès",
                  fichier: {
                    id_fichier: "cmfile003",
                    nom_fichier: "rapport_final_campagne.pdf",
                    description: "Rapport final de la campagne avec statistiques",
                    type_fichier: "RAPPORT_FINAL",
                    lien_canva_drive: "https://drive.google.com/file/...",
                    date_creation: "2025-01-03T16:00:00.000Z"
                  }
                }
              }
            }
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  "Champs manquants": {
                    value: {
                      error: "Nom, lien et type de fichier sont requis"
                    }
                  },
                  "Type invalide": {
                    value: {
                      error: "Type de fichier invalide"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Campagne non trouvée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/campagnes/{id}/fichiers/{fichierId}": {
      get: {
        tags: ["Fichiers Campagnes"],
        summary: "Récupérer un fichier spécifique",
        description: "Obtenir les détails d'un fichier spécifique associé à une campagne",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          },
          {
            name: "fichierId",
            in: "path",
            required: true,
            description: "ID du fichier",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Fichier récupéré avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    fichier: { $ref: "#/components/schemas/FichierCampagneWithContext" }
                  }
                },
                example: {
                  fichier: {
                    id_fichier: "cmfile001",
                    nom_fichier: "rapport_journalier_20250301.pdf",
                    description: "Rapport d'activité du premier jour",
                    type_fichier: "RAPPORT_JOURNALIER",
                    lien_canva_drive: "https://drive.google.com/file/...",
                    date_creation: "2025-03-01T18:00:00.000Z",
                    campagne: {
                      nom_campagne: "Campagne Printemps 2025"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Fichier non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Fichier non trouvé"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Fichiers Campagnes"],
        summary: "Supprimer un fichier",
        description: "Supprime un fichier spécifique associé à une campagne",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la campagne",
            schema: { type: "string" }
          },
          {
            name: "fichierId",
            in: "path",
            required: true,
            description: "ID du fichier à supprimer",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Fichier supprimé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Fichier supprimé avec succès"
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Fichier non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES ÉTATS DE MATÉRIEL ====================
    "/materiels-cases": {
      "get": {
        "tags": ["Materiels Cases"],
        "summary": "Lister tous les états de matériel",
        "description": "Récupère la liste paginée de tous les enregistrements d'état de matériel avec filtres par campagne, prestataire, état et statut de pénalité. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "description": "Numéro de page pour la pagination",
            "schema": {
              "type": "integer",
              "default": 1,
              "minimum": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "description": "Nombre d'enregistrements par page",
            "schema": {
              "type": "integer",
              "default": 50,
              "minimum": 1,
              "maximum": 100
            }
          },
          {
            "name": "id_campagne",
            "in": "query",
            "required": false,
            "description": "Filtrer par ID de campagne",
            "schema": { "type": "string" }
          },
          {
            "name": "id_prestataire",
            "in": "query",
            "required": false,
            "description": "Filtrer par ID de prestataire",
            "schema": { "type": "string" }
          },
          {
            "name": "etat",
            "in": "query",
            "required": false,
            "description": "Filtrer par état du matériel",
            "schema": {
              "type": "string",
              "enum": ["BON", "MOYEN", "MAUVAIS"]
            }
          },
          {
            "name": "penalite_appliquer",
            "in": "query",
            "required": false,
            "description": "Filtrer par statut d'application de pénalité",
            "schema": { "type": "boolean" }
          }
        ],
        "responses": {
          "200": {
            "description": "Liste des états de matériel récupérée avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "materiels_cases": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "page": { "type": "integer" },
                        "limit": { "type": "integer" },
                        "total": { "type": "integer" },
                        "totalPages": { "type": "integer" }
                      }
                    }
                  }
                },
                "example": {
                  "materiels_cases": [
                    {
                      "id_materiels_case": "cmmat001",
                      "nom_materiel": "Panneau publicitaire",
                      "etat": "MAUVAIS",
                      "description": "Panneau fissuré sur le côté droit, support déformé",
                      "montant_penalite": 2000,
                      "penalite_appliquer": true,
                      "photo_url": "https://storage.com/photo1.jpg",
                      "preuve_media": "https://storage.com/video1.mp4",
                      "date_creation": "2025-01-10T10:00:00.000Z",
                      "campagne": {
                        "id_campagne": "cmcamp001",
                        "nom_campagne": "Campagne Printemps 2025",
                        "date_debut": "2025-03-01T00:00:00.000Z",
                        "date_fin": "2025-03-15T00:00:00.000Z",
                        "status": "TERMINEE",
                        "client": {
                          "id_client": "cmclient001",
                          "nom": "Agence Pub Plus",
                          "type_client": "EXTERNE"
                        }
                      },
                      "prestataire": {
                        "id_prestataire": "cmpresta001",
                        "nom": "Koné",
                        "prenom": "Moussa",
                        "contact": "+225 07 12 34 56 78",
                        "type_panneau": "GRAND",
                        "plaque": "AB-123-CD",
                        "marque": "Toyota",
                        "modele": "Hilux"
                      }
                    }
                  ],
                  "pagination": {
                    "page": 1,
                    "limit": 50,
                    "total": 1,
                    "totalPages": 1
                  }
                }
              }
            }
          },
          "400": {
            "description": "Paramètres de requête invalides",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "example": {
                  "error": "Le paramètre 'page' doit être un nombre entier positif"
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Materiels Cases"],
        "summary": "Créer un nouvel enregistrement d'état de matériel",
        "description": "Enregistre l'état du matériel avant ou après une campagne. Permet de documenter les dommages et d'appliquer des pénalités si nécessaire. **Pénalité automatique:** Si l'état est MAUVAIS et une campagne est associée, la pénalité est calculée automatiquement: Client EXTERNE = 2000 F CFA, Client INTERNE = 1000 F CFA. **Validation :** Au moins une relation (campagne ou prestataire) est requise. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["nom_materiel", "etat", "description", "montant_penalite"],
                "properties": {
                  "id_campagne": {
                    "type": "string",
                    "description": "ID de la campagne concernée (optionnel si prestataire fourni)",
                    "example": "cmcamp001"
                  },
                  "id_prestataire": {
                    "type": "string",
                    "description": "ID du prestataire concerné (optionnel si campagne fournie)",
                    "example": "cmpresta001"
                  },
                  "nom_materiel": {
                    "type": "string",
                    "minLength": 3,
                    "description": "Nom du matériel endommagé ou signalé (minimum 3 caractères)",
                    "example": "Panneau publicitaire"
                  },
                  "etat": {
                    "type": "string",
                    "enum": ["BON", "MOYEN", "MAUVAIS"],
                    "description": "État du matériel constaté. **Important:** Si etat=MAUVAIS, la pénalité est calculée automatiquement selon le type de client: EXTERNE=2000, INTERNE=1000",
                    "example": "MAUVAIS"
                  },
                  "description": {
                    "type": "string",
                    "minLength": 5,
                    "description": "Description détaillée des dommages ou de l'état (minimum 5 caractères)",
                    "example": "Panneau fissuré sur le côté droit, support déformé"
                  },
                  "montant_penalite": {
                    "type": "number",
                    "minimum": 0,
                    "description": "Montant de la pénalité à appliquer. **Note:** Ignoré si etat=MAUVAIS (valeur calculée automatiquement)",
                    "example": 50000
                  },
                  "penalite_appliquer": {
                    "type": "boolean",
                    "default": false,
                    "description": "Indique si la pénalité doit être appliquée",
                    "example": true
                  },
                  "photo_url": {
                    "type": "string",
                    "format": "uri",
                    "description": "URL valide de la photo du dommage",
                    "example": "https://storage.com/photo1.jpg"
                  },
                  "preuve_media": {
                    "type": "string",
                    "format": "uri",
                    "description": "URL valide d'une preuve média supplémentaire (vidéo, autre photo)",
                    "example": "https://storage.com/video1.mp4"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "État de matériel enregistré avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "materiels_case": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                  }
                },
                "example": {
                  "message": "État de matériel enregistré avec succès",
                  "materiels_case": {
                    "id_materiels_case": "cmmat001",
                    "nom_materiel": "Panneau publicitaire",
                    "etat": "MAUVAIS",
                    "description": "Panneau fissuré sur le côté droit, support déformé",
                    "montant_penalite": 2000,
                    "penalite_appliquer": true,
                    "photo_url": "https://storage.com/photo1.jpg",
                    "preuve_media": "https://storage.com/video1.mp4",
                    "date_creation": "2025-01-10T10:00:00.000Z",
                    "campagne": {
                      "id_campagne": "cmcamp001",
                      "nom_campagne": "Campagne Printemps 2025"
                    },
                    "prestataire": {
                      "id_prestataire": "cmpresta001",
                      "nom": "Koné",
                      "prenom": "Moussa",
                      "contact": "+225 07 12 34 56 78"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Données invalides",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "Champs requis manquants": {
                    "value": {
                      "error": "L'état, la description et le montant de pénalité sont requis"
                    }
                  },
                  "Description trop courte": {
                    "value": {
                      "error": "La description doit contenir au moins 5 caractères"
                    }
                  },
                  "Aucune relation": {
                    "value": {
                      "error": "Au moins une relation (campagne ou prestataire) doit être fournie"
                    }
                  },
                  "URL invalide": {
                    "value": {
                      "error": "L'URL de la photo doit être une URL valide"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "Ressource non trouvée",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "Campagne non trouvée": {
                    "value": {
                      "error": "Campagne non trouvée"
                    }
                  },
                  "Prestataire non trouvé": {
                    "value": {
                      "error": "Prestataire non trouvé"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/materiels-cases/{id}": {
      "get": {
        "tags": ["Materiels Cases"],
        "summary": "Récupérer un état de matériel spécifique",
        "description": "Obtenir tous les détails d'un enregistrement d'état de matériel par son ID. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "ID de l'enregistrement d'état de matériel",
            "schema": {
              "type": "string",
              "example": "cmmat001"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Détails de l'état de matériel récupérés avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "materiels_case": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                  }
                },
                "example": {
                  "materiels_case": {
                    "id_materiels_case": "cmmat001",
                    "etat": "MAUVAIS",
                    "description": "Panneau fissuré sur le côté droit, support déformé",
                    "montant_penalite": 50000,
                    "penalite_appliquer": true,
                    "photo_url": "https://storage.com/photo1.jpg",
                    "preuve_media": "https://storage.com/video1.mp4",
                    "date_creation": "2025-01-10T10:00:00.000Z",
                    "campagne": {
                      "id_campagne": "cmcamp001",
                      "nom_campagne": "Campagne Printemps 2025",
                      "date_debut": "2025-03-01T00:00:00.000Z",
                      "date_fin": "2025-03-15T00:00:00.000Z",
                      "status": "TERMINEE"
                    },
                    "prestataire": {
                      "id_prestataire": "cmpresta001",
                      "nom": "Koné",
                      "prenom": "Moussa",
                      "contact": "+225 07 12 34 56 78",
                      "type_panneau": "GRAND",
                      "plaque": "AB-123-CD",
                      "marque": "Toyota",
                      "modele": "Hilux"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "État de matériel non trouvé",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "example": {
                  "error": "État de matériel non trouvé"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": ["Materiels Cases"],
        "summary": "Modifier un état de matériel",
        "description": "Met à jour les informations d'un enregistrement d'état de matériel existant. **Validation :** Au moins un champ doit être fourni. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "ID de l'enregistrement à modifier",
            "schema": {
              "type": "string",
              "example": "cmmat001"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "id_campagne": {
                    "type": "string",
                    "description": "Nouvel ID de campagne (optionnel)",
                    "example": "cmcamp002"
                  },
                  "id_prestataire": {
                    "type": "string",
                    "description": "Nouvel ID de prestataire (optionnel)",
                    "example": "cmpresta002"
                  },
                  "etat": {
                    "type": "string",
                    "enum": ["BON", "MOYEN", "MAUVAIS"],
                    "description": "Nouvel état du matériel",
                    "example": "MOYEN"
                  },
                  "description": {
                    "type": "string",
                    "minLength": 5,
                    "description": "Nouvelle description",
                    "example": "Réparation effectuée, état amélioré mais traces visibles"
                  },
                  "montant_penalite": {
                    "type": "number",
                    "minimum": 0,
                    "description": "Nouveau montant de pénalité",
                    "example": 25000
                  },
                  "penalite_appliquer": {
                    "type": "boolean",
                    "description": "Nouveau statut d'application",
                    "example": false
                  },
                  "photo_url": {
                    "type": "string",
                    "format": "uri",
                    "description": "Nouvelle URL de photo",
                    "example": "https://storage.com/photo2.jpg"
                  },
                  "preuve_media": {
                    "type": "string",
                    "format": "uri",
                    "description": "Nouvelle URL de preuve média",
                    "example": "https://storage.com/video2.mp4"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "État de matériel modifié avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "materiels_case": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                  }
                },
                "example": {
                  "message": "État de matériel modifié avec succès",
                  "materiels_case": {
                    "id_materiels_case": "cmmat001",
                    "etat": "MOYEN",
                    "description": "Réparation effectuée, état amélioré mais traces visibles",
                    "montant_penalite": 25000,
                    "penalite_appliquer": false,
                    "photo_url": "https://storage.com/photo2.jpg",
                    "preuve_media": "https://storage.com/video2.mp4",
                    "date_creation": "2025-01-10T10:00:00.000Z",
                    "campagne": {
                      "id_campagne": "cmcamp001",
                      "nom_campagne": "Campagne Printemps 2025"
                    },
                    "prestataire": {
                      "id_prestataire": "cmpresta001",
                      "nom": "Koné",
                      "prenom": "Moussa",
                      "contact": "+225 07 12 34 56 78"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Données invalides",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "Aucun champ fourni": {
                    "value": {
                      "error": "Au moins un champ doit être fourni pour la modification"
                    }
                  },
                  "Description trop courte": {
                    "value": {
                      "error": "La description doit contenir au moins 5 caractères"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "État de matériel non trouvé",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "examples": {
                  "Enregistrement non trouvé": {
                    "value": {
                      "error": "État de matériel non trouvé"
                    }
                  },
                  "Nouvelle ressource non trouvée": {
                    "value": {
                      "error": "Campagne non trouvée"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["Materiels Cases"],
        "summary": "Supprimer un état de matériel",
        "description": "Supprime définitivement un enregistrement d'état de matériel. **Attention :** Cette action est irréversible. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "ID de l'enregistrement à supprimer",
            "schema": {
              "type": "string",
              "example": "cmmat001"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "État de matériel supprimé avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" }
                  }
                },
                "example": {
                  "message": "État de matériel supprimé avec succès"
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "État de matériel non trouvé",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "example": {
                  "error": "État de matériel non trouvé"
                }
              }
            }
          }
        }
      }
    },

    "/campagnes/{id}/materiels-cases": {
      "get": {
        "tags": ["Materiels Cases"],
        "summary": "Lister les états de matériel d'une campagne",
        "description": "Récupère tous les enregistrements d'état de matériel associés à une campagne spécifique avec statistiques détaillées. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "ID de la campagne",
            "schema": {
              "type": "string",
              "example": "cmcamp001"
            }
          },
          {
            "name": "etat",
            "in": "query",
            "required": false,
            "description": "Filtrer par état du matériel",
            "schema": {
              "type": "string",
              "enum": ["BON", "MOYEN", "MAUVAIS"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Liste des états de matériel de la campagne récupérée avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "campagne": {
                      "type": "object",
                      "properties": {
                        "id_campagne": { "type": "string" },
                        "nom_campagne": { "type": "string" }
                      }
                    },
                    "materiels_cases": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                    },
                    "statistiques": {
                      "type": "object",
                      "properties": {
                        "total": {
                          "type": "integer",
                          "description": "Nombre total d'enregistrements"
                        },
                        "etat_bon": {
                          "type": "integer",
                          "description": "Nombre d'états BON"
                        },
                        "etat_moyen": {
                          "type": "integer",
                          "description": "Nombre d'états MOYEN"
                        },
                        "etat_mauvais": {
                          "type": "integer",
                          "description": "Nombre d'états MAUVAIS"
                        },
                        "penalites_total": {
                          "type": "number",
                          "description": "Somme totale des pénalités"
                        }
                      }
                    }
                  }
                },
                "example": {
                  "campagne": {
                    "id_campagne": "cmcamp001",
                    "nom_campagne": "Campagne Printemps 2025"
                  },
                  "materiels_cases": [
                    {
                      "id_materiels_case": "cmmat001",
                      "etat": "MAUVAIS",
                      "description": "Panneau fissuré sur le côté droit",
                      "montant_penalite": 50000,
                      "penalite_appliquer": true,
                      "date_creation": "2025-01-10T10:00:00.000Z",
                      "prestataire": {
                        "id_prestataire": "cmpresta001",
                        "nom": "Koné",
                        "prenom": "Moussa",
                        "contact": "+225 07 12 34 56 78",
                        "type_panneau": "GRAND",
                        "plaque": "AB-123-CD"
                      }
                    }
                  ],
                  "statistiques": {
                    "total": 1,
                    "etat_bon": 0,
                    "etat_moyen": 0,
                    "etat_mauvais": 1,
                    "penalites_total": 50000
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "Campagne non trouvée",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "example": {
                  "error": "Campagne non trouvée"
                }
              }
            }
          }
        }
      }
    },

    "/prestataires/{id}/materiels-cases": {
      "get": {
        "tags": ["Materiels Cases"],
        "summary": "Lister les états de matériel d'un prestataire",
        "description": "Récupère tous les enregistrements d'état de matériel associés à un prestataire spécifique avec statistiques financières. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "ID du prestataire",
            "schema": {
              "type": "string",
              "example": "cmpresta001"
            }
          },
          {
            "name": "penalite_appliquer",
            "in": "query",
            "required": false,
            "description": "Filtrer par statut d'application de pénalité",
            "schema": { "type": "boolean" }
          }
        ],
        "responses": {
          "200": {
            "description": "Liste des états de matériel du prestataire récupérée avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "prestataire": {
                      "type": "object",
                      "properties": {
                        "id_prestataire": { "type": "string" },
                        "nom": { "type": "string" },
                        "prenom": { "type": "string" }
                      }
                    },
                    "materiels_cases": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/MaterielsCaseWithRelations" }
                    },
                    "statistiques": {
                      "type": "object",
                      "properties": {
                        "total": {
                          "type": "integer",
                          "description": "Nombre total d'enregistrements"
                        },
                        "penalites_total": {
                          "type": "number",
                          "description": "Somme totale des pénalités"
                        },
                        "penalites_appliquees": {
                          "type": "number",
                          "description": "Somme des pénalités appliquées"
                        }
                      }
                    }
                  }
                },
                "example": {
                  "prestataire": {
                    "id_prestataire": "cmpresta001",
                    "nom": "Koné",
                    "prenom": "Moussa"
                  },
                  "materiels_cases": [
                    {
                      "id_materiels_case": "cmmat001",
                      "etat": "MAUVAIS",
                      "description": "Panneau fissuré sur le côté droit",
                      "montant_penalite": 50000,
                      "penalite_appliquer": true,
                      "date_creation": "2025-01-10T10:00:00.000Z",
                      "campagne": {
                        "id_campagne": "cmcamp001",
                        "nom_campagne": "Campagne Printemps 2025",
                        "date_debut": "2025-03-01T00:00:00.000Z",
                        "date_fin": "2025-03-15T00:00:00.000Z",
                        "status": "TERMINEE"
                      }
                    }
                  ],
                  "statistiques": {
                    "total": 1,
                    "penalites_total": 50000,
                    "penalites_appliquees": 50000
                  }
                }
              }
            }
          },
          "401": {
            "description": "Non authentifié",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "403": {
            "description": "Accès refusé - Admin requis",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            "description": "Prestataire non trouvé",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" },
                "example": {
                  "error": "Prestataire non trouvé"
                }
              }
            }
          }
        }
      }
    },

    // ==================== GESTION DES PAIEMENTS ====================
    "/paiements": {
      "get": {
        "tags": ["Paiements"],
        "summary": "Lister tous les paiements",
        "description": "Récupère la liste paginée de tous les paiements avec filtres. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "description": "Numéro de page pour la pagination",
            "schema": {
              "type": "integer",
              "default": 1,
              "minimum": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "description": "Nombre d'enregistrements par page",
            "schema": {
              "type": "integer",
              "default": 50,
              "minimum": 1,
              "maximum": 100
            }
          },
          {
            "name": "id_campagne",
            "in": "query",
            "required": false,
            "description": "Filtrer par ID de campagne",
            "schema": { "type": "string" }
          },
          {
            "name": "id_prestataire",
            "in": "query",
            "required": false,
            "description": "Filtrer par ID de prestataire",
            "schema": { "type": "string" }
          },
          {
            "name": "statut_paiement",
            "in": "query",
            "required": false,
            "description": "Filtrer par statut de paiement (true=payé, false=non payé)",
            "schema": { "type": "boolean" }
          }
        ],
        "responses": {
          "200": {
            "description": "Liste des paiements récupérée avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "paiements": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/PaiementPrestataire" }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "page": { "type": "integer" },
                        "limit": { "type": "integer" },
                        "total": { "type": "integer" },
                        "totalPages": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "403": { "$ref": "#/components/responses/Forbidden" }
        }
      },
      "post": {
        "tags": ["Paiements"],
        "summary": "Créer un nouveau paiement",
        "description": "Crée un paiement pour un prestataire sur une campagne. Le paiement de base est calculé automatiquement selon le type de client (EXTERNE=5000, INTERNE=3000). Les pénalités sont agrégées depuis MaterielsCase. **Pénalité automatique :** Si état=MAUVAIS, les pénalités sont déduites du paiement. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["id_campagne", "id_prestataire", "paiement_base"],
                "properties": {
                  "id_campagne": {
                    "type": "string",
                    "description": "ID de la campagne (requis)"
                  },
                  "id_prestataire": {
                    "type": "string",
                    "description": "ID du prestataire (requis)"
                  },
                  "paiement_base": {
                    "type": "number",
                    "description": "Montant de base du paiement (requis)",
                    "example": 5000
                  },
                  "date_paiement": {
                    "type": "string",
                    "format": "date-time",
                    "description": "Date du paiement effectué (optionnel)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Paiement créé avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "paiement": { "$ref": "#/components/schemas/PaiementPrestataire" }
                  }
                }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "403": { "$ref": "#/components/responses/Forbidden" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "409": { "$ref": "#/components/responses/Conflict" }
        }
      }
    },

    "/paiements/calculer/{id_campagne}/{id_prestataire}": {
      "get": {
        "tags": ["Paiements"],
        "summary": "Calculer un paiement automatiquement",
        "description": "Calcule le paiement selon les règles métier : paiement_base selon type de client + déduction des pénalités de MaterielsCase. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id_campagne",
            "in": "path",
            "required": true,
            "description": "ID de la campagne",
            "schema": { "type": "string" }
          },
          {
            "name": "id_prestataire",
            "in": "path",
            "required": true,
            "description": "ID du prestataire",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Calcul du paiement réussi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "calcul": {
                      "type": "object",
                      "properties": {
                        "paiement_base": { "type": "number" },
                        "sanction_montant": { "type": "number" },
                        "paiement_final": { "type": "number" },
                        "details": {
                          "type": "object",
                          "properties": {
                            "type_client": { "type": "string", "enum": ["EXTERNE", "INTERNE"] },
                            "paiement_base_description": { "type": "string" },
                            "penalites_appliquees": { "type": "number" },
                            "montant_net_a_payer": { "type": "number" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "403": { "$ref": "#/components/responses/Forbidden" },
          "404": { "$ref": "#/components/responses/NotFound" }
        }
      }
    },

    "/paiements/{id_campagne}/{id_prestataire}": {
      "get": {
        "tags": ["Paiements"],
        "summary": "Récupérer un paiement spécifique",
        "description": "Récupère les détails d'un paiement pour une affectation (campagne + prestataire). **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id_campagne",
            "in": "path",
            "required": true,
            "description": "ID de la campagne",
            "schema": { "type": "string" }
          },
          {
            "name": "id_prestataire",
            "in": "path",
            "required": true,
            "description": "ID du prestataire",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Paiement récupéré avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "paiement": { "$ref": "#/components/schemas/PaiementPrestataire" }
                  }
                }
              }
            }
          },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "403": { "$ref": "#/components/responses/Forbidden" },
          "404": { "$ref": "#/components/responses/NotFound" }
        }
      },
      "put": {
        "tags": ["Paiements"],
        "summary": "Mettre à jour le statut du paiement",
        "description": "Met à jour le statut de paiement (payé/non payé) et la date de paiement. **Accès : Admin uniquement**",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "name": "id_campagne",
            "in": "path",
            "required": true,
            "description": "ID de la campagne",
            "schema": { "type": "string" }
          },
          {
            "name": "id_prestataire",
            "in": "path",
            "required": true,
            "description": "ID du prestataire",
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["statut_paiement", "date_paiement"],
                "properties": {
                  "statut_paiement": {
                    "type": "boolean",
                    "description": "Statut du paiement (true=payé, false=non payé)"
                  },
                  "date_paiement": {
                    "type": "string",
                    "format": "date-time",
                    "description": "Date du paiement effectué"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Paiement mis à jour avec succès",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "paiement": { "$ref": "#/components/schemas/PaiementPrestataire" }
                  }
                }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "403": { "$ref": "#/components/responses/Forbidden" },
          "404": { "$ref": "#/components/responses/NotFound" }
        }
      }
    },

    // ==================== NOTIFICATIONS ====================
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Lister les notifications de l'utilisateur",
        description: "Récupère la liste paginée des notifications pour l'utilisateur connecté",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "unread",
            in: "query",
            required: false,
            description: "Filtrer uniquement les non lues (true/false)",
            schema: { type: "boolean" }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre de notifications à retourner",
            schema: { type: "integer", default: 20 }
          },
          {
            name: "offset",
            in: "query",
            required: false,
            description: "Pagination (offset)",
            schema: { type: "integer", default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "Liste des notifications récupérée",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notifications: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Notification" }
                    },
                    total: { type: "integer" },
                    unread_count: { type: "integer" },
                    has_more: { type: "boolean" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        }
      }
    },

    "/notifications/count": {
      get: {
        tags: ["Notifications"],
        summary: "Compter les notifications non lues",
        description: "Retourne le nombre total de notifications non lues pour l'utilisateur",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Compteur récupéré",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        }
      }
    },

    "/notifications/read-all": {
      put: {
        tags: ["Notifications"],
        summary: "Marquer toutes les notifications comme lues",
        description: "Met à jour le statut de toutes les notifications non lues de l'utilisateur",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Opération réussie",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    count: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        }
      }
    },

    "/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Supprimer une notification",
        description: "Supprime définitivement une notification",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la notification",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Notification supprimée",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        }
      }
    },

    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Marquer une notification comme lue",
        description: "Met à jour le statut d'une notification spécifique",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la notification",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Notification marquée comme lue",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        }
      }
    },

    // ==================== STATISTIQUES ====================
    "/statistiques": {
      get: {
        tags: ["Statistiques"],
        summary: "Obtenir les statistiques globales (ADMIN seulement)",
        description: "Récupère les statistiques globales de l'application incluant les compteurs, les répartitions par statut et type de campagne, et la disponibilité des prestataires",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Statistiques récupérées avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    counts: {
                      type: "object",
                      properties: {
                        users: { type: "integer", description: "Nombre total d'utilisateurs" },
                        clients: { type: "integer", description: "Nombre total de clients" },
                        campagnes: { type: "integer", description: "Nombre total de campagnes" },
                        prestataires: { type: "integer", description: "Nombre total de prestataires" },
                        lieux: { type: "integer", description: "Nombre total de lieux" },
                        services: { type: "integer", description: "Nombre total de services" }
                      }
                    },
                    campagnes: {
                      type: "object",
                      properties: {
                        parStatus: {
                          type: "object",
                          description: "Répartition des campagnes par statut",
                          additionalProperties: { type: "integer" }
                        },
                        parType: {
                          type: "object",
                          description: "Répartition des campagnes par type",
                          additionalProperties: { type: "integer" }
                        }
                      }
                    },
                    prestataires: {
                      type: "object",
                      properties: {
                        total: { type: "integer", description: "Nombre total de prestataires" },
                        disponibles: { type: "integer", description: "Nombre de prestataires disponibles" },
                        indisponibles: { type: "integer", description: "Nombre de prestataires indisponibles" }
                      }
                    }
                  }
                },
                example: {
                  counts: {
                    users: 15,
                    clients: 8,
                    campagnes: 25,
                    prestataires: 120,
                    lieux: 5,
                    services: 4
                  },
                  campagnes: {
                    parStatus: {
                      PLANIFIEE: 5,
                      EN_COURS: 12,
                      TERMINEE: 7,
                      ANNULEE: 1
                    },
                    parType: {
                      MASSE: 18,
                      PROXIMITE: 7
                    }
                  },
                  prestataires: {
                    total: 120,
                    disponibles: 95,
                    indisponibles: 25
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Token manquant ou invalide"
                }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      }
    },

    "/campagnes/statistiques": {
      get: {
        tags: ["Statistiques"],
        summary: "Obtenir les statistiques des campagnes (ADMIN seulement)",
        description: "Récupère les statistiques agrégées des campagnes avec filtres optionnels. Permet d'obtenir la répartition par statut et par type de campagne.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "clientId",
            in: "query",
            required: false,
            description: "Filtrer les statistiques par client",
            schema: { type: "string", example: "clxxx123" }
          },
          {
            name: "lieuId",
            in: "query",
            required: false,
            description: "Filtrer les statistiques par lieu",
            schema: { type: "string", example: "clxxx456" }
          },
          {
            name: "dateDebut",
            in: "query",
            required: false,
            description: "Date de début minimale (ISO 8601)",
            schema: { type: "string", format: "date", example: "2024-01-01" }
          },
          {
            name: "dateFin",
            in: "query",
            required: false,
            description: "Date de fin maximale (ISO 8601)",
            schema: { type: "string", format: "date", example: "2024-12-31" }
          }
        ],
        responses: {
          "200": {
            description: "Statistiques des campagnes récupérées avec succès",
            headers: {
              "Cache-Control": {
                description: "Cache public pendant 5 minutes avec stale-while-revalidate de 10 minutes",
                schema: { type: "string", example: "public, s-maxage=300, stale-while-revalidate=600" }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: {
                      type: "integer",
                      description: "Nombre total de campagnes"
                    },
                    parStatus: {
                      type: "object",
                      description: "Répartition des campagnes par statut",
                      properties: {
                        PLANIFIEE: { type: "integer", description: "Nombre de campagnes planifiées" },
                        EN_COURS: { type: "integer", description: "Nombre de campagnes en cours" },
                        TERMINEE: { type: "integer", description: "Nombre de campagnes terminées" },
                        ANNULEE: { type: "integer", description: "Nombre de campagnes annulées" }
                      }
                    },
                    parType: {
                      type: "object",
                      description: "Répartition des campagnes par type",
                      properties: {
                        MASSE: { type: "integer", description: "Nombre de campagnes de masse" },
                        PROXIMITE: { type: "integer", description: "Nombre de campagnes de proximité" },
                        NON_SPECIFIE: { type: "integer", description: "Nombre de campagnes sans type spécifié" }
                      }
                    }
                  }
                },
                example: {
                  total: 45,
                  parStatus: {
                    PLANIFIEE: 12,
                    EN_COURS: 8,
                    TERMINEE: 20,
                    ANNULEE: 5
                  },
                  parType: {
                    MASSE: 30,
                    PROXIMITE: 10,
                    NON_SPECIFIE: 5
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Token manquant ou invalide"
                }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          }
        }
      }
    },

    "/clients/{id}/campagnes/statistiques": {
      get: {
        tags: ["Statistiques", "Clients"],
        summary: "Obtenir les statistiques des campagnes d'un client (ADMIN seulement)",
        description: "Récupère les statistiques détaillées des campagnes pour un client spécifique, incluant la répartition par statut, par type et le nombre d'affectations de prestataires.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID du client",
            schema: { type: "string", example: "clxxx123" }
          },
          {
            name: "dateDebut",
            in: "query",
            required: false,
            description: "Date de début minimale (ISO 8601)",
            schema: { type: "string", format: "date", example: "2024-01-01" }
          },
          {
            name: "dateFin",
            in: "query",
            required: false,
            description: "Date de fin maximale (ISO 8601)",
            schema: { type: "string", format: "date", example: "2024-12-31" }
          }
        ],
        responses: {
          "200": {
            description: "Statistiques du client récupérées avec succès",
            headers: {
              "Cache-Control": {
                description: "Cache public pendant 5 minutes avec stale-while-revalidate de 10 minutes",
                schema: { type: "string", example: "public, s-maxage=300, stale-while-revalidate=600" }
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client: {
                      type: "object",
                      description: "Informations du client",
                      properties: {
                        id: { type: "string", description: "ID du client" },
                        nom: { type: "string", description: "Nom du client" },
                        prenom: { type: "string", description: "Prénom du client" },
                        entreprise: { type: "string", description: "Nom de l'entreprise" }
                      }
                    },
                    campagnes: {
                      type: "object",
                      description: "Statistiques des campagnes",
                      properties: {
                        total: { type: "integer", description: "Nombre total de campagnes" },
                        actives: { type: "integer", description: "Nombre de campagnes actuellement en cours" },
                        parStatus: {
                          type: "object",
                          description: "Répartition par statut",
                          properties: {
                            PLANIFIEE: { type: "integer" },
                            EN_COURS: { type: "integer" },
                            TERMINEE: { type: "integer" },
                            ANNULEE: { type: "integer" }
                          }
                        },
                        parType: {
                          type: "object",
                          description: "Répartition par type",
                          properties: {
                            MASSE: { type: "integer" },
                            PROXIMITE: { type: "integer" },
                            NON_SPECIFIE: { type: "integer" }
                          }
                        }
                      }
                    },
                    prestataires: {
                      type: "object",
                      description: "Statistiques des prestataires",
                      properties: {
                        totalAffectations: { type: "integer", description: "Nombre total d'affectations de prestataires" }
                      }
                    }
                  }
                },
                example: {
                  client: {
                    id: "clxxx123",
                    nom: "Dupont",
                    prenom: "Jean",
                    entreprise: "Entreprise XYZ"
                  },
                  campagnes: {
                    total: 15,
                    actives: 3,
                    parStatus: {
                      PLANIFIEE: 4,
                      EN_COURS: 3,
                      TERMINEE: 6,
                      ANNULEE: 2
                    },
                    parType: {
                      MASSE: 10,
                      PROXIMITE: 3,
                      NON_SPECIFIE: 2
                    }
                  },
                  prestataires: {
                    totalAffectations: 45
                  }
                }
              }
            }
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Token manquant ou invalide"
                }
              }
            }
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              }
            }
          },
          "404": {
            description: "Client non trouvé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Client non trouvé"
                }
              }
            }
          }
        }
      }
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
          details: {
            type: "object",
            description: "Détails supplémentaires sur l'erreur"
          }
        },
      },

      User: {
        type: "object",
        properties: {
          id_user: {
            type: "string",
            description: "Identifiant unique de l'utilisateur"
          },
          email: {
            type: "string",
            format: "email",
            description: "Email de l'utilisateur"
          },
          nom: {
            type: "string",
            description: "Nom de l'utilisateur"
          },
          prenom: {
            type: "string",
            description: "Prénom de l'utilisateur"
          },
          type_user: {
            type: "string",
            enum: ["ADMIN", "SUPERVISEUR_CAMPAGNE", "CONTROLEUR", "OPERATIONNEL", "EQUIPE"],
            description: "Rôle de l'utilisateur"
          },
          contact: {
            type: "string",
            description: "Numéro de contact"
          },
          nom_utilisateur: {
            type: "string",
            description: "Nom d'utilisateur"
          },
          is_active: {
            type: "boolean",
            description: "Statut d'activation du compte"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          }
        },
      },

      Service: {
        type: "object",
        properties: {
          id_service: {
            type: "string",
            description: "Identifiant unique du service"
          },
          nom: {
            type: "string",
            description: "Nom du service"
          },
          description: {
            type: "string",
            description: "Description du service"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          }
        }
      },

      ServiceWithStats: {
        type: "object",
        properties: {
          id_service: {
            type: "string",
            description: "Identifiant unique du service"
          },
          nom: {
            type: "string",
            description: "Nom du service"
          },
          description: {
            type: "string",
            description: "Description du service"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          _count: {
            type: "object",
            properties: {
              campagnes: { type: "integer" },
              prestataires: { type: "integer" }
            }
          }
        }
      },

      ServiceWithDetails: {
        type: "object",
        properties: {
          id_service: {
            type: "string",
            description: "Identifiant unique du service"
          },
          nom: {
            type: "string",
            description: "Nom du service"
          },
          description: {
            type: "string",
            description: "Description du service"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          prestataires: {
            type: "array",
            items: { $ref: "#/components/schemas/Prestataire" }
          },
          campagnes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id_campagne: { type: "string" },
                nom_campagne: { type: "string" },
                date_debut: { type: "string", format: "date-time" },
                date_fin: { type: "string", format: "date-time" },
                status: {
                  type: "string",
                  enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                },
                client: {
                  type: "object",
                  properties: {
                    nom: { type: "string" },
                    prenom: { type: "string" },
                    entreprise: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },

      Prestataire: {
        type: "object",
        properties: {
          id_prestataire: { type: "string" },
          nom: { type: "string" },
          prenom: { type: "string" },
          contact: { type: "string" },
          disponible: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time", description: "Date de dernière modification" }
        }
      },

      PrestataireWithStats: {
        "type": "object",
        "properties": {
          "id_prestataire": { "type": "string" },
          "nom": { "type": "string" },
          "prenom": { "type": "string" },
          "contact": { "type": "string" },
          "disponible": { "type": "boolean" },
          "type_panneau": {
            "type": "string",
            "enum": ["PETIT", "GRAND"],
            "description": "Type de panneau publicitaire"
          },
          "marque": {
            "type": "string",
            "description": "Marque du véhicule"
          },
          "modele": {
            "type": "string",
            "description": "Modèle du véhicule"
          },
          "plaque": {
            "type": "string",
            "description": "Plaque d'immatriculation"
          },
          "couleur": {
            "type": "string",
            "description": "Couleur du véhicule"
          },
          "id_verification": {
            "type": "string",
            "description": "ID de vérification du véhicule"
          },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time", "description": "Date de dernière modification" },
          "_count": {
            "type": "object",
            "properties": {
              "affectations": { "type": "integer" },
              "dommages": { "type": "integer" }
            }
          }
        }
      },

      Notification: {
        type: "object",
        properties: {
          id_notification: {
            type: "string",
            description: "Identifiant unique de la notification"
          },
          type: {
            type: "string",
            enum: ["CAMPAIGN_EXPIRING", "ASSIGNMENT_WEEK_BEFORE", "ASSIGNMENT_2DAYS_BEFORE"],
            description: "Type de notification"
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Niveau de priorité"
          },
          title: {
            type: "string",
            description: "Titre de la notification"
          },
          message: {
            type: "string",
            description: "Contenu du message"
          },
          action_url: {
            type: "string",
            description: "Lien de redirection (optionnel)"
          },
          is_read: {
            type: "boolean",
            description: "Statut de lecture"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          metadata: {
            type: "object",
            description: "Données supplémentaires (JSON)"
          }
        }
      },

      Client: {
        type: "object",
        properties: {
          id_client: {
            type: "string",
            description: "Identifiant unique du client"
          },
          nom: {
            type: "string",
            description: "Nom du client"
          },
          prenom: {
            type: "string",
            description: "Prénom du client"
          },
          entreprise: {
            type: "string",
            description: "Nom de l'entreprise"
          },
          domaine_entreprise: {
            type: "string",
            description: "Domaine d'activité de l'entreprise"
          },
          adresse: {
            type: "string",
            description: "Adresse du client"
          },
          contact: {
            type: "string",
            description: "Numéro de contact"
          },
          mail: {
            type: "string",
            format: "email",
            description: "Email du client"
          },
          type_client: {
            type: "string",
            enum: ["EXTERNE", "INTERNE"],
            description: "Type de client"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          }
        }
      },

      ClientWithStats: {
        type: "object",
        properties: {
          id_client: {
            type: "string",
            description: "Identifiant unique du client"
          },
          nom: {
            type: "string",
            description: "Nom du client"
          },
          prenom: {
            type: "string",
            description: "Prénom du client"
          },
          entreprise: {
            type: "string",
            description: "Nom de l'entreprise"
          },
          domaine_entreprise: {
            type: "string",
            description: "Domaine d'activité de l'entreprise"
          },
          adresse: {
            type: "string",
            description: "Adresse du client"
          },
          contact: {
            type: "string",
            description: "Numéro de contact"
          },
          mail: {
            type: "string",
            format: "email",
            description: "Email du client"
          },
          type_client: {
            type: "string",
            enum: ["EXTERNE", "INTERNE"],
            description: "Type de client"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          },
          _count: {
            type: "object",
            properties: {
              campagnes: { type: "integer" }
            }
          }
        }
      },

      ClientWithDetails: {
        type: "object",
        properties: {
          id_client: {
            type: "string",
            description: "Identifiant unique du client"
          },
          nom: {
            type: "string",
            description: "Nom du client"
          },
          prenom: {
            type: "string",
            description: "Prénom du client"
          },
          entreprise: {
            type: "string",
            description: "Nom de l'entreprise"
          },
          domaine_entreprise: {
            type: "string",
            description: "Domaine d'activité de l'entreprise"
          },
          adresse: {
            type: "string",
            description: "Adresse du client"
          },
          contact: {
            type: "string",
            description: "Numéro de contact"
          },
          mail: {
            type: "string",
            format: "email",
            description: "Email du client"
          },
          type_client: {
            type: "string",
            enum: ["EXTERNE", "INTERNE"],
            description: "Type de client"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          },
          campagnes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id_campagne: { type: "string" },
                nom_campagne: { type: "string" },
                date_debut: { type: "string", format: "date-time" },
                date_fin: { type: "string", format: "date-time" },
                status: {
                  type: "string",
                  enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                },
                lieu: {
                  type: "object",
                  properties: {
                    nom: { type: "string" },
                    ville: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },

      Lieu: {
        type: "object",
        properties: {
          id_lieu: {
            type: "string",
            description: "Identifiant unique du lieu"
          },
          nom: {
            type: "string",
            description: "Nom du lieu"
          },
          ville: {
            type: "string",
            description: "Ville du lieu"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          }
        }
      },

      LieuWithStats: {
        type: "object",
        properties: {
          id_lieu: {
            type: "string",
            description: "Identifiant unique du lieu"
          },
          nom: {
            type: "string",
            description: "Nom du lieu"
          },
          ville: {
            type: "string",
            description: "Ville du lieu"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          _count: {
            type: "object",
            properties: {
              campagnes: { type: "integer" }
            }
          }
        }
      },

      LieuWithDetails: {
        type: "object",
        properties: {
          id_lieu: {
            type: "string",
            description: "Identifiant unique du lieu"
          },
          nom: {
            type: "string",
            description: "Nom du lieu"
          },
          ville: {
            type: "string",
            description: "Ville du lieu"
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          campagnes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id_campagne: { type: "string" },
                nom_campagne: { type: "string" },
                date_debut: { type: "string", format: "date-time" },
                date_fin: { type: "string", format: "date-time" },
                status: {
                  type: "string",
                  enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                },
                client: {
                  type: "object",
                  properties: {
                    nom: { type: "string" },
                    prenom: { type: "string" },
                    entreprise: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },

      CampagneWithRelations: {
        type: "object",
        properties: {
          id_campagne: {
            type: "string",
            description: "Identifiant unique de la campagne"
          },
          nom_campagne: {
            type: "string",
            description: "Nom de la campagne"
          },
          description: {
            type: "string",
            description: "Description de la campagne"
          },
          objectif: {
            type: "string",
            description: "Objectifs de la campagne"
          },
          quantite_service: {
            type: "integer",
            description: "Quantité de service demandée",
            example: 100
          },
          nbr_prestataire: {
            type: "integer",
            description: "Nombre de prestataires affectés",
            example: 10
          },
          type_campagne: {
            type: "string",
            enum: ["MASSE", "PROXIMITE"],
            description: "Type de campagne"
          },
          date_debut: {
            type: "string",
            format: "date-time",
            description: "Date de début"
          },
          date_fin: {
            type: "string",
            format: "date-time",
            description: "Date de fin"
          },
          status: {
            type: "string",
            enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"],
            description: "Statut de la campagne"
          },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          client: {
            type: "object",
            properties: {
              nom: { type: "string" },
              prenom: { type: "string" },
              entreprise: { type: "string" }
            }
          },
          lieu: {
            type: "object",
            properties: {
              nom: { type: "string" },
              ville: { type: "string" }
            }
          },
          service: {
            type: "object",
            properties: {
              nom: { type: "string" }
            }
          },
          gestionnaire: {
            type: "object",
            properties: {
              nom: { type: "string" },
              prenom: { type: "string" },
              email: { type: "string" }
            }
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          },
          _count: {
            type: "object",
            properties: {
              affectations: { type: "integer" },
              fichiers: { type: "integer" }
            }
          }
        }
      },

      CampagneWithFullDetails: {
        type: "object",
        properties: {
          id_campagne: {
            type: "string",
            description: "Identifiant unique de la campagne"
          },
          nom_campagne: {
            type: "string",
            description: "Nom de la campagne"
          },
          description: {
            type: "string",
            description: "Description de la campagne"
          },
          objectif: {
            type: "string",
            description: "Objectifs de la campagne"
          },
          quantite_service: {
            type: "integer",
            description: "Quantité de service demandée"
          },
          nbr_prestataire: {
            type: "integer",
            description: "Nombre de prestataires affectés"
          },
          type_campagne: {
            type: "string",
            enum: ["MASSE", "PROXIMITE"],
            description: "Type de campagne"
          },
          date_debut: {
            type: "string",
            format: "date-time",
            description: "Date de début"
          },
          date_fin: {
            type: "string",
            format: "date-time",
            description: "Date de fin"
          },
          status: {
            type: "string",
            enum: ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"],
            description: "Statut de la campagne"
          },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          },
          client: {
            type: "object",
            properties: {
              id_client: { type: "string" },
              nom: { type: "string" },
              prenom: { type: "string" },
              entreprise: { type: "string" },
              contact: { type: "string" },
              mail: { type: "string" }
            }
          },
          lieu: {
            type: "object",
            properties: {
              id_lieu: { type: "string" },
              nom: { type: "string" },
              ville: { type: "string" }
            }
          },
          service: {
            type: "object",
            properties: {
              id_service: { type: "string" },
              nom: { type: "string" },
              description: { type: "string" }
            }
          },
          gestionnaire: {
            type: "object",
            properties: {
              id_user: { type: "string" },
              nom: { type: "string" },
              prenom: { type: "string" },
              email: { type: "string" },
              type_user: {
                type: "string",
                enum: ["ADMIN", "SUPERVISEUR_CAMPAGNE", "CONTROLEUR", "OPERATIONNEL", "EQUIPE"]
              }
            }
          },
          affectations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prestataire: { $ref: "#/components/schemas/PrestataireWithDetails" },
                date_creation: { type: "string", format: "date-time" },
                status: { type: "string" }
              }
            }
          },
          fichiers: {
            type: "array",
            items: { $ref: "#/components/schemas/FichierCampagne" }
          },
          _count: {
            type: "object",
            properties: {
              affectations: { type: "integer" },
              fichiers: { type: "integer" },
              dommages: { type: "integer" }
            }
          }
        }
      },

      FichierCampagne: {
        type: "object",
        properties: {
          id_fichier: {
            type: "string",
            description: "Identifiant unique du fichier"
          },
          nom_fichier: {
            type: "string",
            description: "Nom du fichier"
          },
          description: {
            type: "string",
            description: "Description du fichier"
          },
          type_fichier: {
            type: "string",
            enum: ["RAPPORT_JOURNALIER", "RAPPORT_FINAL", "PIGE"],
            description: "Type de fichier"
          },
          lien_canva_drive: {
            type: "string",
            description: "Lien vers le fichier"
          },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          }
        }
      },

      FichierCampagneWithContext: {
        type: "object",
        properties: {
          id_fichier: {
            type: "string",
            description: "Identifiant unique du fichier"
          },
          nom_fichier: {
            type: "string",
            description: "Nom du fichier"
          },
          description: {
            type: "string",
            description: "Description du fichier"
          },
          type_fichier: {
            type: "string",
            enum: ["RAPPORT_JOURNALIER", "RAPPORT_FINAL", "PIGE"],
            description: "Type de fichier"
          },
          lien_canva_drive: {
            type: "string",
            description: "Lien vers le fichier"
          },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création"
          },
          campagne: {
            type: "object",
            properties: {
              nom_campagne: { type: "string" }
            }
          }
        }
      },

      PrestataireCampagne: {
        type: "object",
        properties: {
          id_campagne: { type: "string" },
          id_prestataire: { type: "string" },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création de l'affectation"
          },
          date_fin: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Date de fin d'affectation (null = actif)"
          },
          status: {
            type: "string",
            description: "Statut de l'affectation (ACTIF/INACTIF)"
          },
          image_affiche: {
            type: "string",
            nullable: true,
            description: "URL de l'image d'affiche"
          }
        }
      },

      PrestataireWithDetails: {
        "type": "object",
        "properties": {
          "id_prestataire": { "type": "string" },
          "nom": { "type": "string" },
          "prenom": { "type": "string" },
          "contact": { "type": "string" },
          "disponible": { "type": "boolean" },
          "type_panneau": {
            "type": "string",
            "enum": ["PETIT", "GRAND"]
          },
          "couleur": { "type": "string" },
          "marque": { "type": "string" },
          "modele": { "type": "string" },
          "plaque": { "type": "string" },
          "id_verification": { "type": "string" },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" },
          "service": {
            "type": "object",
            "properties": {
              "nom": { "type": "string" }
            }
          }
        }
      },

      PrestataireWithFullDetails: {
        "type": "object",
        "properties": {
          "id_prestataire": { "type": "string" },
          "nom": { "type": "string" },
          "prenom": { "type": "string" },
          "contact": { "type": "string" },
          "disponible": { "type": "boolean" },
          "type_panneau": {
            "type": "string",
            "enum": ["PETIT", "GRAND"]
          },
          "couleur": { "type": "string" },
          "marque": { "type": "string" },
          "modele": { "type": "string" },
          "plaque": { "type": "string" },
          "id_verification": { "type": "string" },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" },
          "service": {
            "type": "object",
            "properties": {
              "id_service": { "type": "string" },
              "nom": { "type": "string" },
              "description": { "type": "string" }
            }
          },
          "affectations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "campagne": {
                  "type": "object",
                  "properties": {
                    "id_campagne": { "type": "string" },
                    "nom_campagne": { "type": "string" },
                    "date_debut": { "type": "string", "format": "date-time" },
                    "date_fin": { "type": "string", "format": "date-time" },
                    "status": {
                      "type": "string",
                      "enum": ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
                    }
                  }
                },
                "date_creation": { "type": "string", "format": "date-time" },
                "status": { "type": "string" }
              }
            }
          },
          "dommages": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id_materiels_case": { "type": "string" },
                "etat": {
                  "type": "string",
                  "enum": ["BON", "MOYEN", "MAUVAIS"]
                },
                "description": { "type": "string" },
                "montant_penalite": { "type": "number" },
                "penalite_appliquer": { "type": "boolean" },
                "date_creation": { "type": "string", "format": "date-time" },
                "campagne": {
                  "type": "object",
                  "properties": {
                    "nom_campagne": { "type": "string" }
                  }
                }
              }
            }
          },
          "_count": {
            "type": "object",
            "properties": {
              "affectations": { "type": "integer" },
              "dommages": { "type": "integer" }
            }
          }
        }
      },

      MaterielsCase: {
        "type": "object",
        "properties": {
          "id_materiels_case": {
            "type": "string",
            "description": "Identifiant unique de l'enregistrement"
          },
          "nom_materiel": {
            "type": "string",
            "description": "Nom du matériel endommagé ou signalé",
            "example": "Panneau publicitaire"
          },
          "etat": {
            "type": "string",
            "enum": ["BON", "MOYEN", "MAUVAIS"],
            "description": "État du matériel constaté"
          },
          "description": {
            "type": "string",
            "description": "Description détaillée des dommages"
          },
          "montant_penalite": {
            "type": "number",
            "description": "Montant de la pénalité appliquée"
          },
          "penalite_appliquer": {
            "type": "boolean",
            "description": "Indique si la pénalité a été appliquée"
          },
          "photo_url": {
            "type": "string",
            "description": "URL de la photo du dommage"
          },
          "preuve_media": {
            "type": "string",
            "description": "URL d'une preuve média supplémentaire"
          },
          "date_creation": {
            "type": "string",
            "format": "date-time",
            "description": "Date de création de l'enregistrement"
          }
        }
      },

      MaterielsCaseWithRelations: {
        "type": "object",
        "properties": {
          "id_materiels_case": {
            "type": "string",
            "description": "Identifiant unique de l'enregistrement"
          },
          "nom_materiel": {
            "type": "string",
            "description": "Nom du matériel endommagé ou signalé",
            "example": "Panneau publicitaire"
          },
          "etat": {
            "type": "string",
            "enum": ["BON", "MOYEN", "MAUVAIS"],
            "description": "État du matériel constaté"
          },
          "description": {
            "type": "string",
            "description": "Description détaillée des dommages"
          },
          "montant_penalite": {
            "type": "number",
            "description": "Montant de la pénalité appliquée (calculé automatiquement si état=MAUVAIS)"
          },
          "penalite_appliquer": {
            "type": "boolean",
            "description": "Indique si la pénalité a été appliquée"
          },
          "photo_url": {
            "type": "string",
            "description": "URL de la photo du dommage"
          },
          "preuve_media": {
            "type": "string",
            "description": "URL d'une preuve média supplémentaire"
          },
          "date_creation": {
            "type": "string",
            "format": "date-time",
            "description": "Date de création de l'enregistrement"
          },
          "campagne": {
            "type": "object",
            "properties": {
              "id_campagne": { "type": "string" },
              "nom_campagne": { "type": "string" },
              "date_debut": { "type": "string", "format": "date-time" },
              "date_fin": { "type": "string", "format": "date-time" },
              "status": {
                "type": "string",
                "enum": ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]
              },
              "client": {
                "type": "object",
                "properties": {
                  "id_client": { "type": "string" },
                  "nom": { "type": "string" },
                  "type_client": {
                    "type": "string",
                    "enum": ["EXTERNE", "INTERNE"],
                    "description": "Type de client (détermine la pénalité automatique)"
                  }
                }
              }
            }
          },
          "prestataire": {
            "type": "object",
            "properties": {
              "id_prestataire": { "type": "string" },
              "nom": { "type": "string" },
              "prenom": { "type": "string" },
              "contact": { "type": "string" },
              "type_panneau": {
                "type": "string",
                "enum": ["PETIT", "GRAND"]
              },
              "plaque": { "type": "string" },
              "marque": { "type": "string" },
              "modele": { "type": "string" }
            }
          }
        }
      },

      PaiementPrestataire: {
        type: "object",
        description: "Paiement pour un prestataire sur une campagne",
        properties: {
          id_campagne_id_prestataire: {
            type: "string",
            description: "Identifiant unique composite (id_campagne-id_prestataire)"
          },
          id_campagne: {
            type: "string",
            description: "ID de la campagne"
          },
          id_prestataire: {
            type: "string",
            description: "ID du prestataire"
          },
          paiement_base: {
            type: "number",
            description: "Montant de base du paiement (5000 pour EXTERNE, 3000 pour INTERNE)"
          },
          sanction_montant: {
            type: "number",
            description: "Montant total des pénalités (agrégées depuis MaterielsCase avec état=MAUVAIS)"
          },
          paiement_final: {
            type: "number",
            description: "Montant final = paiement_base - sanction_montant"
          },
          statut_paiement: {
            type: "boolean",
            description: "Statut du paiement (true=payé, false=non payé)"
          },
          date_paiement: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Date du paiement effectué"
          },
          date_creation: {
            type: "string",
            format: "date-time",
            description: "Date de création du paiement"
          },
          date_modification: {
            type: "string",
            format: "date-time",
            description: "Date de dernière modification"
          },
          affectation: {
            type: "object",
            description: "Détails de l'affectation (relation)",
            properties: {
              id_campagne: { type: "string" },
              id_prestataire: { type: "string" },
              status: { type: "string" },
              prestataire: {
                type: "object",
                properties: {
                  nom: { type: "string" },
                  contact: { type: "string" },
                  email: { type: "string" }
                }
              }
            }
          },
          campagne: {
            type: "object",
            description: "Détails de la campagne (relation)",
            properties: {
              id_campagne: { type: "string" },
              nom_campagne: { type: "string" },
              client: {
                type: "object",
                properties: {
                  type_client: {
                    type: "string",
                    enum: ["EXTERNE", "INTERNE"],
                    description: "Type de client (détermine paiement_base)"
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: "Non authentifié",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      Forbidden: {
        description: "Accès refusé",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      BadRequest: {
        description: "Données invalides",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      NotFound: {
        description: "Ressource non trouvée",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      Conflict: {
        description: "Conflit de données",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      }
    },

    
  }
}

export async function GET() {
  return NextResponse.json(openApi);
}