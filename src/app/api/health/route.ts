import { NextResponse } from 'next/server';
import { isDatabaseAvailable, getDatabaseInfo } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  // Check database availability
  const dbAvailable = await isDatabaseAvailable(5000);
  const dbInfo = getDatabaseInfo();

  const responseTime = Date.now() - startTime;

  const health = {
    status: dbAvailable ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTimeMs: responseTime,
    database: {
      available: dbAvailable,
      type: dbInfo.type,
      hasAuthToken: dbInfo.hasAuthToken,
    },
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || '0.1.0',
  };

  return NextResponse.json(health, {
    status: dbAvailable ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}