import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { clientUpdateSchema, validateData } from "@/lib/validation/clientSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/clients/[id] - Récupérer un client spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const clientId = id;

    const client = await prisma.client.findUnique({
      where: { id_client: clientId },
      select: {
        id_client: true,
        nom: true,
        prenom: true,
        entreprise: true,
        domaine_entreprise: true,
        adresse: true,
        contact: true,
        fonction_contact: true,
        commentaire: true,
        mail: true,
        type_client: true,
        created_at: true,
        updated_at: true,
        campagnes: {
          select: {
            id_campagne: true,
            nom_campagne: true,
            date_debut: true,
            date_fin: true,
            status: true,
            lieu: {
              select: {
                nom: true,
                ville: true
              }
            }
          },
          orderBy: { date_debut: 'desc' }
        }
      }
    });

    if (!client) {
      throw new AppError("Client non trouvé", 404);
    }

    return NextResponse.json({ client });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/clients/[id] - Modifier un client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const clientId = id;

    const body = await request.json();

    const validation = validateData(clientUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const existingClient = await prisma.client.findUnique({
      where: { id_client: clientId }
    });

    if (!existingClient) {
      throw new AppError("Client non trouvé", 404);
    }

    const updateData = { ...validation.data };

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.mail && updateData.mail !== existingClient.mail) {
      const clientExists = await prisma.client.findUnique({
        where: { mail: updateData.mail }
      });

      if (clientExists) {
        throw new AppError("Un client avec cet email existe déjà", 409);
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id_client: clientId },
      data: updateData,
      select: {
        id_client: true,
        nom: true,
        prenom: true,
        entreprise: true,
        domaine_entreprise: true,
        adresse: true,
        contact: true,
        fonction_contact: true,
        commentaire: true,
        mail: true,
        type_client: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      message: "Client modifié avec succès",
      client: updatedClient
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/clients/[id] - Supprimer un client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params;
    const clientId = id;

    const existingClient = await prisma.client.findUnique({
      where: { id_client: clientId },
      include: {
        _count: {
          select: {
            campagnes: true
          }
        }
      }
    });

    if (!existingClient) {
      throw new AppError("Client non trouvé", 404);
    }

    // Vérifier si le client a des campagnes
    if (existingClient._count.campagnes > 0) {
      throw new AppError(
        "Impossible de supprimer ce client car il a des campagnes associées",
        400
      );
    }

    await prisma.client.delete({
      where: { id_client: clientId }
    });

    return NextResponse.json({
      message: "Client supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}