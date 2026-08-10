export const userPaths = {
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
                username: { type: 'string' }
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
