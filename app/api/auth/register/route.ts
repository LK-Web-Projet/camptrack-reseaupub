import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/hash";
import { requireAdmin } from "@/lib/middleware/authMiddleware";
import { registerSchema, validateData } from "@/lib/validation/schemas";
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

export async function POST(req: Request) {
  try {
    // Vérifier que c'est un admin
    const authCheck = await requireAdmin(req);
    if (!authCheck.ok) return authCheck.response;

    const body = await req.json();
    
    // VALIDATION AVEC JOI
    const validation = validateData<RegisterData>(registerSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { email, password, nom, prenom, type_user, contact } = validation.data;

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Cet email est déjà utilisé", 409);
    }

    // Hasher le mot de passe et créer l'utilisateur
    const pwdHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: pwdHash,
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
        created_at: true 
      },
    });

    return NextResponse.json({ user }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}