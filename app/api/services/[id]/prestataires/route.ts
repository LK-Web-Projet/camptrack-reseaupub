import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { Prisma } from "@prisma/client";

// GET /api/services/[id]/prestataires - Lister les prestataires d'un service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const serviceId = id;

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { id_service: serviceId },
      select: { id_service: true, nom: true }
    });

    if (!service) {
      throw new AppError("Service non trouvé", 404);
    }

    // Récupérer les query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const disponible = searchParams.get('disponible');

    // Construire le where
    const where: Prisma.PrestataireWhereInput = { id_service: serviceId };
    if (disponible !== null) {
      where.disponible = disponible === 'true';
    }

    // Compter le total
    const total = await prisma.prestataire.count({ where });

    // Récupérer les prestataires AVEC un TRI
    const prestataires = await prisma.prestataire.findMany({
      where,
      select: {
        id_prestataire: true,
        nom: true,
        prenom: true,
        contact: true,
        disponible: true,
        created_at: true,
        type_panneau: true,
        marque: true,
        modele: true,
        couleur: true,
        plaque: true,
        _count: {
          select: {
            affectations: {
              where: {
                date_fin: null
              }
            }
          }
        }
      },
      // ORDRE : Disponibles d'abord, puis par ancienneté (plus anciens en premier)
      orderBy: [
        { disponible: 'desc' }, // Les disponibles (true) viennent en premier
        { created_at: 'asc' }   // Ensuite tri par date de création (anciens d'abord)
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      service: {
        id_service: service.id_service,
        nom: service.nom
      },
      prestataires,
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