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

const articleInputSchema = yup
  .object({
    equipement: yup
      .string()
      .matches(objectIdRegex, "Format d'identifiant d'équipement invalide")
      .nullable()
      .default(null),
    typeEquipement: yup
      .string()
      .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide")
      .nullable()
      .default(null),
    designation: yup.string().trim().nullable().optional(),
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
  .test(
    "equipement-ou-type",
    "Chaque article doit référencer soit un équipement, soit un type d'équipement",
    (article) => !!(article?.equipement || article?.typeEquipement)
  );

export const createCommandeSchema = yup.object({
  panne: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de panne invalide")
    .required("Le champ panne est requis"),
  fournisseur: yup
    .string()
    .trim()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide")
    .required("Le champ fournisseur est requis"),
  articles: yup
    .array()
    .of(articleInputSchema)
    .min(1, "Une commande doit contenir au moins un article")
    .required("Le champ articles est requis"),
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
  articles: yup
    .array()
    .of(articleInputSchema)
    .min(1, "Une commande doit contenir au moins un article")
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
  articlesRecus: yup
    .array()
    .of(
      yup.object({
        equipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant d'équipement invalide")
          .nullable()
          .optional(),
        typeEquipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide")
          .nullable()
          .optional(),
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
    .min(1, "Veuillez fournir au moins un article réceptionné")
    .required("Le champ articlesRecus est requis"),
});

export const suggestEquipementsSchema = yup.object({
  articles: yup
    .array()
    .of(
      yup.object({
        typeEquipement: yup
          .string()
          .trim()
          .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide")
          .nullable() 
          .optional(),
        designation: yup.string().trim().nullable().optional(),
        modele: yup.string().trim().nullable().optional(),
      })
      .test(
        "article-non-vide",
        "Un article doit contenir au moins une information (designation, modele ou type d'équipement)",
        (article) => !!(article.designation || article.modele || article.typeEquipement)
      )
    )
    .min(1, "Le tableau articles doit contenir au moins un élément")
    .required("Le tableau articles est requis"),
});

