import * as yup from "yup";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createEquipementSchema = yup.object({
  designation: yup.string().trim().required("La désignation est requise"),
  type: yup.string().trim().required("Le type d'équipement est requis"),
  fournisseur: yup
    .string()
    .matches(
      objectIdRegex,
      "Le fournisseur doit être un identifiant de base de données valide",
    )
    .required("Le fournisseur est requis"),
  caracteristique: yup.string().trim().nullable(),
  prix: yup
    .number()
    .typeError("Le prix doit être un nombre")
    .positive("Le prix doit être supérieur à 0")
    .required("Le prix est requis"),
});

export const updateEquipementSchema = yup.object({
  designation: yup.string().trim(),
  type: yup.string().trim(),
  fournisseur: yup
    .string()
    .matches(
      objectIdRegex,
      "Le fournisseur doit être un identifiant de base de données valide",
    ),
  caracteristique: yup.string().trim().nullable(),
  prix: yup
    .number()
    .typeError("Le prix doit être un nombre")
    .positive("Le prix doit être supérieur à 0"),
});

export const listEquipementsQuerySchema = yup.object({
  search: yup.string().trim(), 
  type: yup.string().trim(),
  fournisseur: yup
    .string()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide"),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
