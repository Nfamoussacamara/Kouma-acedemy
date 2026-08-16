import {
  TYPE_PANNE,
  NIVEAU_URGENCE,
  SYSTEMES,
  VALID_QUERY_STATUTS,
  ALL_IMPACT_SERVICES,
  ALL_TENTATIVES,
} from '../../src/modules/panne/panne.constants.js';

export const pannePaths = {
  '/pannes/options': {
    get: {
      tags: ['Pannes'],
      summary: 'Obtenir les options et métadonnées du formulaire (UI dynamique)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Options retournées avec succès (types, urgences, systèmes, impacts et tentatives par type)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      types_panne: { type: 'array', items: { type: 'string' } },
                      niveaux_urgence: { type: 'array', items: { type: 'string' } },
                      systemes: { type: 'array', items: { type: 'string' } },
                      statuts: { type: 'array', items: { type: 'string' } },
                      impacts_par_type: { type: 'object' },
                      tentatives_par_type: { type: 'object' },
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
  '/pannes': {
    get: {
      tags: ['Pannes'],
      summary: 'Lister les pannes avec pagination, filtres et tri par urgence',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'niveau_urgence', in: 'query', schema: { type: 'string', enum: NIVEAU_URGENCE } },
        { name: 'type_panne', in: 'query', schema: { type: 'string', enum: TYPE_PANNE } },
        { name: 'besoin_intervention', in: 'query', schema: { type: 'boolean' } },
        { name: 'statut', in: 'query', schema: { type: 'string', enum: VALID_QUERY_STATUTS } },
      ],
      responses: {
        200: { description: 'Liste paginée des pannes triée par urgence (Critique en premier)' },
        401: { description: 'Non authentifié' },
      },
    },
    post: {
      tags: ['Pannes'],
      summary: 'Déclarer / Créer une nouvelle panne (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['description', 'type_panne', 'niveau_urgence', 'besoin_intervention'],
              properties: {
                description: { type: 'string', example: 'Écran de l\'échographe qui clignote' },
                type_panne: { type: 'string', enum: TYPE_PANNE, example: 'Équipement' },
                equipement: {
                  type: 'object',
                  description: 'Requis si type_panne = Équipement',
                  properties: {
                    designation: { type: 'string', example: 'Échographe Doppler' },
                    qte: { type: 'number', example: 1 },
                    modele: { type: 'string', example: 'Mindray DC-70' },
                  },
                },
                systeme: {
                  type: 'string',
                  enum: SYSTEMES,
                  description: 'Requis si type_panne = Espace/Système',
                  example: 'Pharmacie',
                },
                cause: { type: 'string', example: 'Câble défectueux' },
                niveau_urgence: { type: 'string', enum: NIVEAU_URGENCE, example: 'Critique' },
                impact_services: {
                  type: 'array',
                  items: { type: 'string', enum: ALL_IMPACT_SERVICES },
                  example: ['Arrêt des soins', 'Un service complet'],
                },
                tentatives_realisees: {
                  type: 'array',
                  items: { type: 'string', enum: ALL_TENTATIVES },
                  example: ['Vérification des alimentations', 'Reconnexion'],
                },
                besoin_intervention: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Panne créée avec succès avec statut NOUVELLE' },
        400: { description: 'Validation échouée (champs conditionnels manquants ou exclusivité mutuelle violée)' },
        401: { description: 'Non authentifié' },
      },
    },
  },
  '/pannes/{id}': {
    get: {
      tags: ['Pannes'],
      summary: 'Obtenir les détails complets d\'une panne par ID (avec commandes rattachées)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Détails de la panne avec déclarant et tableau des commandes rattachées' },
        404: { description: 'Panne non trouvée' },
      },
    },
    patch: {
      tags: ['Pannes'],
      summary: 'Modifier les informations d\'une panne (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                type_panne: { type: 'string', enum: TYPE_PANNE },
                equipement: {
                  type: 'object',
                  properties: {
                    designation: { type: 'string' },
                    qte: { type: 'number' },
                    modele: { type: 'string' },
                  },
                },
                systeme: { type: 'string', enum: SYSTEMES },
                cause: { type: 'string' },
                niveau_urgence: { type: 'string', enum: NIVEAU_URGENCE },
                impact_services: { type: 'array', items: { type: 'string', enum: ALL_IMPACT_SERVICES } },
                tentatives_realisees: { type: 'array', items: { type: 'string', enum: ALL_TENTATIVES } },
                besoin_intervention: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Panne mise à jour avec succès' },
        400: { description: 'Données invalides' },
        404: { description: 'Panne non trouvée' },
      },
    },
    delete: {
      tags: ['Pannes'],
      summary: 'Supprimer logiquement une panne (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Panne supprimée avec succès (soft delete)' },
        404: { description: 'Panne non trouvée ou déjà supprimée' },
      },
    },
  },
  '/pannes/{id}/statut': {
    patch: {
      tags: ['Pannes'],
      summary: 'Changer le statut d\'une panne (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['statut'],
              properties: {
                statut: {
                  type: 'string',
                  enum: VALID_QUERY_STATUTS,
                  example: 'en_cours',
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Statut de la panne mis à jour avec succès' },
        400: { description: 'Statut invalide' },
        404: { description: 'Panne non trouvée' },
      },
    },
  },
};
