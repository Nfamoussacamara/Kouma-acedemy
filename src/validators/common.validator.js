import * as yup from 'yup';

/** Identifiant MongoDB ObjectId (24 caractères hex). */
export const objectIdSchema = yup
  .string()
  .matches(/^[a-f\d]{24}$/i, 'Format d\'identifiant MongoDB invalide')
  .required('L\'identifiant est requis');

export const idParamSchema = yup.object({
  id: objectIdSchema,
});

export const paginationQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});
