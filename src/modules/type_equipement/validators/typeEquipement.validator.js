import * as yup from "yup";

export const createTypeEquipementSchema = yup.object({
  nom: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .required("Le nom est requis"),

  description: yup
    .string()
    .min(2, "La description doit contenir au moins 2 caracteres")
    .required("La description est requise"),
});

export const updateTypeEquipementSchema = yup.object({
  nom: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .required("Le nom est requis"),
  description: yup
    .string()
    .min(2, "La description doit contenir au moins 2 caracteres")
    .required("La description est requise"),
});

export const deleteTypeEquipementSchema = yup.object({
  id: yup.string().required("L'id est requis"),
});

export const getTypeEquipementByIdSchema = yup.object({
  id: yup.string().required("L'id est requis"),
});

export const listTypeEquipementsSchema = yup.object({
  page: yup.number().optional(),
  limit: yup.number().optional(),
  search: yup.string().optional(),
  status: yup.string().oneOf(["active", "inactive"]).optional(),
});

export const toggleStatusSchema = yup.object({
  isActive: yup.boolean().required("Le statut (isActive) est requis"),
});
