import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { prestataireUpdateSchema, validateData } from "@/lib/validation/prestataireSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
import { Prisma, TypePanneau } from "@prisma/client";

interface PrestataireUpdateInput {
  id_service?: string;
  nom?: string;
  prenom?: string;
  contact?: string;
  disponible?: boolean;
  type_panneau?: TypePanneau | null;
  couleur?: string | null;
  marque?: string | null;
  modele?: string | null;
  plaque?: string | null;
  id_verification?: string | null;
  contrat_valide?: boolean | null;
  equipe_gps?: boolean | null;
}

// GET /api/prestataires/[id] - Détails d'un prestataire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const prestataireId = id;

    const prestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire: prestataireId },
      select: {
        id_prestataire: true,
        nom: true,
        prenom: true,
        contact: true,
        disponible: true,
        // CHAMPS VÉHICULE INTÉGRÉS
        type_panneau: true,
        couleur: true,
        marque: true,
        modele: true,
        plaque: true,
        id_verification: true,
        created_at: true,
        updated_at: true,
        // @ts-expect-error -- Known Prisma issue with relation typing
        photos: true,
        fichiers: true,
        service: {
          select: {
            id_service: true,
            nom: true,
            description: true
          }
        },
        affectations: {
          select: {
            campagne: {
              select: {
                id_campagne: true,
                nom_campagne: true,
                date_debut: true,
                date_fin: true,
                status: true
              }
            },
            date_creation: true,
            status: true
          },
          orderBy: { date_creation: 'desc' }
        },
        dommages: {
          select: {
            id_materiels_case: true,
            etat: true,
            description: true,
            montant_penalite: true,
            penalite_appliquer: true,
            date_creation: true,
            campagne: {
              select: {
                nom_campagne: true
              }
            }
          },
          orderBy: { date_creation: 'desc' }
        },
        _count: {
          select: {
            affectations: true,
            dommages: true
          }
        }
      }
    });

    if (!prestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    return NextResponse.json({ prestataire });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/prestataires/[id] - Modifier un prestataire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const prestataireId = id;

    const body = await request.json();

    const validation = validateData<PrestataireUpdateInput>(prestataireUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const data = validation.data;

    const existingPrestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire: prestataireId }
    });

    if (!existingPrestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    // Vérifier le service si modification
    if (data.id_service) {
      const service = await prisma.service.findUnique({
        where: { id_service: data.id_service }
      });
      if (!service) {
        throw new AppError("Service non trouvé", 404);
      }
    }

    // Vérifier l'unicité de la plaque si modifiée
    if (data.plaque && data.plaque !== existingPrestataire.plaque) {
      const plaqueExistante = await prisma.prestataire.findFirst({
        where: {
          plaque: data.plaque,
          id_prestataire: { not: prestataireId }
        }
      });
      if (plaqueExistante) {
        throw new AppError("Un autre prestataire avec cette plaque existe déjà", 409);
      }
    }

    const updatedPrestataire = await prisma.prestataire.update({
      where: { id_prestataire: prestataireId },
      data: {
        ...(data.nom && { nom: data.nom }),
        ...(data.prenom && { prenom: data.prenom }),
        ...(data.contact && { contact: data.contact }),
        ...(data.disponible !== undefined && { disponible: data.disponible }),
        ...(data.id_service && { service: { connect: { id_service: data.id_service } } }),
        ...(data.type_panneau && { type_panneau: data.type_panneau }),
        ...(data.couleur && { couleur: data.couleur }),
        ...(data.marque && { marque: data.marque }),
        ...(data.modele && { modele: data.modele }),
        ...(data.plaque && { plaque: data.plaque }),
        ...(data.id_verification && { id_verification: data.id_verification }),
        ...(data.contrat_valide !== undefined && { contrat_valide: data.contrat_valide }),
        ...(data.equipe_gps !== undefined && { equipe_gps: data.equipe_gps }),
        // Gestion des photos (suppression et ajout)
        ...((body.deletedPhotoIds || body.addedPhotos) && {
          photos: {
            ...(body.deletedPhotoIds && { deleteMany: { id_photo: { in: body.deletedPhotoIds } } }),
            ...(body.addedPhotos && { create: body.addedPhotos.map((url: string) => ({ url })) })
          }
        }),
        // Gestion des fichiers (suppression et ajout)
        ...((body.deletedFileIds || body.addedFiles) && {
          fichiers: {
            ...(body.deletedFileIds && { deleteMany: { id_fichier: { in: body.deletedFileIds } } }),
            ...(body.addedFiles && {
              create: body.addedFiles.map((file: { url: string, nom: string, type: string }) => ({
                url: file.url,
                nom: file.nom,
                type: file.type
              }))
            })
          }
        })
      },
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
        created_at: true,
        updated_at: true,
        service: {
          select: {
            nom: true
          }
        },
        // @ts-expect-error -- Known Prisma issue with relation typing
        photos: true // Retourner les photos mises à jour
      }
    });

    return NextResponse.json({
      message: "Prestataire modifié avec succès",
      prestataire: updatedPrestataire
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/prestataires/[id] - Supprimer un prestataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const prestataireId = id;

    const existingPrestataire = await prisma.prestataire.findUnique({
      where: { id_prestataire: prestataireId }
    });

    if (!existingPrestataire) {
      throw new AppError("Prestataire non trouvé", 404);
    }

    // Vérifier si le prestataire a des affectations en cours
    const affectationsEnCours = await prisma.prestataireCampagne.count({
      where: {
        id_prestataire: prestataireId,
        date_fin: null // Affectations non terminées
      }
    });

    if (affectationsEnCours > 0) {
      throw new AppError(
        "Impossible de supprimer ce prestataire car il a des affectations en cours",
        400
      );
    }

    await prisma.prestataire.delete({
      where: { id_prestataire: prestataireId }
    });

    return NextResponse.json({
      message: "Prestataire supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}