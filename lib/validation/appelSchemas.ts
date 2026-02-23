import Joi from 'joi'

export const appelCreateSchema = Joi.object({
    id_prestataire: Joi.string().required().messages({
        'any.required': 'Le prestataire est requis',
        'string.empty': 'Le prestataire est requis',
    }),
    date_appel: Joi.string().isoDate().required().messages({
        'any.required': 'La date de l\'appel est requise',
        'string.isoDate': 'Format de date invalide',
    }),
    direction: Joi.string().valid('ENTRANT', 'SORTANT').required().messages({
        'any.required': 'La direction de l\'appel est requise',
        'any.only': 'La direction doit être ENTRANT ou SORTANT',
    }),
    motif: Joi.string().min(2).required().messages({
        'any.required': 'Le motif est requis',
        'string.min': 'Le motif doit contenir au moins 2 caractères',
        'string.empty': 'Le motif est requis',
    }),
    duree_minutes: Joi.number().integer().min(0).optional().allow(null).messages({
        'number.base': 'La durée doit être un nombre',
        'number.min': 'La durée ne peut pas être négative',
    }),
    commentaire: Joi.string().optional().allow('', null),
})

export const appelUpdateSchema = Joi.object({
    id_prestataire: Joi.string().optional(),
    date_appel: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Format de date invalide',
    }),
    direction: Joi.string().valid('ENTRANT', 'SORTANT').optional().messages({
        'any.only': 'La direction doit être ENTRANT ou SORTANT',
    }),
    motif: Joi.string().min(2).optional().messages({
        'string.min': 'Le motif doit contenir au moins 2 caractères',
    }),
    duree_minutes: Joi.number().integer().min(0).optional().allow(null),
    commentaire: Joi.string().optional().allow('', null),
}).min(1).messages({
    'object.min': 'Au moins un champ doit être fourni pour la modification',
})
