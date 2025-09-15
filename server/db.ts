import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL based on environment
const sslConfig = (() => {
  const sslMode = process.env.DATABASE_SSL || (process.env.NODE_ENV === 'production' ? 'require' : 'disable');
  
  if (sslMode === 'disable') {
    return false;
  }
  
  // Heroku PostgreSQL requires SSL but with rejectUnauthorized: false
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
  };
})();

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle({ client: pool, schema });
