export const TYPE_PANNE = ["Equipement", "Espace/Système"];

export const NIVEAU_URGENCE = ["Faible", "Moyen", "Élevé", "Critique"];

export const SYSTEMES = ["BE", "Admin", "Médecin", "Pharmacie"];

export const STATUTS_PANNE = [
  "NOUVELLE",
  "EN_COURS",
  "RESOLUE",
  "CLOTUREE",
];

export const VALID_QUERY_STATUTS = [
  "nouvelle",
  "en_cours",
  "resolue",
  "cloturee",
];

export const STATUS_MAP = {
  nouvelle: "NOUVELLE",
  en_cours: "EN_COURS",
  resolue: "RESOLUE",
  cloturee: "CLOTUREE",
};

export const IMPACTS_PAR_TYPE = {
  "Equipement": [
    "Aucun impact",
    "Un service complet",
    "Arrêt des soins",
    "Autres",
  ],
  "Espace/Système": [
    "Serveur dysfonctionnel",
    "BE dysfonctionnel",
    "Un service complet",
    "Plusieurs services",
    "Arrêt des soins",
    "Autres",
  ],
};

export const ALL_IMPACT_SERVICES = [
  "Aucun impact",
  "Serveur dysfonctionnel",
  "Un service complet",
  "Plusieurs services",
  "Arrêt des soins",
  "BE dysfonctionnel",
  "Autres",
];

export const TENTATIVES_PAR_TYPE = {
  "Equipement": [
    "Redémarrage des équipements",
    "Vérification des alimentations",
    "Nettoyage",
    "Reconnexion",
    "Aucune",
  ],
  "Espace/Système": [
    "Vérification réseau",
    "Redémarrage des équipements",
    "Reconnexion",
    "Aucune",
  ],
};

export const ALL_TENTATIVES = [
  "Redémarrage des équipements",
  "Vérification des alimentations",
  "Vérification réseau",
  "Nettoyage",
  "Reconnexion",
  "Aucune",
];

export const URGENCE_ORDER = {
  Critique: 0,
  "Élevé": 1,
  Elevé: 1,
  Moyen: 2,
  Faible: 3,
};
