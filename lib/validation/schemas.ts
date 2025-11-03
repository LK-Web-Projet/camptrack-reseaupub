import Joi from 'joi'

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis'
  }),
  nom: Joi.string().min(2).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  prenom: Joi.string().min(2).required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Prénom requis'
  }),
  type_user: Joi.string().valid('ADMIN', 'SUPERVISEUR_CAMPAGNE', 'CONTROLEUR', 'OPERATIONNEL', 'EQUIPE').required(),
  contact: Joi.string().optional(),
  nom_utilisateur: Joi.string().optional()
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
  })
})

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