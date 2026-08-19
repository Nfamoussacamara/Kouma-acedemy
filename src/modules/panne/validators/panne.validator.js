import * as yup from "yup";

import {
  TYPE_PANNE,
  NIVEAU_URGENCE,
  SYSTEMES,
  VALID_QUERY_STATUTS,
  ALL_IMPACT_SERVICES,
  ALL_TENTATIVES,
} from "../panne.constants.js";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;


// =====================================================
// Ligne équipement — CRÉATION
// =====================================================

const createEquipementLigneSchema = yup
  .object({
    equipement: yup
      .string()
      .trim()
      .matches(
        objectIdRegex,
        "Format d'identifiant d'équipement invalide"
      )
      .nullable()
      .optional(),

    designation: yup
      .string()
      .trim()
      .nullable()
      .optional(),

    quantite: yup
      .number()
      .typeError("La quantité doit être un nombre")
      .integer("La quantité doit être un entier")
      .min(1, "La quantité doit être supérieure ou égale à 1")
      .required("La quantité est obligatoire"),

    modele: yup
      .string()
      .trim()
      .nullable()
      .optional(),

    traitement: yup
      .string()
      .trim()
      .transform((val) => (typeof val === "string" ? val.toUpperCase() : val))
      .oneOf(
        ["REMPLACEMENT", "REPARATION"],
        "Le traitement doit être REMPLACEMENT ou REPARATION"
      )
      .default("REMPLACEMENT"),
  })
  .test(
    "equipement-ou-designation",
    "Un équipement doit être sélectionné dans le catalogue ou décrit manuellement",
    (item) => {
      if (!item) return false;

      // Équipement présent dans le catalogue
      if (item.equipement) {
        return true;
      }

      // Équipement hors catalogue
      return Boolean(
        item.designation?.trim()
      );
    }
  );


// =====================================================
// Ligne équipement — MODIFICATION
// =====================================================

const updateEquipementLigneSchema = yup
  .object({
    equipement: yup
      .string()
      .trim()
      .matches(
        objectIdRegex,
        "Format d'identifiant d'équipement invalide"
      )
      .nullable()
      .optional(),

    designation: yup
      .string()
      .trim()
      .nullable()
      .optional(),

    quantite: yup
      .number()
      .typeError("La quantité doit être un nombre")
      .integer("La quantité doit être un entier")
      .min(1, "La quantité doit être supérieure ou égale à 1")
      .optional(),

    modele: yup
      .string()
      .trim()
      .nullable()
      .optional(),

    traitement: yup
      .string()
      .trim()
      .transform((val) => (typeof val === "string" ? val.toUpperCase() : val))
      .oneOf(
        ["REMPLACEMENT", "REPARATION"],
        "Le traitement doit être REMPLACEMENT ou REPARATION"
      )
      .nullable()
      .optional(),
  })
  .test(
    "equipement-ou-designation",
    "Un équipement doit être sélectionné dans le catalogue ou décrit manuellement",
    (item) => {
      if (!item) return true;

      if (item.equipement) {
        return true;
      }

      // En update, si on fournit une nouvelle ligne hors catalogue,
      // il faut pouvoir l'identifier.
      return !item.designation || item.designation.trim().length > 0;
    }
  );


// =====================================================
// CRÉATION D'UNE PANNE
// =====================================================

export const createPanneSchema = yup.object({
  description: yup
    .string()
    .trim()
    .required("Le champ description est requis"),

  type_panne: yup
    .string()
    .oneOf(TYPE_PANNE, "type_panne invalide")
    .required("Le champ type_panne est requis"),

  equipements: yup.array().when("type_panne", {
    is: "Equipement",

    then: (schema) =>
      schema
        .of(createEquipementLigneSchema)
        .min(
          1,
          "Au moins un équipement doit être renseigné pour une panne d'Équipement"
        )
        .required(
          "Le champ equipements est requis pour une panne d'Équipement"
        ),

    otherwise: (schema) =>
      schema
        .of(createEquipementLigneSchema)
        .nullable()
        .optional(),
  }),

  systeme: yup.string().when("type_panne", {
    is: "Espace/Système",

    then: (schema) =>
      schema
        .oneOf(SYSTEMES, "systeme invalide")
        .required(
          "Le champ systeme est requis pour une panne d'Espace/Système"
        ),

    otherwise: (schema) =>
      schema
        .oneOf(SYSTEMES, "systeme invalide")
        .nullable()
        .optional(),
  }),

  cause: yup
    .string()
    .trim()
    .nullable()
    .optional(),

  niveau_urgence: yup
    .string()
    .oneOf(
      NIVEAU_URGENCE,
      "niveau_urgence invalide"
    )
    .required(
      "Le champ niveau_urgence est requis"
    ),

  impact_services: yup
    .array()
    .of(
      yup
        .string()
        .oneOf(
          ALL_IMPACT_SERVICES,
          "impact_service invalide"
        )
    )
    .optional(),

  tentatives_realisees: yup
    .array()
    .of(
      yup
        .string()
        .oneOf(
          ALL_TENTATIVES,
          "tentative invalide"
        )
    )
    .optional(),

  besoin_intervention: yup
    .boolean()
    .required(
      "Le champ besoin_intervention est requis"
    ),
});


// =====================================================
// MODIFICATION D'UNE PANNE
// =====================================================

export const updatePanneSchema = yup.object({
  description: yup
    .string()
    .trim()
    .optional(),

  type_panne: yup
    .string()
    .oneOf(
      TYPE_PANNE,
      "type_panne invalide"
    )
    .optional(),

  equipements: yup
    .array()
    .of(updateEquipementLigneSchema)
    .optional(),

  systeme: yup
    .string()
    .oneOf(
      SYSTEMES,
      "systeme invalide"
    )
    .nullable()
    .optional(),

  cause: yup
    .string()
    .trim()
    .nullable()
    .optional(),

  niveau_urgence: yup
    .string()
    .oneOf(
      NIVEAU_URGENCE,
      "niveau_urgence invalide"
    )
    .optional(),

  impact_services: yup
    .array()
    .of(
      yup
        .string()
        .oneOf(
          ALL_IMPACT_SERVICES,
          "impact_service invalide"
        )
    )
    .optional(),

  tentatives_realisees: yup
    .array()
    .of(
      yup
        .string()
        .oneOf(
          ALL_TENTATIVES,
          "tentative invalide"
        )
    )
    .optional(),

  besoin_intervention: yup
    .boolean()
    .optional(),
});


// =====================================================
// FILTRE DES PANNES
// =====================================================

export const listPanneQuerySchema = yup.object({
  page: yup
    .number()
    .integer()
    .min(1)
    .default(1),

  limit: yup
    .number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  niveau_urgence: yup
    .string()
    .oneOf(NIVEAU_URGENCE)
    .optional(),

  type_panne: yup
    .string()
    .oneOf(TYPE_PANNE)
    .optional(),

  besoin_intervention: yup
    .boolean()
    .optional(),

  statut: yup
    .string()
    .oneOf(
      VALID_QUERY_STATUTS,
      "statut invalide"
    )
    .optional(),
});


// =====================================================
// CHANGEMENT DE STATUT
// =====================================================

export const toggleStatutSchema = yup.object({
  statut: yup
    .string()
    .oneOf(
      VALID_QUERY_STATUTS,
      "statut invalide"
    )
    .required("Le champ statut est requis"),
});