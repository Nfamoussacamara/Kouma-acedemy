import { STATUT_COMMANDE, STATUT_PAIEMENT } from '../../src/modules/commande/commande.constance.js';

export const commandePaths = {
  '/commandes/stats': {
    get: {
      tags: ['Commandes'],
      summary: 'Obtenir les statistiques des commandes (Admin)',
      description: 'Retourne les KPIs des commandes : totaux par statut, montant global engagé et les 5 dernières commandes.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistiques des commandes récupérées avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 12 },
                      parStatut: {
                        type: 'object',
                        properties: {
                          brouillon: { type: 'integer', example: 2 },
                          emises: { type: 'integer', example: 3 },
                          partiellementRecues: { type: 'integer', example: 2 },
                          recues: { type: 'integer', example: 4 },
                          annulees: { type: 'integer', example: 1 },
                        },
                      },
                      montantTotal: { type: 'number', example: 2450000 },
                      dernieresCommandes: { type: 'array', items: { type: 'object' } },
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
              required: ['fournisseur', 'equipements'],
              properties: {
                panne: { type: 'string', description: 'ID MongoDB de la panne liée à cette commande (optionnel)', nullable: true },
                fournisseur: { type: 'string', description: 'ID MongoDB du fournisseur' },
                utiliserPrixCatalogue: { type: 'boolean', default: false, description: 'Optionnel. Si true, pré-remplit le prix unitaire des équipements avec le dernier prix catalogue connu (si > 0).' },
                equipements: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['equipement', 'quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string', description: 'ID MongoDB de l\'équipement' },
                      quantiteCommandee: { type: 'integer', minimum: 1, description: 'Quantité commandée' },
                      prixUnitaire: { type: 'number', minimum: 0, default: 0, description: 'Prix unitaire (optionnel, 0 par défaut)' }
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
        400: { description: 'Validation échouée' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Fournisseur, panne ou équipement catalogue introuvable' }
      }
    }
  },
  '/commandes/suggestions-equipements': {
    post: {
      tags: ['Commandes'],
      summary: 'Suggérer des équipements correspondants pour une commande (Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['equipements'],
              properties: {
                equipements: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    properties: {
                      typeEquipement: { type: 'string', description: 'ID MongoDB du type d\'équipement', nullable: true },
                      modele: { type: 'string', description: 'Modèle de l\'équipement', nullable: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Suggestions d\'équipements trouvées' },
        400: { description: 'Validation échouée' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' }
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
        200: { description: 'Détails complets avec fournisseur, panne liée, demandeur, équipements et réceptions' },
        401: { description: 'Non authentifié' },
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
                panne: { type: 'string', description: 'ID de la panne liée', nullable: true },
                fournisseur: { type: 'string', nullable: true },
                equipements: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['equipement', 'quantiteCommandee'],
                    properties: {
                      equipement: { type: 'string', description: 'ID MongoDB de l\'équipement' },
                      quantiteCommandee: { type: 'integer', minimum: 1 },
                      prixUnitaire: { type: 'number', minimum: 0, description: 'Figé si des réceptions existent sur cet équipement' }
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
        400: { description: 'Validation échouée' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
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
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
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
              required: ['equipementsRecus'],
              properties: {
                equipementsRecus: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['equipement', 'quantiteRecue'],
                    properties: {
                      equipement: { type: 'string', description: 'ID équipement catalogue' },
                      quantiteRecue: { type: 'integer', minimum: 1 },
                      prixUnitaire: { type: 'number', minimum: 0, nullable: true, description: 'Prix unitaire d\'achat réel constaté — met à jour l\'historique de prix' }
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
          description: 'Réception enregistrée. Statut passe automatiquement à PARTIELLEMENT_RECUE ou RECUE.'
        },
        400: { description: 'Équipement non trouvé dans la commande ou quantité reçue supérieure au solde restant' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
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
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Commande non trouvée' },
        409: { description: 'Annulation impossible si des réceptions existent' }
      }
    }
  },
  '/commandes/{commandeId}/receptions/{receptionId}/facture': {
    post: {
      tags: ['Commandes'],
      summary: 'Téléverser une facture pour une réception de commande (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'commandeId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID MongoDB de la commande' },
        { name: 'receptionId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la réception' }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Fichier facture (PDF, image, etc.)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Facture enregistrée avec succès' },
        400: { description: 'Aucun fichier fourni ou format invalide' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Commande ou réception introuvable' }
      }
    },
    delete: {
      tags: ['Commandes'],
      summary: 'Supprimer (soft delete) la facture d\'une réception (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'commandeId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID MongoDB de la commande' },
        { name: 'receptionId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la réception' }
      ],
      responses: {
        200: { description: 'Facture supprimée avec succès' },
        400: { description: 'Aucune facture associée ou déjà supprimée' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Commande ou réception introuvable' }
      }
    }
  },
  '/commandes/{commandeId}/receptions/{receptionId}/facture/restore': {
    patch: {
      tags: ['Commandes'],
      summary: 'Restaurer la facture supprimée d\'une réception (Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'commandeId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID MongoDB de la commande' },
        { name: 'receptionId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la réception' }
      ],
      responses: {
        200: { description: 'Facture restaurée avec succès' },
        400: { description: 'Aucune facture associée ou facture non supprimée' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Commande ou réception introuvable' }
      }
    }
  },
  '/commandes/{commandeId}/paiements': {
    post: {
      tags: ['Commandes'],
      summary: 'Enregistrer un paiement pour une commande (Admin)',
      description: 'Ajoute un sous-document paiement à la commande, génère un numéro de reçu unique (PAY-YYYYMMDD-XXXX) et actualise le statut de paiement de la commande (NON_PAYE, PARTIELLEMENT_PAYE, PAYE).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commandeId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB de la commande'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['montant'],
              properties: {
                montant: {
                  type: 'number',
                  minimum: 1,
                  example: 50000,
                  description: 'Montant versé (doit être supérieur à 0)'
                },
                date: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Date du versement (optionnelle, défaut: maintenant)'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Paiement enregistré avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'La commande mise à jour avec le nouveau paiement' },
                  message: { type: 'string', example: 'Paiement enregistré avec succès' }
                }
              }
            }
          }
        },
        400: { description: 'Données de validation invalides' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Commande non trouvée' },
        409: { description: 'Commande annulée ou montant total supérieur au montant de la commande' }
      }
    }
  },
  '/commandes/{commandeId}/paiements/{paiementId}': {
    get: {
      tags: ['Commandes'],
      summary: 'Consulter un paiement spécifique (Admin)',
      description: 'Récupère les détails d\'un paiement rattaché à une commande.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commandeId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB de la commande'
        },
        {
          name: 'paiementId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB du paiement'
        }
      ],
      responses: {
        200: {
          description: 'Détails du paiement récupérés avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      reference: { type: 'string', example: 'PAY-20260915-0001' },
                      montant: { type: 'number', example: 50000 },
                      date: { type: 'string', format: 'date-time' },
                      payePar: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          nom: { type: 'string' },
                          prenom: { type: 'string' },
                          username: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Identifiant invalide' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Paiement ou commande non trouvé' }
      }
    },
    patch: {
      tags: ['Commandes'],
      summary: 'Modifier un paiement (Admin)',
      description: 'Met à jour le montant et/ou la date d\'un paiement et recalcule le statut de paiement de la commande.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commandeId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB de la commande'
        },
        {
          name: 'paiementId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB du paiement'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['montant'],
              properties: {
                montant: {
                  type: 'number',
                  minimum: 1,
                  example: 60000,
                  description: 'Nouveau montant'
                },
                date: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Nouvelle date du paiement'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Paiement mis à jour avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                  message: { type: 'string', example: 'Paiement mis à jour avec succès' }
                }
              }
            }
          }
        },
        400: { description: 'Données de validation invalides' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Paiement ou commande non trouvé' },
        409: { description: 'Commande annulée ou montant cumulé supérieur au prix total' }
      }
    },
    delete: {
      tags: ['Commandes'],
      summary: 'Supprimer un paiement (Admin)',
      description: 'Supprime un paiement d\'une commande et recalcule son statut de paiement.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commandeId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB de la commande'
        },
        {
          name: 'paiementId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identifiant MongoDB du paiement'
        }
      ],
      responses: {
        200: {
          description: 'Paiement supprimé avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                  message: { type: 'string', example: 'Paiement supprimé avec succès' }
                }
              }
            }
          }
        },
        400: { description: 'Identifiant invalide' },
        401: { description: 'Non authentifié' },
        403: { description: 'Non autorisé (Admin requis)' },
        404: { description: 'Paiement ou commande non trouvé' },
        409: { description: 'Impossible de supprimer un paiement d\'une commande annulée' }
      }
    }
  }
};
