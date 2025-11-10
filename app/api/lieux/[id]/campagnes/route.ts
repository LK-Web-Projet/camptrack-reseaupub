import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/lieux/[id]/campagnes - Lister les campagnes d'un lieu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const lieuId = id;

    const lieu = await prisma.lieu.findUnique({
      where: { id_lieu: lieuId },
      select: { id_lieu: true, nom: true, ville: true }
    });

    if (!lieu) {
      throw new AppError("Lieu non trouvé", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');

    const where: any = { id_lieu: lieuId };
    if (status) {
      where.status = status;
    }

    const total = await prisma.campagne.count({ where });

    const campagnes = await prisma.campagne.findMany({
      where,
      select: {
        id_campagne: true,
        nom_campagne: true,
        description: true,
        objectif: true,
        type_campagne: true,
        date_debut: true,
        date_fin: true,
        status: true,
        date_creation: true,
        client: {
          select: {
            nom: true,
            prenom: true,
            entreprise: true
          }
        },
        service: {
          select: {
            nom: true
          }
        },
        _count: {
          select: {
            affectations: true,
            fichiers: true
          }
        }
      },
      orderBy: { date_debut: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      lieu: {
        id_lieu: lieu.id_lieu,
        nom: lieu.nom,
        ville: lieu.ville
      },
      campagnes,
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