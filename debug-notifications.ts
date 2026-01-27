import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Debugging Notifications ---');

        // 1. Count total notifications
        const count = await prisma.notification.count();
        console.log(`Total notifications in DB: ${count}`);

        // 2. List all notifications with user details
        const notifications = await prisma.notification.findMany({
            include: {
                user: {
                    select: {
                        id_user: true,
                        nom: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        if (notifications.length === 0) {
            console.log('No notifications found.');
        } else {
            console.log('Latest 10 notifications:');
            notifications.forEach(n => {
                console.log(`- [${n.type}] For User: ${n.user.nom} (${n.user.email}) | ID: ${n.user.id_user}`);
                console.log(`  Title: ${n.title}`);
                console.log(`  Read: ${n.is_read}`);
                console.log(`  Created: ${n.created_at}`);
                console.log('---');
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
