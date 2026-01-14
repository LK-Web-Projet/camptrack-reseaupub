import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { lieuCreateSchema, validateData } from "@/lib/validation/lieuSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/lieux - Lister tous les lieux
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const total = await prisma.lieu.count();

    const lieux = await prisma.lieu.findMany({
      select: {
        id_lieu: true,
        nom: true,
        ville: true,
        created_at: true,
        _count: {
          select: {
            campagnes: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      lieux,
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

// POST /api/lieux - Créer un nouveau lieu
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    
    const validation = validateData(lieuCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { nom, ville } = validation.data;

    // Vérifier si un lieu avec le même nom et ville existe déjà
    const existingLieu = await prisma.lieu.findFirst({
      where: { 
        nom: {
          equals: nom,
          mode: 'insensitive'
        },
        ville: {
          equals: ville,
          mode: 'insensitive'
        }
      } 
    });
    
    if (existingLieu) {
      throw new AppError("Un lieu avec ce nom et cette ville existe déjà", 409);
    }

    const lieu = await prisma.lieu.create({
      data: {
        nom,
        ville
      },
      select: {
        id_lieu: true,
        nom: true,
        ville: true,
        created_at: true
      }
    });

    return NextResponse.json({ 
      message: "Lieu créé avec succès",
      lieu 
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}