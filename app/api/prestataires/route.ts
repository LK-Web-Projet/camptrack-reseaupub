import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { prestataireCreateSchema, validateData } from "@/lib/validation/prestataireSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { Prisma, TypePanneau } from "@prisma/client";

async function generateNextIdOp(id_service: string, tx: Prisma.TransactionClient): Promise<string> {
  const prestataires = await tx.prestataire.findMany({
    where: { id_service },
    select: { id_verification: true }
  });

  const ids = prestataires
    .map(p => parseInt(p.id_verification || '0', 10))
    .filter(n => !isNaN(n));

  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  return (maxId + 1).toString();
}

interface PrestataireCreateInput {
  id_service: string;
  nom: string;
  prenom: string;
  contact: string;
  disponible?: boolean;
  type_panneau?: TypePanneau | null;
  couleur?: string | null;
  marque?: string | null;
  modele?: string | null;
  plaque?: string | null;
  contrat_valide?: boolean | null;
  equipe_gps?: boolean | null;
  photos?: string[];
  fichiers?: { url: string; nom: string; type: string }[];
}

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
    const where: Prisma.PrestataireWhereInput = {};

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
      // @ts-expect-error -- Complex relation filtering
      where.affectations.some.campagne = {
        AND: [
          dateDebut ? { date_debut: { gte: new Date(dateDebut) } } : {},
          dateFin ? { date_fin: { lte: new Date(dateFin) } } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      };
    }

    // Options Prisma dynamiques
    const prismaOptions: Prisma.PrestataireFindManyArgs = {
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

    const validation = validateData<PrestataireCreateInput>(prestataireCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const data = validation.data;

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
      // id_verification, // Retiré de la validation
      contrat_valide,
      equipe_gps
    } = data;

    // Utilisation d'une transaction pour garantir l'unicité et la cohérence
    const prestataire = await prisma.$transaction(async (tx) => {
      // Vérifier que le service existe
      const service = await tx.service.findUnique({
        where: { id_service }
      });
      if (!service) {
        throw new AppError("Service non trouvé", 404);
      }

      // Vérifier l'unicité de la plaque si fournie
      if (plaque) {
        const plaqueExistante = await tx.prestataire.findFirst({
          where: { plaque }
        });
        if (plaqueExistante) {
          throw new AppError("Un prestataire avec cette plaque existe déjà", 409);
        }
      }

      // Générer l'ID de vérification
      const id_verification = await generateNextIdOp(id_service, tx);

      // Créer le prestataire
      return tx.prestataire.create({
        data: {
          service: { connect: { id_service } },
          nom,
          prenom,
          contact,
          disponible: disponible !== undefined ? disponible : true,
          // CHAMPS VÉHICULE INTÉGRÉS
          type_panneau: type_panneau || null,
          couleur: couleur || null,
          marque: marque || null,
          modele: modele || null,
          plaque: plaque || null,
          id_verification, // Génération auto sécurisée
          contrat_valide: contrat_valide !== undefined ? contrat_valide : null,
          equipe_gps: equipe_gps !== undefined ? equipe_gps : null,
          ...(data.photos && data.photos.length > 0 ? {
            photos: {
              create: data.photos.map((url) => ({ url }))
            }
          } : {}),
          ...(data.fichiers && data.fichiers.length > 0 ? {
            fichiers: {
              create: data.fichiers.map((file) => ({
                url: file.url,
                nom: file.nom,
                type: file.type
              }))
            }
          } : {})
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
    });

    return NextResponse.json({
      message: "Prestataire créé avec succès",
      prestataire
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}