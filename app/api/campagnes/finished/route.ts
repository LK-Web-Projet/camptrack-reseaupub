import { NextResponse } from "next/server";
import { getCampaignsForUninstallation } from "@/lib/business/uninstallation";

export async function GET() {
    try {
        const campagnes = await getCampaignsForUninstallation();
        return NextResponse.json({ campagnes });
    } catch (error) {
        console.error("Erreur lors de la récupération des campagnes terminées:", error);
        return NextResponse.json(
            { message: "Erreur lors de la récupération des campagnes" },
            { status: 500 }
        );
    }
}
