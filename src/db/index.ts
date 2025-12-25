import { drizzle } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';
import * as schema from './schema';

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

interface DbConfig {
  url: string;
  authToken: string | undefined;
}

function validateEnvVars(): DbConfig {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;

  if (!url) {
    console.error('❌ Missing TURSO_CONNECTION_URL or TURSO_DATABASE_URL');

    // Use local SQLite for development if Turso URL is missing
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using local SQLite database for development');
      return { url: 'file:./local.db', authToken: undefined };
    }

    throw new Error('Database URL is required in production');
  }

  return {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  };
}

// ============================================
// CLIENT CREATION WITH TIMEOUT
// ============================================

function createDbClient(): Client {
  const { url, authToken } = validateEnvVars();
  const isLocalFile = url.startsWith('file:');

  try {
    const client = createClient({
      url,
      authToken: isLocalFile ? undefined : authToken,
    });

    return client;
  } catch (error) {
    console.error('Failed to create database client:', error);

    // Fallback to local SQLite in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Falling back to local SQLite database');
      return createClient({ url: 'file:./local.db' });
    }

    throw error;
  }
}

// ============================================
// INITIALIZE CLIENT AND DRIZZLE
// ============================================

let client: Client;

try {
  client = createDbClient();
} catch (error) {
  console.error('Database initialization failed:', error);
  // Last resort fallback
  client = createClient({ url: 'file:./local.db' });
}

// Create drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;

// ============================================
// DATABASE UTILITY FUNCTIONS
// ============================================

/**
 * Test database connection
 * @returns true if connection is successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await client.execute('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Check if database is available with timeout
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns true if database responds within timeout
 */
export async function isDatabaseAvailable(timeoutMs = 5000): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    const queryPromise = client.execute('SELECT 1');

    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result !== null;
  } catch (error) {
    console.warn('Database availability check failed:', error);
    return false;
  }
}

/**
 * Execute a database operation with retry logic
 * @param operation - The async operation to execute
 * @param retries - Number of retry attempts (default: 3)
 * @param delayMs - Initial delay between retries in ms (default: 1000)
 * @returns The operation result or null if all retries failed
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`Database operation failed (attempt ${attempt}/${retries}): ${errorMessage}`);

      if (isLastAttempt) {
        console.error('All retry attempts exhausted');
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Get database info for debugging (hides sensitive data)
 */
export function getDatabaseInfo(): {
  type: 'local-sqlite' | 'turso';
  url: string;
  hasAuthToken: boolean;
} {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL || 'file:./local.db';
  const isLocal = url.startsWith('file:');

  return {
    type: isLocal ? 'local-sqlite' : 'turso',
    url: isLocal ? url : url.replace(/\/\/.*@/, '//***@'), // Hide credentials
    hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
  };
}