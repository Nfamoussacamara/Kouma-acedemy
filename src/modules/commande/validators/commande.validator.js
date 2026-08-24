import * as yup from "yup";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const VALID_STATUSES = [
  "brouillon",
  "emise",
  "partiellement_recue",
  "recue",
  "annulee",
  "annulée",
  "BROUILLON",
  "EMISE",
  "PARTIELLEMENT_RECUE",
  "RECUE",
  "ANNULEE",
];

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
    .optional(),

  fournisseur: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide")
    .required("Le champ fournisseur est requis"),
  equipements: yup
    .array()
    .of(equipementInputSchema)
    .min(1, "Une commande doit contenir au moins un équipement")
    .required("Le champ equipements est requis"),
  utiliserPrixCatalogue: yup
    .boolean()
    .default(false),
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
  equipements: yup
    .array()
    .of(equipementInputSchema)
    .min(1, "Une commande doit contenir au moins un équipement")
    .optional(),
});


export const listCommandeQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  search: yup.string().trim(),
  status: yup.string().oneOf(VALID_STATUSES),
  fournisseur: yup.string().trim(),
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
          .optional()
          .nullable(),
      })
    )
    .min(1, "Veuillez fournir au moins un équipement réceptionné")
    .required("Le champ equipementsRecus est requis"),
});

export const suggestEquipementsSchema = yup.object({
  equipements: yup
    .array()
    .of(
      yup.object({
        typeEquipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide")
          .nullable()
          .optional(),
        modele: yup.string()
          .trim()
          .nullable()
          .optional(),
      })
      .test(
        "equipement-non-vide",
        "Un équipement doit contenir au moins une information (modele ou type d'équipement)",
        (equipement) => !!(equipement.modele || equipement.typeEquipement)
      )
    )
    .min(1, "Le tableau equipements doit contenir au moins un équipement")
    .required("Le tableau equipements est requis"),
});

