import { Card } from "@/components/ui/card";

interface Props {
    parStatus: Record<string, number>;
}

const STATUSES = [
    {
        key: "PLANIFIEE",
        label: "Planifiées",
        color: "text-blue-500",
        ring: "ring-blue-500",
    },
    {
        key: "EN_COURS",
        label: "En cours",
        color: "text-orange-500",
        ring: "ring-orange-500",
    },
    {
        key: "TERMINEE",
        label: "Terminées",
        color: "text-green-500",
        ring: "ring-green-500",
    },
    {
        key: "ANNULEE",
        label: "Annulées",
        color: "text-pink-500",
        ring: "ring-pink-500",
    },
];

export default function CampagnesStatus({ parStatus }: Props) {
    return (
        <Card className="rounded-2xl p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold ">
                Campagnes par statut
            </h2>

            <div className="grid grid-cols-2 gap-6">
                {STATUSES.map((status) => {
                    const value = parStatus[status.key] ?? 0;

                    return (
                        <div
                            key={status.key}
                            className="flex flex-col items-center gap-2"
                        >
                            {/* Cercle */}
                            <div
                                className={`flex h-20 w-20 items-center justify-center rounded-full ring-4 ${status.ring}`}
                            >
                                <span className={`text-2xl font-bold ${status.color}`}>
                                    {value}
                                </span>
                            </div>

                            {/* Label */}
                            <span className="text-sm font-medium ">
                                {status.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
