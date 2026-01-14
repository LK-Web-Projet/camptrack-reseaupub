import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampTrack API - RéseauPub',
      version: '1.0.0',
      description: 'Système de gestion des campagnes publicitaires sur tricycles',
      contact: {
        name: 'Équipe CampTrack',
        email: 'dev@camptrack.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur de développement'
      },
      {
        url: 'https://camptrack-production.up.railway.app/api',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clabc123...' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['ADMIN', 'SUPERVISEUR_CAMPAGNE', 'UTILISATEUR'] 
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './app/api/**/route.ts',
    './app/api/**/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);