import Joi from 'joi'
import { validateData } from './schemas';

export const lieuCreateSchema = Joi.object({
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  ville: Joi.string().min(2).trim().required().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères',
    'any.required': 'Ville requise'
  })
})

export const lieuUpdateSchema = Joi.object({
  nom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  ville: Joi.string().min(2).trim().optional().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

export { validateData };