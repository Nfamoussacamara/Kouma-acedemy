import * as yup from 'yup';

export const createUserSchema = yup.object({
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

export const updateUserSchema = yup.object({
  nom: yup
    .string()
    .min(2, 'Le nom doit avoir au moins 2 caractères'),
  prenom: yup
    .string()
    .min(2, 'Le prénom doit avoir au moins 2 caractères'),
  tel: yup
    .string()
    .test('is-valid-phone',
      'Numéro de téléphone invalide',
      (value) =>{
        if (!value) return true;
        return phoneNumberValidator(value);
      }
    ),

  type: yup
    .string()
    .oneOf(['Admin', 'Utilisateur'], 'Rôle invalide'),
});

export const changePasswordSchema = yup.object({
  oldPassword: yup
    .string()
    .required('Ancien mot de passe requis'),
  newPassword: yup
    .string()
    .min(8, 'Le nouveau mot de passe doit avoir au moins 8 caractères')
    .required('Nouveau mot de passe requis'),
});

export const toggleStatusSchema = yup.object({
  isActive: yup
    .boolean()
    .required('Le champ isActive est requis'),
});

