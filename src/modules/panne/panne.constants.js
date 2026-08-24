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

export const STRUCTURE_SANITAIRE = [
  "HOPITAL REGIONAL DE LABE",
  "HOPITAL REGIONAL DE BOKE",
  "HOPITAL REGIONAL DE NZEREKORE",
  "HOPITAL PREFECTORAL DE BEYLA",
  "HOPITAL PREFECTORAL DE MANDIANA",
  "HOPITAL PREFECTORAL DE BOFFA",
  "HOPITAL PREFECTORAL DE KOUROUSSA",
  "CMC DE MATAM",
  "CMC DE RATOMA",
];


export const STRUCTURE_SANITAIRE_CODES = {
  "HOPITAL REGIONAL DE LABE": "HRL",
  "HOPITAL REGIONAL DE BOKE": "HRB",
  "HOPITAL REGIONAL DE NZEREKORE": "HRN",
  "HOPITAL PREFECTORAL DE BEYLA": "HPB",
  "HOPITAL PREFECTORAL DE MANDIANA": "HPM",
  "HOPITAL PREFECTORAL DE BOFFA": "HPBO",
  "HOPITAL PREFECTORAL DE KOUROUSSA": "HPK",
  "CMC DE MATAM": "CMC-MA",
  "CMC DE RATOMA": "CMC-RA",
};