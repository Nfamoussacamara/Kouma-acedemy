import * as yup from "yup";
import { STATUT_COMMANDE } from "../commande.constance.js";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const VALID_STATUSES = Object.values(STATUT_COMMANDE); // ["en_attente", "commandee", "recu"]

const equipementInputSchema = yup.object({
  equipement: yup
    .string()
    .trim()
    .matches(
      objectIdRegex,
      "Format d'identifiant d'équipement invalide"
    )
    .required("L'équipement est obligatoire"),
    quantiteCommandee: yup
      .number()
      .typeError("La quantité commandée doit être un nombre")
      .integer("La quantité commandée doit être un entier")
      .min(1, "La quantité commandée doit être supérieure à 0")
      .required("La quantité commandée est requise"),
    prixUnitaire: yup
      .number()
      .typeError("Le prix unitaire doit être un nombre")
      .min(0, "Le prix unitaire doit être supérieur ou égal à 0")
      .default(0),
  })

export const createCommandeSchema = yup.object({
  panne: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de panne invalide")
    .nullable()
    .optional(),

  fournisseur: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide")
    .nullable()
    .optional(),
  equipements: yup
    .array()
    .of(equipementInputSchema)
    .min(1, "Une commande doit contenir au moins un équipement")
    .required("Le champ equipements est requis"),
  utiliserPrixCatalogue: yup
    .boolean()
    .default(false),
  structure_sanitaire: yup
    .array()
    .of(yup.string().trim())
    .optional()
    .default([]),
});

export const updateCommandeSchema = yup.object({
  panne: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de panne invalide")
    .optional(),
  fournisseur: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide")
    .optional(),
  status: yup.string().oneOf(VALID_STATUSES).optional(),
  equipements: yup
    .array()
    .of(
      yup.object({
        equipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant d'équipement invalide")
          .required("L'équipement est obligatoire"),
        quantiteCommandee: yup
          .number()
          .typeError("La quantité commandée doit être un nombre")
          .integer("La quantité commandée doit être un entier")
          .min(1, "La quantité commandée doit être supérieure à 0")
          .optional(),
        quantiteValidee: yup
          .number()
          .typeError("La quantité validée doit être un nombre")
          .integer("La quantité validée doit être un entier")
          .min(1, "La quantité validée doit être supérieure à 0")
          .optional(),
        prixUnitaire: yup
          .number()
          .typeError("Le prix unitaire doit être un nombre")
          .min(0, "Le prix unitaire doit être supérieur ou égal à 0")
          .optional(),
      })
    )
    .min(1, "Une commande doit contenir au moins un équipement")
    .optional(),
});


export const listCommandeQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  search: yup.string().trim(),
  status: yup.string().oneOf(VALID_STATUSES),
  fournisseur: yup.string().trim(),
  structure_sanitaire: yup.string().trim().optional(),
  numero: yup.string().trim().optional(),
  reference: yup.string().trim().optional(),
});

export const idOrReferenceParamSchema = yup.object({
  id: yup.string().trim().required("L'identifiant ou le numéro de commande est requis"),
});

export const toggleStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(VALID_STATUSES, "Statut invalide")
    .required("Le champ status est requis"),
});

export const receptionCommandeSchema = yup.object({
  equipementsRecus: yup
    .array()
    .of(
      yup.object({
        equipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant d'équipement invalide")
          .required("L'identifiant d'équipement est requis"),
        quantiteRecue: yup
          .number()
          .typeError("La quantité reçue doit être un nombre")
          .integer("La quantité reçue doit être un entier")
          .positive("La quantité reçue doit être supérieure à 0")
          .required("La quantité reçue est requise"),
        prixUnitaire: yup
          .number()
          .typeError("Le prix unitaire doit être un nombre")
          .min(0, "Le prix unitaire doit être supérieur ou égal à 0")
          .required("Le prix unitaire est requis à la réception"),
      })
    )
    .min(1, "Veuillez fournir au moins un équipement réceptionné")
    .required("Le champ equipementsRecus est requis"),
});



export const factureParamsSchema = yup.object({
  commandeId: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de commande invalide")
    .required("L'identifiant de commande est requis"),
  receptionId: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de réception invalide")
    .required("L'identifiant de réception est requis"),
});

export const commandeIdParamSchema = yup.object({
  commandeId: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de commande invalide")
    .required("L'identifiant de commande est requis"),
});

export const paiementParamsSchema = yup.object({
  commandeId: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de commande invalide")
    .required("L'identifiant de commande est requis"),
  paiementId: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de paiement invalide")
    .required("L'identifiant de paiement est requis"),
});

export const createPaiementSchema = yup.object({
  montant: yup
    .number()
    .typeError("Le montant doit être un nombre")
    .positive("Le montant doit être supérieur à 0")
    .required("Le montant est requis"),
  date: yup
    .date()
    .typeError("La date doit être valide")
    .optional(),
});

export const updatePaiementSchema = yup.object({
  montant: yup
    .number()
    .typeError("Le montant doit être un nombre")
    .positive("Le montant doit être supérieur à 0")
    .required("Le montant est requis"),
  date: yup
    .date()
    .typeError("La date doit être valide")
    .optional(),
});


