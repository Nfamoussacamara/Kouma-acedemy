export const fournisseurPaths = {
  '/fournisseurs': {
    get: {
      tags: ['Fournisseurs'],
      summary: 'Lister les fournisseurs',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche par nom, adresse ou contact' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
      ],
      responses: {
        200: { description: 'Liste des fournisseurs' }
      }
    },
    post: {
      tags: ['Fournisseurs'],
      summary: 'Créer un nouveau fournisseur (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
             schema: {
               type: 'object',
               required: ['nom', 'contact'],
               properties: {
                 nom: { type: 'string' },
                 contact: { type: 'string' },
                 adresse: { type: 'string' },
               }
             }
          }
        }
      },
      responses: {
        201: { description: 'Fournisseur créé' }
      }
    }
  },
  '/fournisseurs/{id}': {
    get: {
      tags: ['Fournisseurs'],
      summary: 'Obtenir les détails d\'un fournisseur',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Détails du fournisseur' },
        404: { description: 'Fournisseur non trouvé' }
      }
    },
    patch: {
      tags: ['Fournisseurs'],
      summary: 'Modifier un fournisseur (Admin)',
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
                 adresse: { type: 'string' },
                 contact: { type: 'string' },
               }
             }
          }
        }
      },
      responses: {
        200: { description: 'Fournisseur mis à jour' }
      }
    },
    delete: {
      tags: ['Fournisseurs'],
      summary: 'Supprimer un fournisseur (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        204: { description: 'Fournisseur supprimé' },
        400: { description: 'Impossible de supprimer, des équipements y sont liés.' }
      }
    }
  },
  '/fournisseurs/{id}/status': {
    patch: {
      tags: ['Fournisseurs'],
      summary: 'Activer / Désactiver un fournisseur (Admin)',
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
               properties: {
                 isActive: { type: 'boolean' }
               }
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
