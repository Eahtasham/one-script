import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
// For serverless environments, we want to avoid keeping connections open
const client = postgres(connectionString, {
    prepare: false, // Required for Supabase connection pooling
    max: 1, // Single connection for serverless
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';

// Type for the database instance
export type Database = typeof db;
