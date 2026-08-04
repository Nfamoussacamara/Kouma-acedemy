import { ValidationError } from '../shared/errors/AppError.js';

/**
 * Valide req.body, req.query, ou req.params contre un schéma Yup.
 * @param {import('yup').Schema} schema
 * @param {'body'|'query'|'params'} source
 */
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
      if (error.name === 'ValidationError') {
        const details = error.inner.map((err) => ({
          field: err.path || '',
          message: err.message,
        }));
        return next(new ValidationError('Validation échouée', details));
      }
      next(error);
    }
  };
}

export const validateBody = (schema) => validate(schema, 'body'); 
export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');
