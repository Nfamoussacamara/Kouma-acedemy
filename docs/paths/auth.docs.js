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
        200: { description: 'Utilisateur connecté avec succès (renvoie le token)' },
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
              required: ['username', 'password', 'nom', 'prenom', 'type'],
              properties: {
                username: { type: 'string' },
                password: { type: 'string', minLength: 8 },
                nom: { type: 'string' },
                prenom: { type: 'string' },
                tel: { type: 'string' },
                type: { type: 'string', enum: ['Admin', 'Utilisateur'] },
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
  }   
};