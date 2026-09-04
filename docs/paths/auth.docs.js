import { STRUCTURE_SANITAIRE } from '../../src/modules/panne/panne.constants.js';

export const authPaths = {
  '/auth/login': {
    post: {
      tags: ['Authentification'],
      summary: 'Connexion',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                username: { type: 'string' },
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: { 
        200: { description: 'Utilisateur connecté avec succès (renvoie accessToken, refreshToken et profil utilisateur avec structure_sanitaire)' },
        401: { description: 'Identifiants invalides' }
      },
    }
  },
  
  '/auth/refresh': {
    post: {
      tags: ['Authentification'],
      summary: 'Rafraîchir le token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: { type: 'string' },
              },
            }
          }
        }
      },
      responses: { 
        200: { description: 'Token rafraîchi avec succès' },
        401: { description: 'Token invalide ou non fourni' }
      },
    }
  },  

  '/auth/register': {
    post: {
      tags: ['Authentification'],
      summary: 'Inscription d\'un nouvel utilisateur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'password', 'nom', 'prenom', 'type', 'structure_sanitaire'],
              properties: {
                username: { type: 'string' },
                password: { type: 'string', minLength: 8 },
                nom: { type: 'string' },
                prenom: { type: 'string' },
                tel: { type: 'string' },
                type: { type: 'string', enum: ['Admin', 'Utilisateur'] },
                structure_sanitaire: {
                  type: 'string',
                  enum: STRUCTURE_SANITAIRE,
                  description: 'Structure sanitaire de rattachement de l\'utilisateur (requise)',
                  example: 'HOPITAL REGIONAL DE LABE'
                },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: { 
        201: { description: 'Utilisateur créé' }, 
        400: { description: 'Cet utilisateur existe déjà' },
        403: { description: 'Non autorisé (Admin requis)' }
      },
    }
  },

  '/auth/logout': {
    post: {
      tags: ['Authentification'],
      summary: 'Déconnexion de l\'utilisateur',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Déconnexion réussie',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Déconnexion réussie' }
                }
              }
            }
          }
        },
        401: { description: 'Non authentifié ou jeton invalide' }
      }
    }
  },

  '/auth/logout-all': {
    post: {
      tags: ['Authentification'],
      summary: 'Déconnexion de toutes les sessions de l\'utilisateur',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Déconnexion globale réussie',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Déconnexion réussie de tous les appareils' }
                }
              }
            }
          }
        },
        401: { description: 'Non authentifié ou jeton invalide' }
      }
    }
  }
};