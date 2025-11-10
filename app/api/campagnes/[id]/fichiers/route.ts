import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/campagnes/[id]/fichiers - Lister les fichiers d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const campagneId = id;

    // Vérifier que la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId },
      select: { id_campagne: true, nom_campagne: true }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    const { searchParams } = new URL(request.url);
    const typeFichier = searchParams.get('type');

    const where: any = { id_campagne: campagneId };
    if (typeFichier) {
      where.type_fichier = typeFichier;
    }

    const fichiers = await prisma.fichierCampagne.findMany({
      where,
      select: {
        id_fichier: true,
        nom_fichier: true,
        description: true,
        type_fichier: true,
        lien_canva_drive: true,
        date_creation: true
      },
      orderBy: { date_creation: 'desc' }
    });

    return NextResponse.json({
      campagne: {
        id_campagne: campagne.id_campagne,
        nom_campagne: campagne.nom_campagne
      },
      fichiers
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campagnes/[id]/fichiers - Ajouter un fichier à une campagne
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const campagneId = id;

    const body = await request.json();
    
    const { nom_fichier, description, lien_canva_drive, type_fichier } = body;

    if (!nom_fichier || !lien_canva_drive || !type_fichier) {
      throw new AppError("Nom, lien et type de fichier sont requis", 400);
    }

    // Vérifier que la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id_campagne: campagneId }
    });

    if (!campagne) {
      throw new AppError("Campagne non trouvée", 404);
    }

    // Vérifier que le type de fichier est valide
    const typesValides = ['RAPPORT_JOURNALIER', 'RAPPORT_FINAL', 'PIGE'];
    if (!typesValides.includes(type_fichier)) {
      throw new AppError("Type de fichier invalide", 400);
    }

    const fichier = await prisma.fichierCampagne.create({
      data: {
        id_campagne: campagneId,
        nom_fichier,
        description: description || null,
        lien_canva_drive,
        type_fichier
      },
      select: {
        id_fichier: true,
        nom_fichier: true,
        description: true,
        type_fichier: true,
        lien_canva_drive: true,
        date_creation: true
      }
    });

    return NextResponse.json({ 
      message: "Fichier ajouté à la campagne avec succès",
      fichier 
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}