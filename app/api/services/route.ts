import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { serviceCreateSchema, validateData } from "@/lib/validation/serviceSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/services - Lister tous les services
export async function GET(request: NextRequest) {
  try {
    // Vérifier les permissions (Admin ou Superviseur)
    const authCheck = await requireAdmin(request);
    
    if (!authCheck.ok) return authCheck.response;

    // Récupérer les query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Compter le total
    const total = await prisma.service.count();

    // Récupérer les services avec pagination et statistiques
    const services = await prisma.service.findMany({
      select: {
        id_service: true,
        nom: true,
        description: true,
        created_at: true,
        _count: {
          select: {
            campagnes: true,
            prestataires: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/services - Créer un nouveau service
export async function POST(request: NextRequest) {
  try {
    // Vérifier que c'est un admin
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    
    // Validation des données
    const validation = validateData(serviceCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { nom, description } = validation.data;

    // Vérifier si un service avec le même nom existe déjà
    const existingService = await prisma.service.findFirst({
      where: { 
        nom: {
          equals: nom,
          mode: 'insensitive'
        }
      } 
    });
    
    if (existingService) {
      throw new AppError("Un service avec ce nom existe déjà", 409);
    }

    // Créer le service
    const service = await prisma.service.create({
      data: {
        nom,
        description: description || null
      },
      select: {
        id_service: true,
        nom: true,
        description: true,
        created_at: true
      }
    });

    return NextResponse.json({ 
      message: "Service créé avec succès",
      service 
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}