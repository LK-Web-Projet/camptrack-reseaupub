import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting date_fin fixes...");

    // 1. Find all assignments with null date_fin
    const assignments = await prisma.prestataireCampagne.findMany({
        where: {
            date_fin: null
        },
        include: {
            campagne: true
        }
    });

    console.log(`Found ${assignments.length} assignments to update.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
        try {
            const campagne = assignment.campagne;

            // Calculate campaign duration
            const duration = campagne.date_fin.getTime() - campagne.date_debut.getTime();

            // Calculate new end date: assignment creation date + duration
            const newDateFin = new Date(assignment.date_creation.getTime() + duration);

            // Update the assignment
            await prisma.prestataireCampagne.update({
                where: {
                    id_campagne_id_prestataire: {
                        id_campagne: assignment.id_campagne,
                        id_prestataire: assignment.id_prestataire
                    }
                },
                data: {
                    date_fin: newDateFin
                }
            });

            updatedCount++;
            if (updatedCount % 10 === 0) {
                console.log(`Updated ${updatedCount} records...`);
            }

        } catch (error) {
            console.error(`Error updating assignment for provider ${assignment.id_prestataire} in campaign ${assignment.id_campagne}:`, error);
            errorCount++;
        }
    }

    console.log("Finished!");
    console.log(`Total updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
