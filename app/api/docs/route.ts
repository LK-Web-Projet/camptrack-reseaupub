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
        description: "Récupère la liste paginée des prestataires associés à un service spécifique",
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
            description: "Liste des prestataires récupérée avec succès",
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
          created_at: { type: "string", format: "date-time" }
        }
      },

      PrestataireWithStats: {
        type: "object",
        properties: {
          id_prestataire: { type: "string" },
          nom: { type: "string" },
          prenom: { type: "string" },
          contact: { type: "string" },
          disponible: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          vehicule: {
            type: "object",
            properties: {
              type_panneau: { 
                type: "string",
                enum: ["PETIT", "GRAND"]
              },
              marque: { type: "string" },
              modele: { type: "string" },
              plaque: { type: "string" }
            }
          },
          _count: {
            type: "object",
            properties: {
              affectations: { type: "integer" }
            }
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
    }
  },
};

export async function GET() {
  return NextResponse.json(openApi);
}