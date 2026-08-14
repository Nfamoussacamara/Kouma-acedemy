export const dashboardPaths = {
  '/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Obtenir les statistiques globales du tableau de bord (incluant les commandes)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistiques agrégées du système',
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
                      commandes: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 25 },
                          enAttente: { type: 'integer', example: 10 },
                          enCours: { type: 'integer', example: 8 },
                          livrees: { type: 'integer', example: 7 },
                          montantTotal: { type: 'number', example: 8500000 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Non authentifié' }
      }
    }
  }
};
