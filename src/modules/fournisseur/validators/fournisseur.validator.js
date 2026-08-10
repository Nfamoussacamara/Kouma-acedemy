import * as yup from 'yup';

export const createFournisseurSchema = yup.object({
  nom: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .required('Le nom du fournisseur est requis'),
  contact: yup
    .string()
    .required('Le contact (téléphone ou email) est requis'),
  adresse: yup
    .string()
    .nullable(),
});

export const updateFournisseurSchema = yup.object({
  nom: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  contact: yup
    .string(),
  adresse: yup
    .string()
    .nullable(),
});

export const toggleStatusSchema = yup.object({
  isActive: yup
  .boolean()
  .required("Le statut (isActive) est requis"),
});
