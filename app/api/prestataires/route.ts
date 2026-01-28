import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { prestataireCreateSchema, validateData } from "@/lib/validation/prestataireSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/prestataires - Lister tous les prestataires avec filtres avancés
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search");
    const disponible = searchParams.get("disponible");
    const contratValide = searchParams.get("contratValide");
    const serviceId = searchParams.get("serviceId");
    const campagne = searchParams.get("campagne");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    // Construction du filtre
    const where: any = {};

    // Filtres simples
    if (disponible !== null) {
      if (disponible === "true") where.disponible = true;
      if (disponible === "false") where.disponible = false;
    }

    if (contratValide !== null) {
      if (contratValide === "true") where.contrat_valide = true;
      if (contratValide === "false") where.contrat_valide = false;
    }

    if (serviceId) {
      where.id_service = serviceId;
    }

    // Recherche textuelle améliorée
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { contact: { contains: search, mode: "insensitive" } },
        { marque: { contains: search, mode: "insensitive" } },
        { couleur: { contains: search, mode: "insensitive" } },
        { modele: { contains: search, mode: "insensitive" } },
        { plaque: { contains: search, mode: "insensitive" } },
        { id_verification: { contains: search, mode: "insensitive" } },
        { service: { nom: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Filtrer par campagne spécifique
    if (campagne) {
      where.affectations = {
        some: {
          id_campagne: campagne,
        },
      };
    }

    // Filtrer par période de campagne
    if (dateDebut || dateFin) {
      where.affectations = where.affectations || { some: {} };
      where.affectations.some.campagne = {
        AND: [
          dateDebut ? { date_debut: { gte: new Date(dateDebut) } } : {},
          dateFin ? { date_fin: { lte: new Date(dateFin) } } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      };
    }

    // Options Prisma dynamiques
    const prismaOptions: any = {
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
            nom: true,
          },
        },
        affectations: {
          take: 1,
          orderBy: {
            date_creation: "desc",
          },
          select: {
            campagne: {
              select: {
                id_campagne: true,
                nom_campagne: true,
                date_fin: true,
              },
            },
          },
        },
        _count: {
          select: {
            affectations: true,
            dommages: true,
          },
        },
      },
      orderBy: { nom: "asc" },
    };

    // Pagination OPTIONNELLE
    let pagination = null;

    if (pageParam && limitParam) {
      const page = parseInt(pageParam);
      const limit = parseInt(limitParam);
      const skip = (page - 1) * limit;

      prismaOptions.skip = skip;
      prismaOptions.take = limit;

      const total = await prisma.prestataire.count({ where });

      pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Requête finale
    const prestataires = await prisma.prestataire.findMany(prismaOptions);

    return NextResponse.json({
      prestataires,
      ...(pagination && { pagination }),
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