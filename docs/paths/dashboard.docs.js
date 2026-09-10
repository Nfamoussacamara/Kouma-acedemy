export const dashboardPaths = {
  '/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Obtenir les statistiques globales du tableau de bord',
      description: 'Retourne les KPIs globaux des utilisateurs, équipements, commandes et pannes (incluant répartition par structure et dernières pannes). Accès réservé aux Administrateurs.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistiques globales du système',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      usersCount: { type: 'integer', example: 12 },
                      equipementsCount: { type: 'integer', example: 45 },
                      typeEquipementsCount: { type: 'integer', example: 8 },
                      fournisseursCount: { type: 'integer', example: 5 },
                      montantTotal: { type: 'number', example: 15400000 },
                      equipementsEnPanne: { type: 'integer', example: 6 },
                      commandes: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 25 },
                          brouillon: { type: 'integer', example: 4 },
                          emises: { type: 'integer', example: 6 },
                          partiellementRecues: { type: 'integer', example: 3 },
                          recues: { type: 'integer', example: 10 },
                          annulees: { type: 'integer', example: 2 },
                          montantTotal: { type: 'number', example: 8500000 },
                        },
                      },
                      pannes: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 30 },
                          nouvelles: { type: 'integer', example: 8 },
                          enCours: { type: 'integer', example: 10 },
                          resolues: { type: 'integer', example: 7 },
                          cloturees: { type: 'integer', example: 5 },
                          critiques: { type: 'integer', example: 4 },
                          besoinIntervention: { type: 'integer', example: 9 },
                          repartitionParStructure: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                structure: { type: 'string', example: 'HOPITAL REGIONAL DE LABE' },
                                total: { type: 'integer', example: 12 },
                              },
                            },
                          },
                          dernieresPannes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string', example: '66dc6497f1f0a2001e3b5e40' },
                                reference: { type: 'string', example: 'PAN-2026-001' },
                                structure_sanitaire: { type: 'string', example: 'HOPITAL REGIONAL DE LABE' },
                                description: { type: 'string', example: 'Écran noir au démarrage' },
                                type_panne: { type: 'string', example: 'Equipement' },
                                niveau_urgence: { type: 'string', example: 'Critique' },
                                statut: { type: 'string', example: 'NOUVELLE' },
                                besoin_intervention: { type: 'boolean', example: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                declarant: {
                                  type: 'object',
                                  properties: {
                                    _id: { type: 'string', example: '66dc63f7f1f0a2001e3b5e20' },
                                    username: { type: 'string', example: 'dr_diallo' },
                                    nom: { type: 'string', example: 'Diallo' },
                                    prenom: { type: 'string', example: 'Mamadou' },
                                    tel: { type: 'string', example: '620000000' },
                                    structure_sanitaire: { type: 'string', example: 'HOPITAL REGIONAL DE LABE' },
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
              },
            },
          },
        },
        401: { description: 'Non authentifié' },
        403: { description: 'Accès réservé aux administrateurs' },
      },
    },
  },

  '/dashboard/charts/monthly': {
    get: {
      tags: ['Dashboard'],
      summary: 'Obtenir l’évolution mensuelle des pannes et commandes',
      description: 'Retourne les statistiques mois par mois sur l’année spécifiée pour alimenter les graphiques. Accès réservé aux Administrateurs.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'year',
          in: 'query',
          description: 'Année souhaitée (par défaut : année courante)',
          required: false,
          schema: { type: 'integer', example: 2026 },
        },
      ],
      responses: {
        200: {
          description: 'Données mensuelles prêtes pour les graphiques',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      annee: { type: 'integer', example: 2026 },
                      mois: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            mois: { type: 'string', example: 'Janvier' },
                            moisNumero: { type: 'integer', example: 1 },
                            pannes: {
                              type: 'object',
                              properties: {
                                total: { type: 'integer', example: 12 },
                                resolues: { type: 'integer', example: 9 },
                              },
                            },
                            commandes: {
                              type: 'object',
                              properties: {
                                total: { type: 'integer', example: 3 },
                                montantTotal: { type: 'number', example: 4500000 },
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
          },
        },
        401: { description: 'Non authentifié' },
        403: { description: 'Accès réservé aux administrateurs' },
      },
    },
  },
};
