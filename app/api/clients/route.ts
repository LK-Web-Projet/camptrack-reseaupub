import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { clientCreateSchema, validateData } from "@/lib/validation/clientSchemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/clients - Lister tous les clients
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const total = await prisma.client.count();

    const clients = await prisma.client.findMany({
      select: {
        id_client: true,
        nom: true,
        prenom: true,
        entreprise: true,
        domaine_entreprise: true,
        adresse: true,
        contact: true,
        mail: true,
        type_client: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            campagnes: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      clients,
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

// POST /api/clients - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();

    const validation = validateData(clientCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { nom, prenom, entreprise, domaine_entreprise, adresse, contact, mail, type_client } = validation.data;

    // Vérifier si un client avec le même email existe déjà
    if (mail) {
      const existingClient = await prisma.client.findUnique({
        where: { mail }
      });

      if (existingClient) {
        throw new AppError("Un client avec cet email existe déjà", 409);
      }
    }

    const client = await prisma.client.create({
      data: {
        nom: nom || null,
        prenom: prenom || null,
        entreprise,
        domaine_entreprise: domaine_entreprise || null,
        adresse: adresse || null,
        contact: contact || null,
        mail: mail || null,
        type_client
      },
      select: {
        id_client: true,
        nom: true,
        prenom: true,
        entreprise: true,
        domaine_entreprise: true,
        adresse: true,
        contact: true,
        mail: true,
        type_client: true,
        created_at: true
      }
    });

    return NextResponse.json({
      message: "Client créé avec succès",
      client
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}