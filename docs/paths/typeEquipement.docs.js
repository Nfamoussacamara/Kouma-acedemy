export const typeEquipementPaths = {
  '/type-equipements': {
    get: {
      tags: ['Type Equipements'],
      summary: 'Lister les types d\'équipements',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche par nom ou description' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
      ],
      responses: {
        200: { description: 'Liste des types d\'équipements' }
      }
    },
    post: {
      tags: ['Type Equipements'],
      summary: 'Ajouter un nouveau type d\'équipement (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
             schema: {
               type: 'object',
               required: ['nom', 'description'],
               properties: {
                 nom: { type: 'string' },
                 description: { type: 'string' }
               }
             }
          }
        }
      },
      responses: {
        201: { description: 'Type d\'équipement créé' }
      }
    }
  },
  '/type-equipements/{id}': {
    get: {
      tags: ['Type Equipements'],
      summary: 'Obtenir les détails d\'un type d\'équipement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Détails du type d\'équipement' },
        404: { description: 'Type d\'équipement non trouvé' }
      }
    },
    patch: {
      tags: ['Type Equipements'],
      summary: 'Modifier un type d\'équipement (Admin)',
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
                 description: { type: 'string' }
               }
             }
          }
        }
      },
      responses: {
        200: { description: 'Type d\'équipement mis à jour' }
      }
    },
    delete: {
      tags: ['Type Equipements'],
      summary: 'Supprimer un type d\'équipement (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Type d\'équipement supprimé' }
      }
    }
  },
  '/type-equipements/{id}/status': {
    patch: {
      tags: ['Type Equipements'],
      summary: 'Activer / Désactiver un type d\'équipement (Admin)',
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
