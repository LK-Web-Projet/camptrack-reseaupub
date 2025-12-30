import { Card, CardContent } from "@/components/ui/card";

interface Props {
    counts: {
        users: number;
        clients: number;
        campagnes: number;
        prestataires: number;
        lieux: number;
        services: number;
    };
}

export default function StatsCards({ counts }: Props) {
    const items = [
        { label: "Utilisateurs", value: counts.users },
        { label: "Clients", value: counts.clients },
        { label: "Campagnes", value: counts.campagnes },
        { label: "Prestataires", value: counts.prestataires },
        { label: "Lieux", value: counts.lieux },
        { label: "Services", value: counts.services },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-black dark:text-white bg-white dark:bg-gray-900">
            {items.map((item) => (
                <Card
                    key={item.label}
                    className="
            bg-white dark:bg-gray-800
            border
            rounded-xl
            shadow-sm
            hover:shadow-md
            transition
          "
                >
                    <CardContent className="flex flex-col items-center justify-center py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {item.label}
                        </p>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white">
                            {item.value}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
