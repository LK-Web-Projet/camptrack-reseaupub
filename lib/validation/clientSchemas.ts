import Joi from 'joi'
import { validateData } from './schemas'

export const clientCreateSchema = Joi.object({
  nom: Joi.string().trim().allow('', null).optional(),
  prenom: Joi.string().trim().allow('', null).optional(),
  entreprise: Joi.string().trim().required().messages({
    'any.required': 'Entreprise requise',
    'string.empty': "Le nom de l'entreprise est requis"
  }),
  domaine_entreprise: Joi.string().trim().optional().allow(''),
  adresse: Joi.string().trim().optional().allow(''),
  contact: Joi.string().pattern(/^[0-9+\s()-]{6,}$/).optional().allow('', null),
  mail: Joi.string().email().trim().optional().allow('', null).messages({
    'string.email': 'Email invalide'
  }),
  type_client: Joi.string().valid('EXTERNE', 'INTERNE').required().messages({
    'any.required': 'Type de client requis',
    'any.only': 'Le type de client doit être EXTERNE ou INTERNE'
  })
})

export const clientUpdateSchema = Joi.object({
  nom: Joi.string().trim().optional().allow('', null),
  prenom: Joi.string().trim().optional().allow('', null),
  entreprise: Joi.string().trim().optional().allow('', null),
  domaine_entreprise: Joi.string().trim().optional().allow('', null),
  adresse: Joi.string().trim().optional().allow('', null),
  contact: Joi.string().pattern(/^[0-9+\s()-]{6,}$/).optional().allow('', null),
  mail: Joi.string().email().trim().optional().allow('', null).messages({
    'string.email': 'Email invalide'
  }),
  type_client: Joi.string().valid('EXTERNE', 'INTERNE').optional().messages({
    'any.only': 'Le type de client doit être EXTERNE ou INTERNE'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

export { validateData }