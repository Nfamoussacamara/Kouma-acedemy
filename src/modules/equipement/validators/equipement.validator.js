import * as yup from "yup";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createEquipementSchema = yup.object({
  designation: yup
    .string()
    .trim()
    .required("La désignation est requise"),
  type: yup
    .string()
    .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide")
    .required("Le type d'équipement est requis"),
  fournisseur: yup
    .string()
    .matches(
      objectIdRegex,
      "Le fournisseur doit être un identifiant de base de données valide",
    )
    .optional()
    .nullable(),
  caracteristique: yup.string().trim().nullable(),
  modele: yup.string().trim().optional().nullable(),
  prix: yup
    .number()
    .typeError("Le prix doit être un nombre")
    .positive("Le prix doit être supérieur à 0")
    .required("Le prix est requis"),
});

export const updateEquipementSchema = yup.object({
  designation: yup.string().trim(),
  type: yup
    .string()
    .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide"),
  fournisseur: yup
    .string()
    .matches(
      objectIdRegex,
      "Le fournisseur doit être un identifiant de base de données valide",
    ),
  caracteristique: yup.string().trim().nullable(),
  modele: yup.string().trim().optional().nullable(),
  prix: yup
    .number()
    .typeError("Le prix doit être un nombre")
    .positive("Le prix doit être supérieur à 0"),
});

export const listEquipementsQuerySchema = yup.object({
  search: yup.string().trim(),
  type: yup
    .string()
    .matches(objectIdRegex, "Format d'identifiant de type d'équipement invalide"),
  fournisseur: yup
    .string()
    .matches(objectIdRegex, "Format d'identifiant de fournisseur invalide"),
  status: yup
    .string()
    .oneOf(['active', 'inactive'], "Le statut doit être 'active' ou 'inactive'"),
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
});

export const toggleStatusSchema = yup.object({
      isActive: yup
        .boolean()
        .required('Le champ isActive est requis'),
    });
    
