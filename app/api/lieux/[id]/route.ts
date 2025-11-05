import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; 
import { lieuUpdateSchema, validateData } from "@/lib/validation/lieuSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/lieux/[id] - Récupérer un lieu spécifique
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
      select: {
        id_lieu: true,
        nom: true,
        ville: true,
        created_at: true,
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

    if (!lieu) {
      throw new AppError("Lieu non trouvé", 404);
    }

    return NextResponse.json({ lieu });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/lieux/[id] - Modifier un lieu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const lieuId = id;

    const body = await request.json();
    
    const validation = validateData(lieuUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const existingLieu = await prisma.lieu.findUnique({
      where: { id_lieu: lieuId }
    });

    if (!existingLieu) {
      throw new AppError("Lieu non trouvé", 404);
    }

    const updateData = { ...validation.data };
    
    // Si le nom ou la ville est modifié, vérifier qu'il n'existe pas déjà
    if ((updateData.nom && updateData.nom !== existingLieu.nom) || 
        (updateData.ville && updateData.ville !== existingLieu.ville)) {
      
      const lieuExists = await prisma.lieu.findFirst({
        where: { 
          nom: {
            equals: updateData.nom || existingLieu.nom,
            mode: 'insensitive'
          },
          ville: {
            equals: updateData.ville || existingLieu.ville,
            mode: 'insensitive'
          },
          NOT: { id_lieu: lieuId }
        }
      });
      
      if (lieuExists) {
        throw new AppError("Un lieu avec ce nom et cette ville existe déjà", 409);
      }
    }

    const updatedLieu = await prisma.lieu.update({
      where: { id_lieu: lieuId },
      data: updateData,
      select: {
        id_lieu: true,
        nom: true,
        ville: true,
        created_at: true
      }
    });

    return NextResponse.json({
      message: "Lieu modifié avec succès",
      lieu: updatedLieu
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/lieux/[id] - Supprimer un lieu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const lieuId = id;

    const existingLieu = await prisma.lieu.findUnique({
      where: { id_lieu: lieuId },
      include: {
        _count: {
          select: {
            campagnes: true
          }
        }
      }
    });

    if (!existingLieu) {
      throw new AppError("Lieu non trouvé", 404);
    }

    // Vérifier si le lieu a des campagnes
    if (existingLieu._count.campagnes > 0) {
      throw new AppError(
        "Impossible de supprimer ce lieu car il est utilisé dans des campagnes",
        400
      );
    }

    await prisma.lieu.delete({
      where: { id_lieu: lieuId }
    });

    return NextResponse.json({
      message: "Lieu supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}