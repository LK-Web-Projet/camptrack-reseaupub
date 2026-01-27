import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = util.promisify(exec);

async function backupDatabase() {
    console.log('Starting database backup...');

    // Use DIRECT_URL if available (for Prisma Accelerate setups)
    // Otherwise fall back to DATABASE_URL
    let databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('Error: Neither DIRECT_URL nor DATABASE_URL environment variable is defined.');
        process.exit(1);
    }

    // Check if using Prisma Accelerate (prisma:// protocol)
    if (databaseUrl.startsWith('prisma://')) {
        console.error('Error: DATABASE_URL uses Prisma Accelerate format.');
        console.error('Please set DIRECT_URL environment variable with your direct PostgreSQL connection string.');
        console.error('Example: DIRECT_URL="postgresql://user:password@host:port/database"');
        process.exit(1);
    }

    // Ensure backups directory exists
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Construct pg_dump command
    // Note: We use the connection string directly with pg_dump
    // Try to use the explicit path found on the system
    const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"`;
    const command = `${pgDumpPath} "${databaseUrl}" -f "${filepath}"`;

    try {
        console.log(`Executing: pg_dump to ${filename}...`);
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
            // pg_dump writes some info to stderr even on success, but we log it just in case
            console.log('pg_dump output:', stderr);
        }

        console.log(`Backup completed successfully!`);
        console.log(`File saved to: ${filepath}`);

    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
}

backupDatabase();
