import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/campagnes/[id]/fichiers/[fichierId] - Récupérer un fichier spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fichierId: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id, fichierId } = await params; 

    const fichier = await prisma.fichierCampagne.findUnique({
      where: { 
        id_fichier: fichierId,
        id_campagne: id 
      },
      select: {
        id_fichier: true,
        nom_fichier: true,
        description: true,
        type_fichier: true,
        lien_canva_drive: true,
        date_creation: true,
        campagne: {
          select: {
            nom_campagne: true
          }
        }
      }
    });

    if (!fichier) {
      throw new AppError("Fichier non trouvé", 404);
    }

    return NextResponse.json({ fichier });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/campagnes/[id]/fichiers/[fichierId] - Supprimer un fichier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fichierId: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id, fichierId } = await params; 

    const fichier = await prisma.fichierCampagne.findUnique({
      where: { 
        id_fichier: fichierId,
        id_campagne: id 
      }
    });

    if (!fichier) {
      throw new AppError("Fichier non trouvé", 404);
    }

    await prisma.fichierCampagne.delete({
      where: { 
        id_fichier: fichierId 
      }
    });

    return NextResponse.json({
      message: "Fichier supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}