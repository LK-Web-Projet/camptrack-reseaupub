import Joi from 'joi'
import { validateData } from './schemas'

// Types pour Paiement
export interface PaiementPrestataire {
  id_campagne: string
  id_prestataire: string
  paiement_base: number
  paiement_final: number
  sanction_montant: number
  statut_paiement?: boolean
  date_paiement?: string | null
}

export interface PaiementQueryParams {
  page: number
  limit: number
  id_campagne?: string
  id_prestataire?: string
  statut_paiement?: boolean
  statut?: string
}

// Schéma pour créer/mettre à jour un paiement
export const paiementCreateSchema = Joi.object({
  id_campagne: Joi.string().required().messages({
    'any.required': 'ID campagne requis'
  }),
  id_prestataire: Joi.string().required().messages({
    'any.required': 'ID prestataire requis'
  }),
  paiement_base: Joi.number().min(0).required().messages({
    'number.base': 'Le paiement de base doit être un nombre',
    'number.min': 'Le paiement de base ne peut pas être négatif',
    'any.required': 'Paiement de base requis'
  }),
  date_paiement: Joi.date().optional().allow(null).messages({
    'date.base': 'La date de paiement doit être une date valide'
  })
})

// Schéma pour les query params
export const paiementQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  id_campagne: Joi.string().optional(),
  id_prestataire: Joi.string().optional(),
  statut_paiement: Joi.boolean().optional(),
  statut: Joi.string().valid('EN_ATTENTE', 'PARTIEL', 'PAYE', 'ANNULE').optional().allow('')
})

// Schéma pour mettre à jour le statut du paiement
export const paiementUpdateStatusSchema = Joi.object({
  statut_paiement: Joi.boolean().required().messages({
    'any.required': 'Statut du paiement requis'
  }),
  date_paiement: Joi.date().required().messages({
    'date.base': 'La date de paiement doit être une date valide',
    'any.required': 'Date de paiement requise'
  })
})

// Types pour Transaction
export interface TransactionCreate {
  montant: number
  moyen_paiement?: string
  reference?: string
  note?: string
}

// Schéma pour créer une transaction
export const transactionCreateSchema = Joi.object({
  montant: Joi.number().greater(0).required().messages({
    'number.base': 'Le montant doit être un nombre',
    'number.greater': 'Le montant doit être supérieur à 0',
    'any.required': 'Montant requis'
  }),
  moyen_paiement: Joi.string().optional().allow(''),
  reference: Joi.string().optional().allow(''),
  note: Joi.string().optional().allow('')
})

export { validateData }
