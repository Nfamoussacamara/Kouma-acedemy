import * as yup from 'yup';
import { phoneNumberValidator } from '../../../shared/utils/phone.util.js';
import { STRUCTURE_SANITAIRE } from '../../panne/panne.constants.js';
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
  structure_sanitaire: yup
    .string()
    .oneOf(STRUCTURE_SANITAIRE, 'Structure sanitaire invalide')
    .required('Structure sanitaire requise')
    .transform((value) => (value ? value.toUpperCase() : value)),
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
      (value) => {
        if (!value) return true;
        return phoneNumberValidator(value);
      }
    ),

  type: yup
    .string()
    .oneOf(['Admin', 'Utilisateur'], 'Rôle invalide'),

  structure_sanitaire: yup
    .string()
    .oneOf(STRUCTURE_SANITAIRE, 'Structure sanitaire invalide')
    .optional()
    .transform((value) => (value ? value.toUpperCase() : value)),
});

export const changePasswordSchema = yup.object({
  oldPassword: yup
    .string()
    .required('Ancien mot de passe requis'),
  newPassword: yup
    .string()
    .min(8, 'Le nouveau mot de passe doit avoir au moins 8 caractères')
    .required('Nouveau mot de passe requis')
});

export const toggleStatusSchema = yup.object({
  isActive: yup
    .boolean()
    .required('Le champ isActive est requis'),
});