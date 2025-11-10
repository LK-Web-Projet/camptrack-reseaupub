import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/clients/[id]/campagnes - Lister les campagnes d'un client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const clientId = id;

    const client = await prisma.client.findUnique({
      where: { id_client: clientId },
      select: { id_client: true, nom: true, prenom: true }
    });

    if (!client) {
      throw new AppError("Client non trouvé", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');

    const where: any = { id_client: clientId };
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
        lieu: {
          select: {
            nom: true,
            ville: true
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
      client: {
        id_client: client.id_client,
        nom: client.nom,
        prenom: client.prenom
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