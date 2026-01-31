import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Enabling pgvector extension...');

    // Use DIRECT connection for DDL
    const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not found');
    }

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log('Success: vector extension enabled.');
    } catch (e) {
        console.error('Error enabling extension:', e);
    } finally {
        await client.end();
    }
    process.exit(0);
}

main();
