import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required('Le nom d\'utilisateur est requis'),
  password: yup
    .string()
    .required('Le mot de passe est requis'),
});

export const registerSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Le nom d\'utilisateur doit avoir au moins 3 caractères')
    .required('Nom d\'utilisateur requis'),
  password: yup
    .string()
    .min(8, 'Le mot de passe doit avoir au moins 8 caractères')
    .required('Mot de passe requis'),
  nom: yup
    .string()
    .min(2, 'Le nom doit avoir au moins 2 caractères')
    .required('Nom requis'),
  prenom: yup
    .string()
    .min(2, 'Le prénom doit avoir au moins 2 caractères')
    .required('Prénom requis'),
  tel: yup
    .string()
    .required('Téléphone requis'),
  type: yup
    .string()
    .oneOf(['Admin', 'Utilisateur'], 'Rôle invalide')
    .default('Utilisateur'),
});

export const refreshSchema = yup.object({
  refreshToken: yup
    .string()
    .required('Le jeton de rafraîchissement (refreshToken) est requis'),
});
