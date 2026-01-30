import Joi from 'joi'
import { validateData } from './schemas'

export const campagneCreateSchema = Joi.object({
  id_client: Joi.string().required().messages({
    'any.required': 'Client requis'
  }),
  id_lieu: Joi.string().required().messages({
    'any.required': 'Lieu requis'
  }),
  id_service: Joi.string().required().messages({
    'any.required': 'Service requis'
  }),
  nom_campagne: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom de campagne requis'
  }),
  description: Joi.string().trim().optional().allow(''),
  objectif: Joi.string().trim().optional().allow(''),
  quantite_service: Joi.number().integer().min(0).optional().messages({
    'number.base': 'La quantité de service ne peut pas être négative',
    'number.integer': 'La quantité doit être un nombre entier'
  }),
  nbr_prestataire: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Le nombre de prestataires ne peut pas être négatif',
    'number.integer': 'Le nombre doit être un entier'
  }),
  type_campagne: Joi.string().valid('MASSE', 'PROXIMITE').optional(),
  date_debut: Joi.date().iso().required().messages({
    'date.base': 'Date de début invalide',
    'any.required': 'Date de début requise'
  }),
  date_fin: Joi.date().iso().min(Joi.ref('date_debut')).required().messages({
    'date.base': 'Date de fin invalide',
    'date.min': 'La date de fin doit être après la date de début',
    'any.required': 'Date de fin requise'
  }),
  id_superviseur: Joi.string().optional().allow(null)
})

export const campagneUpdateSchema = Joi.object({
  nom_campagne: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  description: Joi.string().trim().optional().allow(''),
  objectif: Joi.string().trim().optional().allow(''),
  quantite_service: Joi.number().integer().min(0).optional().messages({
    'number.min': 'La quantité de service ne peut pas être négative',
    'number.integer': 'La quantité doit être un nombre entier'
  }),
  nbr_prestataire: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Le nombre de prestataires ne peut pas être négatif',
    'number.integer': 'Le nombre doit être un entier'
  }),
  type_campagne: Joi.string().valid('MASSE', 'PROXIMITE').optional(),
  date_debut: Joi.date().iso().optional(),
  date_fin: Joi.date().iso().optional(),
  status: Joi.string().valid('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE').optional(),
  id_superviseur: Joi.string().optional().allow(null)
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

export const campagneStatusSchema = Joi.object({
  status: Joi.string().valid('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE').required().messages({
    'any.required': 'Statut requis',
    'any.only': 'Statut invalide'
  })
})

export { validateData }