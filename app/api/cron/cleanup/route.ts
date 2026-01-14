import { NextResponse } from "next/server";
import { cleanupExpiredTokens } from "@/lib/auth/tokenCleanup";

export async function GET() {
  try {
    const result = await cleanupExpiredTokens();
    return NextResponse.json({
      success: true,
      message: "Nettoyage terminé",
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Échec du nettoyage"
    }, { status: 500 });
  }
}