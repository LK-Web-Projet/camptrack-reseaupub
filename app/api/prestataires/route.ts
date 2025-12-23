import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { prestataireCreateSchema, validateData } from "@/lib/validation/prestataireSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/prestataires - Lister tous les prestataires
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const disponible = searchParams.get('disponible');
    const serviceId = searchParams.get('serviceId');

    // Construction du filtre
    const where: any = {};
    if (disponible !== null) {
      if (disponible === 'true') where.disponible = true;
      if (disponible === 'false') where.disponible = false;
    }
    if (serviceId) where.id_service = serviceId;

    const total = await prisma.prestataire.count({ where });

    const prestataires = await prisma.prestataire.findMany({
      where,
      select: {
        id_prestataire: true,
        nom: true,
        prenom: true,
        contact: true,
        disponible: true,
        type_panneau: true,
        couleur: true,
        marque: true,
        modele: true,
        plaque: true,
        id_verification: true,
        contrat_valide: true,
        equipe_gps: true,
        created_at: true,
        service: {
          select: {
            nom: true
          }
        },
        // Ajout de la date de fin de la dernière campagne
        affectations: {
          take: 1,
          orderBy: {
            date_creation: 'desc'
          },
          select: {
            campagne: {
              select: {
                id_campagne: true,
                nom_campagne: true,
                date_fin: true
              }
            }
          }
        },
        _count: {
          select: {
            affectations: true,
            dommages: true
          }
        }
      },
      orderBy: { nom: 'asc' },
      skip,
      take: limit
    });

    return NextResponse.json({
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

// POST /api/prestataires - Créer un nouveau prestataire
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    const validation = validateData(prestataireCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const {
      id_service,
      nom,
      prenom,
      contact,
      disponible,
      type_panneau,
      couleur,
      marque,
      modele,
      plaque,
      id_verification,
      contrat_valide,
      equipe_gps
    } = validation.data;

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { id_service }
    });
    if (!service) {
      throw new AppError("Service non trouvé", 404);
    }

    // Vérifier l'unicité de la plaque si fournie
    if (plaque) {
      const plaqueExistante = await prisma.prestataire.findFirst({
        where: { plaque }
      });
      if (plaqueExistante) {
        throw new AppError("Un prestataire avec cette plaque existe déjà", 409);
      }
    }

    // Créer le prestataire avec les infos véhicule intégrées
    const prestataire = await prisma.prestataire.create({
      data: {
        id_service,
        nom,
        prenom,
        contact,
        disponible: disponible !== undefined ? disponible : true,
        // CHAMPS VÉHICULE INTÉGRÉS
        type_panneau,
        couleur: couleur || null,
        marque: marque || null,
        modele: modele || null,
        plaque: plaque || null,
        id_verification,
        contrat_valide: contrat_valide !== undefined ? contrat_valide : null,
        equipe_gps: equipe_gps !== undefined ? equipe_gps : null
      },
      select: {
        id_prestataire: true,
        nom: true,
        prenom: true,
        contact: true,
        disponible: true,
        // Afficher aussi les infos véhicule
        type_panneau: true,
        plaque: true,
        couleur: true,
        marque: true,
        modele: true,
        id_verification: true,
        contrat_valide: true,
        equipe_gps: true,
        created_at: true,
        service: {
          select: {
            nom: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Prestataire créé avec succès",
      prestataire
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}