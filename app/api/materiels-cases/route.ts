import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { 
  materielsCaseCreateSchema, 
  materielsCaseQuerySchema,
  validateData,
  type MaterielsCase,
  type MaterielsQueryParams
} from "@/lib/validation/materielsCaseSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/materiels-cases - Lister tous les états de matériel
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    // Récupérer et valider les query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      id_campagne: searchParams.get('id_campagne'),
      id_prestataire: searchParams.get('id_prestataire'),
      etat: searchParams.get('etat'),
      penalite_appliquer: searchParams.get('penalite_appliquer')
    };

    const validation = validateData(materielsCaseQuerySchema, queryParams);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { page, limit, id_campagne, id_prestataire, etat, penalite_appliquer } = validation.data as MaterielsQueryParams;
    const skip = (page - 1) * limit;

    // Construire le filtre WHERE
    const where: Record<string, unknown> = {};
    
    if (id_campagne) where.id_campagne = id_campagne;
    if (id_prestataire) where.id_prestataire = id_prestataire;
    if (etat) where.etat = etat;
    if (penalite_appliquer !== undefined) {
      where.penalite_appliquer = penalite_appliquer;
    }

    // Compter le total
    const total = await prisma.materielsCase.count({ where });

    // Récupérer les enregistrements avec les relations
    const materiels_cases = await prisma.materielsCase.findMany({
      where,
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true,
            client: {
              select: {
                id_client: true,
                nom: true,
                type_client: true
              }
            }
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true,
            type_panneau: true,
            plaque: true,
            marque: true,
            modele: true
          }
        }
      },
      orderBy: { date_creation: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      materiels_cases,
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

// POST /api/materiels-cases - Créer un nouvel état de matériel
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    // Valider les données d'entrée
    const validation = validateData(materielsCaseCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { 
      id_campagne, 
      id_prestataire,
      nom_materiel,
      etat, 
      description, 
      montant_penalite, 
      penalite_appliquer,
      photo_url,
      preuve_media
    } = validation.data as MaterielsCase;

    // Vérifier que la campagne existe si fournie
    if (id_campagne) {
      const campagne = await prisma.campagne.findUnique({
        where: { id_campagne },
        include: {
          client: {
            select: {
              type_client: true
            }
          }
        }
      });
      if (!campagne) {
        throw new AppError("Campagne non trouvée", 404);
      }
    }

    // Vérifier que le prestataire existe si fourni
    if (id_prestataire) {
      const prestataire = await prisma.prestataire.findUnique({
        where: { id_prestataire }
      });
      if (!prestataire) {
        throw new AppError("Prestataire non trouvé", 404);
      }
    }

    // Calculer la pénalité automatique si l'état est MAUVAIS
    let penaliteCalculee = montant_penalite;
    if (etat === 'MAUVAIS' && id_campagne) {
      const campagne = await prisma.campagne.findUnique({
        where: { id_campagne },
        include: {
          client: {
            select: {
              type_client: true
            }
          }
        }
      });

      if (campagne && campagne.client) {
        // Définir la pénalité selon le type de client
        penaliteCalculee = campagne.client.type_client === 'EXTERNE' ? 2000 : 1000;
      }
    }

    // Créer l'enregistrement
    const materiels_case = await prisma.materielsCase.create({
      data: {
        id_campagne: id_campagne || null,
        id_prestataire: id_prestataire || null,
        nom_materiel,
        etat,
        description,
        montant_penalite: penaliteCalculee,
        penalite_appliquer: penalite_appliquer || false,
        photo_url: photo_url || null,
        preuve_media: preuve_media || null
      },
      include: {
        campagne: {
          select: {
            id_campagne: true,
            nom_campagne: true
          }
        },
        prestataire: {
          select: {
            id_prestataire: true,
            nom: true,
            prenom: true,
            contact: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "État de matériel enregistré avec succès",
      materiels_case
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}