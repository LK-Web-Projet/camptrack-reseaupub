
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Users ---');
    const users = await prisma.user.findMany({
        select: { id_user: true, email: true, nom: true, prenom: true }
    });
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`- ${u.id_user}: ${u.email} (${u.prenom} ${u.nom}`);
    });

    console.log('\n--- Checking Notifications ---');
    const notifications = await prisma.notification.findMany();
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(n => {
        console.log(`- ID: ${n.id_notification}`);
        console.log(`  User ID: ${n.user_id}`);
        console.log(`  Type: ${n.type}`);
        console.log(`  Title: ${n.title}`);

        const userExists = users.find(u => u.id_user === n.user_id);
        if (userExists) {
            console.log(`  -> Linked to User: ${userExists.email}`);
        } else {
            console.log(`  -> ❌ Linked to UNKNOWN User ID: ${n.user_id}`);
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
