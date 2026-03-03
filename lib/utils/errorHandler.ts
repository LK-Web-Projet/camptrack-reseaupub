// lib/utils/errorHandler.ts - AVEC SUPPORT JOI
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Erreur de validation Joi
  function isJoiError(err: unknown): err is { isJoi: boolean; details?: unknown } {
    return typeof err === 'object' && err !== null && 'isJoi' in err
  }

  if (isJoiError(error)) {
    return NextResponse.json(
      {
        error: "Données invalides",
        details: error.details
      },
      { status: 400 }
    )
  }

  // Erreurs Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: "Un enregistrement avec ces données existe déjà" },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          { error: "Enregistrement non trouvé" },
          { status: 404 }
        )
      default:
        console.error('Erreur Prisma non gérée:', error.code)
    }
  }

  // Erreurs métier personnalisées (4xx) : attendues, pas besoin d'un log d'erreur rouge
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error('🔴 API Error (serveur):', error.message)
    }
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details && { details: error.details })
      },
      { status: error.statusCode }
    )
  }

  // Erreur inattendue — log complet
  console.error('🔴 API Error:', error)
  return NextResponse.json(
    { error: "Erreur interne du serveur" },
    { status: 500 }
  )
}
