import * as yup from "yup";
import {
  TYPE_PANNE,
  NIVEAU_URGENCE,
  SYSTEMES,
  VALID_QUERY_STATUTS,
  ALL_IMPACT_SERVICES,
  ALL_TENTATIVES,
} from "../panne.constants.js";

export const createPanneSchema = yup
  .object({
    description: yup
      .string()
      .trim()
      .required("Le champ description est requis"),

    type_panne: yup
      .string()
      .oneOf(TYPE_PANNE, "type_panne invalide")
      .required("Le champ type_panne est requis"),

    equipement: yup.object().when("type_panne", {
      is: "Équipement",
      then: (schema) =>
        schema
          .shape({
            designation: yup
              .string()
              .trim()
              .required(
                "Le champ equipement.designation est requis pour une panne d'Équipement"
              ),
            qte: yup.number().positive("La quantité doit être supérieure à 0"),
            modele: yup.string().trim(),
          })
          .required("Le bloc equipement est requis"),
      otherwise: (schema) =>
        schema.shape({
          designation: yup.string().trim(),
          qte: yup.number().positive("La quantité doit être supérieure à 0"),
          modele: yup.string().trim(),
        }),
    }),

    systeme: yup.string().when("type_panne", {
      is: "Espace/Système",
      then: (schema) =>
        schema
          .oneOf(SYSTEMES, "systeme invalide")
          .required(
            "Le champ systeme est requis pour une panne d'Espace/Système"
          ),
      otherwise: (schema) => schema.oneOf(SYSTEMES, "systeme invalide"),
    }),

    cause: yup.string().trim(),

    niveau_urgence: yup
      .string()
      .oneOf(NIVEAU_URGENCE, "niveau_urgence invalide")
      .required("Le champ niveau_urgence est requis"),

    impact_services: yup
      .array()
      .of(yup.string().oneOf(ALL_IMPACT_SERVICES, "impact_service invalide")),

    tentatives_realisees: yup
      .array()
      .of(yup.string().oneOf(ALL_TENTATIVES, "tentative invalide")),

    besoin_intervention: yup
      .boolean()
      .required("Le champ besoin_intervention est requis"),
  })
  .test(
    "exclusivite-mutuelle",
    "Les champs equipement et systeme sont mutuellement exclusifs",
    (value) => {
      if (!value) return true;
      if (value.equipement?.designation && value.systeme) {
        return false;
      }
      return true;
    }
  );

export const updatePanneSchema = yup.object({
  description: yup.string().trim(),
  type_panne: yup.string().oneOf(TYPE_PANNE, "type_panne invalide"),
  equipement: yup.object({
    designation: yup.string().trim(),
    qte: yup.number().positive("La quantité doit être supérieure à 0"),
    modele: yup.string().trim(),
  }),
  systeme: yup.string().oneOf(SYSTEMES, "systeme invalide"),
  cause: yup.string().trim(),
  niveau_urgence: yup.string().oneOf(NIVEAU_URGENCE, "niveau_urgence invalide"),
  impact_services: yup
    .array()
    .of(yup.string().oneOf(ALL_IMPACT_SERVICES, "impact_service invalide")),
  tentatives_realisees: yup
    .array()
    .of(yup.string().oneOf(ALL_TENTATIVES, "tentative invalide")),
  besoin_intervention: yup.boolean(),
  commande_liee: yup.string().trim(),
});

export const listPanneQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  niveau_urgence: yup.string().oneOf(NIVEAU_URGENCE),
  type_panne: yup.string().oneOf(TYPE_PANNE),
  besoin_intervention: yup.boolean(),
  statut: yup.string().oneOf(VALID_QUERY_STATUTS),
});

export const toggleStatutSchema = yup.object({
  statut: yup
    .string()
    .oneOf(VALID_QUERY_STATUTS, "statut invalide")
    .required("Le champ statut est requis"),
});
