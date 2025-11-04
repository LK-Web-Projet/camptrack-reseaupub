import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/authMiddleware"; 
import { userUpdateSchema, validateData } from "@/lib/validation/schemas";
import { handleApiError, AppError } from "@/lib/utils/errorHandler";

// GET /api/users/[id] - Récupérer un utilisateur spécifique (ADMIN seulement)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const userId = id;

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
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

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    return NextResponse.json({ user });

  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/[id] - Modifier un utilisateur (ADMIN seulement)
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
    
    // Validation des données
    const validation = validateData(userUpdateSchema, body);
    if (!validation.success) {
      throw new AppError(validation.error, 400);
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id_user: userId }
    });

    if (!existingUser) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    // Préparer les données de mise à jour
    const updateData = { ...validation.data };
    
    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email }
      });
      
      if (emailExists) {
        throw new AppError("Un utilisateur avec cet email existe déjà", 409);
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id_user: userId },
      data: updateData,
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
      message: "Utilisateur modifié avec succès",
      user: updatedUser
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id] - Supprimer un utilisateur (ADMIN seulement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) return authCheck.response;

    const { id } = await params; 
    const userId = id;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id_user: userId }
    });

    if (!existingUser) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    // Empêcher la suppression de soi-même
    if (userId === authCheck.user.id_user) {
      throw new AppError("Vous ne pouvez pas supprimer votre propre compte", 403);
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id_user: userId }
    });

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès"
    });

  } catch (error) {
    return handleApiError(error);
  }
}