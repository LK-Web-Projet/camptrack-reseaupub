import Joi from 'joi'

export const registerSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().min(6).trim().required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis'
  }),
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  prenom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Prénom requis'
  }),
  type_user: Joi.string().valid('ADMIN', 'SUPERVISEUR_CAMPAGNE', 'CONTROLEUR', 'OPERATIONNEL', 'EQUIPE').required(),
  contact: Joi.string().trim().optional(),
  nom_utilisateur: Joi.string().trim().optional()
})


export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Mot de passe requis'
  })
})

export const updatePasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Nouveau mot de passe requis'
  }),
  oldPassword: Joi.string().min(6).optional().messages({
    'string.min': "L'ancien mot de passe doit contenir au moins 6 caractères"
  })
})

export const userCreateSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().min(6).trim().required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis'
  }),
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  prenom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Prénom requis'
  }),
  type_user: Joi.string().valid('ADMIN', 'SUPERVISEUR_CAMPAGNE', 'CONTROLEUR', 'OPERATIONNEL', 'EQUIPE').required(),
  contact: Joi.string().trim().optional(),
  nom_utilisateur: Joi.string().trim().optional()
})


export const userUpdateSchema = Joi.object({
  email: Joi.string().email().trim().optional().messages({
    'string.email': 'Email invalide'
  }),
  nom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  prenom: Joi.string().min(2).trim().optional().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères'
  }),
  type_user: Joi.string().valid('ADMIN', 'SUPERVISEUR_CAMPAGNE', 'CONTROLEUR', 'OPERATIONNEL', 'EQUIPE').optional(),
  contact: Joi.string().trim().optional(),
  nom_utilisateur: Joi.string().trim().optional(),
  is_active: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
})

// New exports for incident schemas
export { incidentCreateSchema, incidentUpdateSchema, typeIncidentCreateSchema } from './incidentSchemas';

// Exports for appel schemas
export { appelCreateSchema, appelUpdateSchema } from './appelSchemas';

export function validateData<T>(schema: Joi.ObjectSchema, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const firstError = error.details[0]
    return { success: false, error: firstError.message }
  }

  return { success: true, data: value as T }
}