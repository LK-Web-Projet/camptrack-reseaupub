import Joi from 'joi'
import { validateData } from './schemas'

export const serviceCreateSchema = Joi.object({
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  description: Joi.string().trim().optional().allow('')
})

export const serviceUpdateSchema = Joi.object({
  nom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  description: Joi.string().trim().optional().allow('')
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

export {validateData} 