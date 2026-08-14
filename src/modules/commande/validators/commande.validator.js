import * as yup from "yup";

const VALID_STATUSES = [
  "en_attente",
  "en_cours",
  "livrée",
  "annulée",
];

export const createCommandeSchema = yup.object({
  fournisseur: yup
    .string()
    .trim()
    .required("Le champ fournisseur est requis"),
  articles: yup
    .array()
    .of(
      yup.object({
        equipement: yup
          .string()
          .trim()
          .required("Le champ equipement est requis"),
        quantiteCommandee: yup
          .number()
          .positive("La quantité commandée doit être supérieure à 0")
          .required("Le champ quantiteCommandee est requis"),
      })
    )
    .min(1, "La commande doit contenir au moins un article")
    .required("Le champ articles est requis"),
});

export const updateCommandeSchema = yup.object({
  fournisseur: yup.string().trim(),
  articles: yup
    .array()
    .of(
      yup.object({
        equipement: yup
          .string()
          .trim()
          .required("Le champ equipement est requis"),
        quantiteCommandee: yup
          .number()
          .positive("La quantité commandée doit être supérieure à 0")
          .required("Le champ quantiteCommandee est requis"),
      })
    )
    .min(1, "La commande doit contenir au moins un article"),
});

export const listCommandeQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  search: yup.string().trim(),
  status: yup.string().oneOf(VALID_STATUSES),
});

export const toggleStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(VALID_STATUSES)
    .required("Le champ status est requis"),
});
