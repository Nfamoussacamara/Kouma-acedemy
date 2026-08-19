import { ValidationError } from '../shared/errors/AppError.js';
import { ValidationError as YupValidationError } from 'yup';


export function validate(schema, source = 'body') {
  return async (req, _res, next) => {
    try {
      const validatedValue = await schema.validate(req[source], {
        abortEarly: false, //verifie tous les champs
        stripUnknown: true, //supprime les champs qui ne sont pas dans le schéma
      });
      req[source] = validatedValue;
      next();
    } catch (error) {
      if (error instanceof YupValidationError) {
        // Convertit l'erreur Yup en ValidationError (400 BAD_REQUEST)
        return next(new ValidationError(error.errors[0]));
      }
      return next(error);
    }
  };
}

export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');
