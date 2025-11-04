import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { userCreateSchema, validateData } from "@/lib/validation/schemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";
type RegisterData = {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  type_user: "ADMIN" | "SUPERVISEUR_CAMPAGNE" | "CONTROLEUR" | "OPERATIONNEL" | "EQUIPE";
  contact?: string;
  nom_utilisateur?: string;
};

// GET /api/users - Lister tous les utilisateurs (ADMIN seulement)
export async function GET(request: NextRequest) {
  try {
    // Vérifier que c'est un admin
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    // Récupérer les query params pour la pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Compter le total d'utilisateurs
    const total = await prisma.user.count();

    // Récupérer les utilisateurs avec pagination
    const users = await prisma.user.findMany({
      select: {
        id_user: true,
        email: true,
        nom: true,
        prenom: true,
        type_user: true,
        contact: true,
        nom_utilisateur: true,
        is_active: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      users,
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

// POST /api/users - Créer un nouvel utilisateur (ADMIN seulement)
export async function POST(request: NextRequest) {
  try {
    // Vérifier que c'est un admin
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const body = await request.json();
    
    // Validation des données
    const validation = validateData<RegisterData>(userCreateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { email, password, nom, prenom, type_user, contact } = validation.data;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (existingUser) {
      throw new AppError("Un utilisateur avec cet email existe déjà", 409);
    }

    // Hasher le mot de passe
    const { hashPassword } = await import('@/lib/auth/hash');
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        type_user,
        contact: contact || "",
        nom_utilisateur: email.split('@')[0],
      },
      select: {
        id_user: true,
        email: true,
        nom: true,
        prenom: true,
        type_user: true,
        contact: true,
        nom_utilisateur: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({ 
      message: "Utilisateur créé avec succès",
      user 
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}