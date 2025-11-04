import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/hash";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; // Corrige le nom du fichier
import { updatePasswordSchema, validateData } from "@/lib/validation/schemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const userId = id;

    const body = await request.json();
    
    // VALIDATION AVEC JOI
    const validation = validateData(updatePasswordSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    const { newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: { id_user: true, email: true }
    });

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id_user: userId },
      data: { password: hashedPassword },
      select: {
        id_user: true,
        email: true,
        nom: true,
        prenom: true,
        type_user: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      message: "Mot de passe modifié avec succès",
      user: updatedUser
    });

  } catch (error) {
    return handleApiError(error);
  }
}