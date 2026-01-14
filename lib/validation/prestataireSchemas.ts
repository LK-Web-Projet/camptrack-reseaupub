import Joi from 'joi';
import { validateData } from './schemas';

export const prestataireCreateSchema = Joi.object({
  id_service: Joi.string().required().messages({
    'any.required': 'Service requis'
  }),
  nom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis'
  }),
  prenom: Joi.string().min(2).trim().required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Prénom requis'
  }),
  contact: Joi.string().trim().required().messages({
    'any.required': 'Contact requis'
  }),
  disponible: Joi.boolean().default(true),

  // CHAMPS VÉHICULE INTÉGRÉS
  type_panneau: Joi.string().valid('PETIT', 'GRAND').optional().allow(''),
  couleur: Joi.string().trim().optional().allow(''),
  marque: Joi.string().trim().optional().allow(''),
  modele: Joi.string().trim().optional().allow(''),
  plaque: Joi.string().trim().optional().allow(''),
  id_verification: Joi.string().trim().required().messages({
    'any.required': 'ID Vérification requis'
  }),
  contrat_valide: Joi.boolean().optional().allow(null),
  equipe_gps: Joi.boolean().optional().allow(null)
});

export const prestataireUpdateSchema = Joi.object({
  nom: Joi.string().min(2).trim().optional(),
  prenom: Joi.string().min(2).trim().optional(),
  contact: Joi.string().trim().optional(),
  disponible: Joi.boolean().optional(),
  id_service: Joi.string().optional(),

  // CHAMPS VÉHICULE INTÉGRÉS
  type_panneau: Joi.string().valid('PETIT', 'GRAND').optional(),
  couleur: Joi.string().trim().optional().allow(''),
  marque: Joi.string().trim().optional().allow(''),
  modele: Joi.string().trim().optional().allow(''),
  plaque: Joi.string().trim().optional().allow(''),
  id_verification: Joi.string().trim().optional(),
  contrat_valide: Joi.boolean().optional().allow(null),
  equipe_gps: Joi.boolean().optional().allow(null)
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la modification'
});

export { validateData };