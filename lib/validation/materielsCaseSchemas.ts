import Joi from 'joi'
import { validateData } from './schemas'

// Schéma pour la création d'un enregistrement MaterielsCase
export const materielsCaseCreateSchema = Joi.object({
  id_campagne: Joi.string().optional().allow(null, '').messages({
    'string.empty': 'ID campagne ne peut pas être vide'
  }),
  id_prestataire: Joi.string().optional().allow(null, '').messages({
    'string.empty': 'ID prestataire ne peut pas être vide'
  }),
  etat: Joi.string().valid('BON', 'MOYEN', 'MAUVAIS').required().messages({
    'any.only': 'L\'état doit être BON, MOYEN ou MAUVAIS',
    'any.required': 'État du matériel requis'
  }),
  description: Joi.string().min(5).trim().required().messages({
    'string.min': 'La description doit contenir au moins 5 caractères',
    'any.required': 'Description des dommages requise'
  }),
  montant_penalite: Joi.number().min(0).required().messages({
    'number.base': 'Le montant de pénalité doit être un nombre',
    'number.min': 'Le montant de pénalité ne peut pas être négatif',
    'any.required': 'Montant de pénalité requis'
  }),
  penalite_appliquer: Joi.boolean().default(false),
  photo_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'L\'URL de la photo doit être une URL valide'
  }),
  preuve_media: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'L\'URL de la preuve média doit être une URL valide'
  })
}).custom((value, helpers) => {
  // Validation personnalisée : au moins id_campagne ou id_prestataire doit être fourni
  if (!value.id_campagne && !value.id_prestataire) {
    return helpers.error('any.custom', {
      message: 'Au moins une relation (campagne ou prestataire) doit être fournie'
    })
  }
  return value
})

// Schéma pour la mise à jour d'un enregistrement MaterielsCase
export const materielsCaseUpdateSchema = Joi.object({
  id_campagne: Joi.string().optional().allow(null, '').messages({
    'string.empty': 'ID campagne ne peut pas être vide'
  }),
  id_prestataire: Joi.string().optional().allow(null, '').messages({
    'string.empty': 'ID prestataire ne peut pas être vide'
  }),
  etat: Joi.string().valid('BON', 'MOYEN', 'MAUVAIS').optional().messages({
    'any.only': 'L\'état doit être BON, MOYEN ou MAUVAIS'
  }),
  description: Joi.string().min(5).trim().optional().messages({
    'string.min': 'La description doit contenir au moins 5 caractères'
  }),
  montant_penalite: Joi.number().min(0).optional().messages({
    'number.base': 'Le montant de pénalité doit être un nombre',
    'number.min': 'Le montant de pénalité ne peut pas être négatif'
  }),
  penalite_appliquer: Joi.boolean().optional(),
  photo_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'L\'URL de la photo doit être une URL valide'
  }),
  preuve_media: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'L\'URL de la preuve média doit être une URL valide'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
}).custom((value, helpers) => {
  // Validation personnalisée : si les deux relations sont fournies, au moins une doit être non vide
  if (value.id_campagne !== undefined && value.id_prestataire !== undefined) {
    if (!value.id_campagne && !value.id_prestataire) {
      return helpers.error('any.custom', {
        message: 'Au moins une relation (campagne ou prestataire) doit être fournie'
      })
    }
  }
  return value
})

// Schéma pour les query params de filtrage
export const materielsCaseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  id_campagne: Joi.string().optional(),
  id_prestataire: Joi.string().optional(),
  etat: Joi.string().valid('BON', 'MOYEN', 'MAUVAIS').optional(),
  penalite_appliquer: Joi.boolean().optional()
})

export { validateData }