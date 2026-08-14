export const commandePaths = {
  '/commandes': {
    get: {
      tags: ['Commandes'],
      summary: 'Lister les commandes avec pagination, recherche et filtres de statut',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche par numéro, nom/prénom du demandeur, nom du fournisseur ou équipement' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['en_attente', 'en_cours', 'livrée', 'annulée'] } },
      ],
      responses: {
        200: { description: 'Liste paginée des commandes retournée avec succès' },
        401: { description: 'Non authentifié' }
      }
    },
    post: {
      tags: ['Commandes'],
      summary: 'Créer une nouvelle commande d\'équipements (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fournisseur', 'articles'],
              properties: {
                fournisseur: { type: 'string', description: 'ID MongoDB du fournisseur' },
                articles: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['equipement', 'quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string', description: 'ID MongoDB de l\'équipement' },
                      quantiteCommandee: { type: 'integer', minimum: 1, example: 5 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Commande créée avec succès avec numéro séquentiel automatique' },
        400: { description: 'Validation échouée ou doublon d\'équipement dans la même commande' },
        404: { description: 'Fournisseur ou équipement introuvable' }
      }
    }
  },
  '/commandes/{id}': {
    get: {
      tags: ['Commandes'],
      summary: 'Obtenir les détails d\'une commande par ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Détails complets de la commande avec fournisseur, demandeur et équipements populés' },
        404: { description: 'Commande non trouvée' }
      }
    },
    patch: {
      tags: ['Commandes'],
      summary: 'Modifier une commande (Admin, disponible si statut = en_attente)',
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
                fournisseur: { type: 'string' },
                articles: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['equipement', 'quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string' },
                      quantiteCommandee: { type: 'integer', minimum: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Commande mise à jour avec succès' },
        409: { description: 'La commande ne peut plus être modifiée (statut différent de en_attente)' }
      }
    },
    delete: {
      tags: ['Commandes'],
      summary: 'Supprimer logiquement une commande (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Commande supprimée avec succès' },
        404: { description: 'Commande non trouvée ou déjà supprimée' }
      }
    }
  },
  '/commandes/{id}/status': {
    patch: {
      tags: ['Commandes'],
      summary: 'Mettre à jour le statut d\'une commande (Admin)',
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
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['en_attente', 'en_cours', 'livrée', 'annulée'],
                  example: 'en_cours'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Statut de la commande mis à jour avec succès' },
        400: { description: 'Le champ status est requis ou valeur invalide' },
        404: { description: 'Commande non trouvée' }
      }
    }
  }
};
