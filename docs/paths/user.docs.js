import { STRUCTURE_SANITAIRE } from '../../src/modules/panne/panne.constants.js';

export const userPaths = {
  '/users/stats': {
    get: {
      tags: ['Utilisateurs'],
      summary: 'Obtenir les statistiques des utilisateurs (Admin)',
      description: 'Retourne le nombre total d\'utilisateurs, répartition par rôles (Admin / Utilisateur), statuts et les 5 derniers comptes.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistiques des utilisateurs récupérées avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 12 },
                      parRole: {
                        type: 'object',
                        properties: {
                          admins: { type: 'integer', example: 2 },
                          utilisateurs: { type: 'integer', example: 10 },
                        },
                      },
                      actifs: { type: 'integer', example: 11 },
                      inactifs: { type: 'integer', example: 1 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Non authentifié' },
        403: { description: 'Accès réservé aux administrateurs' },
      },
    },
  },
  '/users': {
    get: {
      tags: ['Utilisateurs'],
      summary: 'Récupérer la liste des utilisateurs paginée (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche par nom, prénom, email, tel' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
      ],  
      responses: { 
        200: { description: 'Liste des utilisateurs' },
        403: { description: 'Accès refusé' }   
      },
    }
  },

  '/users/me': {
    get: {
      tags: ['Utilisateurs'],
      summary: 'Récupérer le profil de l\'utilisateur connecté',
      security: [{ bearerAuth: [] }],
      responses: { 
        200: { description: 'Profil de l\'utilisateur' },
        401: { description: 'Non authentifié' }
      }
    }
  },

  '/users/me/password': {
    patch: {
      tags: ['Utilisateurs'],
      summary: 'Changer son mot de passe personnel',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['oldPassword', 'newPassword'],
              properties: {
                oldPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 8 }
              }
            }
          }
        }
      },
      responses: { 
        200: { description: 'Mot de passe mis à jour' },
        400: { description: 'Ancien mot de passe incorrect' }
      }
    }
  },

  '/users/{id}': {
    get: {
      tags: ['Utilisateurs'],
      summary: 'Récupérer un utilisateur par ID (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: { 
        200: { description: 'Utilisateur trouvé' }, 
        404: { description: 'Utilisateur non trouvé' } 
      },
    },
    patch: {
      tags: ['Utilisateurs'],
      summary: 'Mettre à jour un utilisateur (Admin ou propriétaire)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                prenom: { type: 'string' },
                tel: { type: 'string' },
                username: { type: 'string' },
                type: { type: 'string', enum: ['Admin', 'Utilisateur'] },
                structure_sanitaire: {
                  type: 'string',
                  enum: STRUCTURE_SANITAIRE,
                  description: 'Structure sanitaire de rattachement'
                }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Mise à jour effectuée' } },  
    },
    delete: {
      tags: ['Utilisateurs'],
      summary: 'Supprimer un utilisateur (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: { 
        204: { description: 'Utilisateur supprimé' },
        404: { description: 'Utilisateur non trouvé' },
        403: { description: 'Accès refusé' }, 
      },
    }
  },

  '/users/{id}/status': {
    patch: {
      tags: ['Utilisateurs'],
      summary: 'Activer / Désactiver un compte (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['isActive'],
              properties: { isActive: { type: 'boolean' } }
            }
          }
        }
      },
      responses: { 
        200: { description: 'Statut mis à jour' }
      }
    }
  }
};
