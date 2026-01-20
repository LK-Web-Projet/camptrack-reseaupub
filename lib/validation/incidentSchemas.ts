import Joi from 'joi';
import { validateData } from './schemas';

export const incidentCreateSchema = Joi.object({
  id_prestataire: Joi.string().required().messages({
    'any.required': 'L\'ID du prestataire est requis.'
  }),
  id_type_incident: Joi.string().required().messages({
    'any.required': 'Le type d\'incident est requis.'
  }),
  date_incident: Joi.date().iso().required().messages({
    'any.required': 'La date de l\'incident est requise.',
    'date.iso': 'La date de l\'incident doit être au format ISO 8601.'
  }),
  commentaire: Joi.string().allow('').optional(),
  photos: Joi.array().items(Joi.string().uri()).optional().messages({
    'array.base': 'Les photos doivent être une liste d\'URLs.',
    'string.uri': 'Chaque photo doit être une URL valide.'
  })
});

// If an update schema is needed in the future, it would be defined here.
export const incidentUpdateSchema = Joi.object({
  id_type_incident: Joi.string().optional(),
  date_incident: Joi.date().iso().optional(),
  commentaire: Joi.string().allow('').optional(),
  photos: Joi.array().items(Joi.string().uri()).optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
});

export { validateData };

export const typeIncidentCreateSchema = Joi.object({
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom du type d\'incident doit contenir au moins 2 caractères.',
    'any.required': 'Le nom du type d\'incident est requis.'
  }),
  description: Joi.string().allow('').optional()
});
