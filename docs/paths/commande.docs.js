export const commandePaths = {
  '/commandes': {
    get: {
      tags: ['Commandes'],
      summary: 'Lister les commandes avec pagination, recherche et filtres',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche par numéro, demandeur, fournisseur ou désignation' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['brouillon', 'emise', 'partiellement_recue', 'recue', 'annulee'] } },
        { name: 'fournisseur', in: 'query', schema: { type: 'string', description: 'Filtrer par ID de fournisseur' } },
      ],
      responses: {
        200: { description: 'Liste paginée des commandes' },
        401: { description: 'Non authentifié' }
      }
    },
    post: {
      tags: ['Commandes'],
      summary: 'Créer une nouvelle commande (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['panne', 'fournisseur', 'articles'],
              properties: {
                panne: { type: 'string', description: 'ID MongoDB de la panne liée à cette commande' },
                fournisseur: { type: 'string', description: 'ID MongoDB du fournisseur' },
                articles: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string', description: 'ID équipement du catalogue (optionnel si typeEquipement renseigné)', nullable: true },
                      typeEquipement: { type: 'string', description: 'ID type d\'équipement hors-catalogue (optionnel si equipement renseigné)', nullable: true },
                      designation: { type: 'string', description: 'Désignation libre pour article hors-catalogue', nullable: true },
                      quantiteCommandee: { type: 'integer', minimum: 1 },
                      prixUnitaire: { type: 'number', minimum: 0, default: 0, description: 'Prix optionnel — connu après réception du devis' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Commande créée en statut BROUILLON avec numéro séquentiel généré automatiquement' },
        400: { description: 'Validation échouée ou article sans référence (equipement ou typeEquipement)' },
        404: { description: 'Fournisseur, panne ou équipement catalogue introuvable' }
      }
    }
  },
  '/commandes/{id}': {
    get: {
      tags: ['Commandes'],
      summary: 'Obtenir les détails d\'une commande',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Détails complets avec fournisseur, pannes liées, demandeur, articles et réceptions' },
        404: { description: 'Commande non trouvée' }
      }
    },
    patch: {
      tags: ['Commandes'],
      summary: 'Modifier une commande (Admin) — bloqué si RECUE ou ANNULEE',
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
                pannes: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  nullable: true,
                },
                fournisseur: { type: 'string', nullable: true },
                articles: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string', nullable: true },
                      typeEquipement: { type: 'string', nullable: true },
                      designation: { type: 'string', nullable: true },
                      quantiteCommandee: { type: 'integer', minimum: 1 },
                      prixUnitaire: { type: 'number', minimum: 0, description: 'Figé si des réceptions existent sur cet article' }
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
        409: { description: 'Statut RECUE ou ANNULEE — modification impossible. Ou tentative de modifier un prix figé' }
      }
    },
    delete: {
      tags: ['Commandes'],
      summary: 'Supprimer logiquement une commande (Admin) — bloqué si réception existante',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Commande supprimée avec succès' },
        404: { description: 'Commande non trouvée ou déjà supprimée' },
        409: { description: 'Impossible de supprimer une commande avec réceptions' }
      }
    }
  },
  '/commandes/{id}/receptions': {
    post: {
      tags: ['Commandes'],
      summary: 'Enregistrer une réception partielle ou totale d\'une commande (Admin)',
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
              required: ['articlesRecus'],
              properties: {
                articlesRecus: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['quantiteRecue'],
                    properties: {
                      equipement: { type: 'string', description: 'ID équipement catalogue', nullable: true },
                      typeEquipement: { type: 'string', description: 'ID type d\'équipement (pour article hors-catalogue)', nullable: true },
                      quantiteRecue: { type: 'integer', minimum: 1 },
                      prixUnitaire: { type: 'number', minimum: 0, description: 'Prix réel communiqué par le fournisseur — met à jour le catalogue' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Réception enregistrée. Statut passe automatiquement à PARTIELLEMENT_RECUE ou RECUE. Les équipements hors-catalogue sont créés automatiquement. Le prix catalogue est mis à jour avec historique.'
        },
        400: { description: 'Article non trouvé dans la commande ou quantité reçue supérieure au solde restant' },
        409: { description: 'Commande déjà RECUE ou ANNULEE' }
      }
    }
  },
  '/commandes/{id}/status': {
    patch: {
      tags: ['Commandes'],
      summary: 'Changer manuellement le statut d\'une commande (Admin)',
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
                  enum: ['brouillon', 'emise', 'partiellement_recue', 'recue', 'annulee'],
                  example: 'emise'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Statut mis à jour avec succès' },
        400: { description: 'Valeur de statut invalide' },
        404: { description: 'Commande non trouvée' },
        409: { description: 'Annulation impossible si des réceptions existent' }
      }
    }
  }
};
