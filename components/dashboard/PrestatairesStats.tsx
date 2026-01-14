"use client";

import { Card } from "@/components/ui/card";

interface Props {
    prestataires: {
        total: number;
        disponibles: number;
        indisponibles: number;
    };
}

export default function PrestatairesStats({ prestataires }: Props) {
    const { disponibles, indisponibles, total } = prestataires;

    const dispoPercent = total ? (disponibles / total) * 100 : 0;
    const indispoPercent = 100 - dispoPercent;

    return (
        <Card className="relative overflow-hidden rounded-2xl p-6 shadow-lg">
            <h2 className="mb-6 text-lg font-semibold">
                Disponibilité des prestataires
            </h2>

            <div className="flex justify-center">
                {/* PIE CHART */}
                <div
                    className="group relative h-48 w-48 rounded-full"
                    style={{
                        background: `conic-gradient(
              #3b82f6 0% ${dispoPercent}%,
              #ec4899 ${dispoPercent}% 100%
            )`,
                    }}
                >
                    {/* Cercle intérieur */}
                    <div className="absolute inset-4 rounded-full " />

                    {/* Tooltip Disponible */}
                    <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 -translate-y-full rounded-md px-3 py-1 text-sm group-hover:block">
                        🔵 Disponibles : {disponibles}
                    </div>

                    {/* Tooltip Indisponible */}
                    <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-full rounded-md px-3 py-1 text-sm group-hover:block">
                        🌸 Indisponibles : {indisponibles}
                    </div>
                </div>
            </div>

            {/* LÉGENDE */}
            <div className="mt-6 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span>Disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-pink-500" />
                    <span>Indisponibles</span>
                </div>
            </div>
        </Card>
    );
}
