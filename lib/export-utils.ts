import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type ExportModel = 'campagne' | 'prestataire' | 'user' | 'client';

export async function exportDataToBuffer(model: ExportModel): Promise<Buffer> {
    let data: any[] = [];

    try {
        switch (model) {
            case 'campagne':
                data = await prisma.campagne.findMany({
                    include: {
                        client: { select: { nom: true, entreprise: true } },
                        lieu: { select: { nom: true, ville: true } },
                        gestionnaire: { select: { nom: true, prenom: true } },
                        service: { select: { nom: true } }
                    },
                    orderBy: { date_creation: 'desc' }
                });
                break;

            case 'prestataire':
                data = await prisma.prestataire.findMany({
                    include: {
                        service: { select: { nom: true } }
                    },
                    orderBy: { nom: 'asc' }
                });
                break;

            case 'user':
                data = await prisma.user.findMany({
                    select: {
                        id_user: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        type_user: true,
                        contact: true,
                        is_active: true,
                        created_at: true
                    },
                    orderBy: { nom: 'asc' }
                });
                break;

            case 'client':
                data = await prisma.client.findMany({
                    orderBy: { nom: 'asc' }
                });
                break;

            default:
                throw new Error(`Model ${model} not supported for export`);
        }

        if (data.length === 0) {
            // Return empty excel with headers if no data, or just empty array
        }

        // Flatten data for Excel (simple flattening)
        const flattenedData = data.map(item => {
            const flatItem: any = {};
            for (const key in item) {
                const value = item[key];

                // Handle dates
                if (value instanceof Date) {
                    flatItem[key] = value.toISOString();
                }
                // Handle nested objects (like client.nom, service.nom)
                else if (typeof value === 'object' && value !== null) {
                    for (const subKey in value) {
                        const subValue = value[subKey];
                        if (subValue instanceof Date) {
                            flatItem[`${key}_${subKey}`] = subValue.toISOString();
                        } else {
                            flatItem[`${key}_${subKey}`] = subValue;
                        }
                    }
                }
                // Handle primitive values
                else {
                    flatItem[key] = value;
                }
            }
            return flatItem;
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, model);

        // Generate buffer - ensure it's a proper Node.js Buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return Buffer.from(excelBuffer);

    } catch (error) {
        console.error("Export error:", error);
        throw new Error("Failed to generate export file");
    }
}
