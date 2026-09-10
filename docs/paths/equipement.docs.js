export const equipementPaths = {
  '/equipements/stats': {
    get: {
      tags: ['Equipements'],
      summary: 'Obtenir les statistiques des équipements',
      description: 'Accessible aux rôles Admin et Utilisateur : total des équipements, actifs, inactifs, valeur totale et équipements en panne.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistiques des équipements récupérées avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 45 },
                      actifs: { type: 'integer', example: 40 },
                      inactifs: { type: 'integer', example: 5 },
                      montantTotal: { type: 'number', example: 12500000 },
                      equipementsEnPanne: { type: 'integer', example: 3 },
                      repartitionParType: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            typeId: { type: 'string' },
                            nom: { type: 'string', example: 'Informatique' },
                            total: { type: 'integer', example: 15 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Non authentifié' },
      },
    },
  },
  '/equipements': {
    get: {
      tags: ['Equipements'],
      summary: 'Lister les équipements',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'type', in: 'query', schema: { type: 'string', description: 'Filtrer par type' } },
        { name: 'fournisseur', in: 'query', schema: { type: 'string', description: 'Filtrer par fournisseur' } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Recherche globale' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
      ],
      responses: {
        200: { description: 'Liste des équipements' }
      }
    },
    post: {
      tags: ['Equipements'],
      summary: 'Ajouter un nouvel équipement (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
             schema: {
               type: 'object',
               required: ['designation', 'type', 'prix'],
               properties: {
                 designation: { type: 'string' },
                 type: { type: 'string', description: 'ID du type d\'équipement' },
                 fournisseur: { type: 'string', description: 'ID du fournisseur (optionnel)', nullable: true },
                 caracteristique: { type: 'string', nullable: true },
                 modele: { type: 'string', description: 'Modèle ou référence de l\'équipement (optionnel)', nullable: true },
                 prix: { type: 'number', default: 0 },
               }
             }
          }
        }
      },
      responses: {
        201: { description: 'Equipement créé avec succès' }
      }
    }
  },
  '/equipements/{id}': {
    get: {
      tags: ['Equipements'],
      summary: 'Obtenir les détails d\'un équipement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Détails de l\'équipement' },
        404: { description: 'Equipement non trouvé' }
      }
    },
    patch: {
      tags: ['Equipements'],
      summary: 'Modifier un équipement (Admin)',
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
                 designation: { type: 'string' },
                 type: { type: 'string' },
                 fournisseur: { type: 'string' },
                 caracteristique: { type: 'string' },
                 prix: { type: 'number' },
               }
             }
          }
        }
      },
      responses: {
        200: { description: 'Equipement mis à jour' }
      }
    },
    delete: {
      tags: ['Equipements'],
      summary: 'Supprimer un équipement (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        204: { description: 'Equipement supprimé' }
      }
    }
  },
  '/equipements/{id}/status': {
    patch: {
      tags: ['Equipements'],
      summary: 'Activer / Désactiver un équipement (Admin)',
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
