import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create a function to initialize the database connection
export function createDb(env: { DATABASE_URL: string }) {
  const client = postgres(env.DATABASE_URL, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

// Export types
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Url = typeof schema.urls.$inferSelect;
export type NewUrl = typeof schema.urls.$inferInsert;
export type UrlCheck = typeof schema.urlChecks.$inferSelect;
export type NewUrlCheck = typeof schema.urlChecks.$inferInsert; 