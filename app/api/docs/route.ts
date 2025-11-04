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

    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Créer un utilisateur (ADMIN seulement)",
        description: "Créer un nouvel utilisateur. Nécessite un token JWT d'administrateur.",
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
                    example: "nouveau@camptrack.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "password123",
                  },
                  nom: { 
                    type: "string",
                    example: "Dupont" 
                  },
                  prenom: { 
                    type: "string",
                    example: "Jean" 
                  },
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
                  contact: { 
                    type: "string", 
                    example: "+225 07 12 34 56 78" 
                  },
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
                    created_at: "2025-01-03T14:00:00.000Z"
                  }
                }
              },
            },
          },
          "400": {
            description: "Données invalides",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Le mot de passe doit contenir au moins 6 caractères"
                }
              },
            },
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Token manquant ou invalide"
                }
              },
            },
          },
          "403": {
            description: "Accès refusé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Accès refusé - Admin requis"
                }
              },
            },
          },
          "409": {
            description: "Email déjà utilisé",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Cet email est déjà utilisé"
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
        description: "Permet de générer un nouveau token d'accès à partir d'un refresh token valide.",
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
      post: {
        tags: ["Authentication"],
        summary: "Déconnexion",
        description: "Révoque le refresh token et déconnecte l'utilisateur du système.",
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
                    ok: { type: "boolean" },
                    message: { type: "string" }
                  }
                },
                example: {
                  ok: true,
                  message: "Déconnexion réussie"
                }
              },
            },
          },
          "401": {
            description: "Non authentifié",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  error: "Token manquant ou invalide"
                }
              },
            },
          },
        },
      },
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
    }
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
    }
  },
};

export async function GET() {
  return NextResponse.json(openApi);
}