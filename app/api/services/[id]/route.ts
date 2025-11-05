import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; 
import { serviceUpdateSchema, validateData } from "@/lib/validation/serviceSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/services/[id] - Récupérer un service spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const serviceId = id;

    const service = await prisma.service.findUnique({
      where: { id_service: serviceId },
      select: {
        id_service: true,
        nom: true,
        description: true,
        created_at: true,
        prestataires: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            disponible: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' }
        },
        campagnes: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true,
            client: {
              select: {
                nom: true,
                prenom: true,
                entreprise: true
              }
            }
          },
          orderBy: { date_debut: 'desc' }
        }
      }
    });

    if (!service) {
      throw new AppError("Service non trouvé", 404);
    }

    return NextResponse.json({ service });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/services/[id] - Modifier un service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const serviceId = id;

    const body = await request.json();
    
    // Validation des données
    const validation = validateData(serviceUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    // Vérifier que le service existe
    const existingService = await prisma.service.findUnique({
      where: { id_service: serviceId }
    });

    if (!existingService) {
      throw new AppError("Service non trouvé", 404);
    }

    // Préparer les données de mise à jour
    const updateData = { ...validation.data };
    
    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.nom && updateData.nom !== existingService.nom) {
      const serviceExists = await prisma.service.findFirst({
        where: { 
          nom: {
            equals: updateData.nom,
            mode: 'insensitive'
          },
          NOT: { id_service: serviceId }
        }
      });
      
      if (serviceExists) {
        throw new AppError("Un service avec ce nom existe déjà", 409);
      }
    }

    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id_service: serviceId },
      data: updateData,
      select: {
        id_service: true,
        nom: true,
        description: true,
        created_at: true
      }
    });

    return NextResponse.json({
      message: "Service modifié avec succès",
      service: updatedService
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/services/[id] - Supprimer un service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const serviceId = id;

    // Vérifier que le service existe
    const existingService = await prisma.service.findUnique({
      where: { id_service: serviceId },
      include: {
        _count: {
          select: {
            campagnes: true,
            prestataires: true
          }
        }
      }
    });

    if (!existingService) {
      throw new AppError("Service non trouvé", 404);
    }

    // Vérifier si le service est utilisé dans des campagnes ou prestataires
    if (existingService._count.campagnes > 0 || existingService._count.prestataires > 0) {
      throw new AppError(
        "Impossible de supprimer ce service car il est utilisé dans des campagnes ou par des prestataires",
        400
      );
    }

    // Supprimer le service
    await prisma.service.delete({
      where: { id_service: serviceId }
    });

    return NextResponse.json({
      message: "Service supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}