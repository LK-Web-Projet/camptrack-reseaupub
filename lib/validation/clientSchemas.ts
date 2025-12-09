import Joi from 'joi'
import { validateData } from './schemas'

export const clientCreateSchema = Joi.object({
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  prenom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Prénom requis'
  }),
  entreprise: Joi.string().trim().optional().allow(''),
  domaine_entreprise: Joi.string().trim().optional().allow(''),
  adresse: Joi.string().trim().optional().allow(''),
  contact: Joi.string().pattern(/^[0-9+\s()-]{6,}$/).optional(),
  mail: Joi.string().email().trim().optional().allow('').messages({
    'string.email': 'Email invalide'
  }),
  type_client: Joi.string().valid('EXTERNE', 'INTERNE').required().messages({
    'any.required': 'Type de client requis',
    'any.only': 'Le type de client doit être EXTERNE ou INTERNE'
  })
})

export const clientUpdateSchema = Joi.object({
  nom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  prenom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères'
  }),
  entreprise: Joi.string().trim().optional().allow(''),
  domaine_entreprise: Joi.string().trim().optional().allow(''),
  adresse: Joi.string().trim().optional().allow(''),
  contact: Joi.string().pattern(/^[0-9+\s()-]{6,}$/).optional(),
  mail: Joi.string().email().trim().optional().allow('').messages({
    'string.email': 'Email invalide'
  }),
  type_client: Joi.string().valid('EXTERNE', 'INTERNE').optional().messages({
    'any.only': 'Le type de client doit être EXTERNE ou INTERNE'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

export { validateData }