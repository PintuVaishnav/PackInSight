import { NextRequest, NextResponse } from 'next/server';
import { PackageInfo, PackageAnalysis, scanPackages } from '@/lib/package-scanner';
import { db, isDatabaseAvailable, executeWithRetry } from '@/db';
import { scans } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * POST /api/scan-package
 * @summary Scan a package for security vulnerabilities and generate a trust score
 * @description Scans a package for security vulnerabilities, analyzes its dependencies, and calculates a trust score based on security, maintenance, popularity, and dependencies. Returns a scan result object with the trust score breakdown and a list of vulnerabilities found.
 * @param {NextRequest} request - The Next.js request object
 * @returns {NextResponse} - The Next.js response object
 * @throws {Error} - If there is an error during the package scan
 */
/*******  7fa9d8d7-3491-41c2-b6ed-023126ced726  *******/// ============================================
// TYPES
// ============================================

interface ScanResult {
  scanId: string;
  scanType: string;
  fileName: string;
  totalPackages: number;
  vulnerablePackages: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  packages: PackageAnalysis[];
  scanDate: string;
  createdAt: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get session safely with timeout to prevent hanging
 */
async function getSessionSafely(
  headersList: Headers,
  timeoutMs = 5000
): Promise<{ user?: { id: string } } | null> {
  try {
    const sessionPromise = auth.api.getSession({ headers: headersList });
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    const session = await Promise.race([sessionPromise, timeoutPromise]);
    return session;
  } catch (error) {
    console.warn('Failed to get session:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Save scan to database (non-blocking with retries)
 */
async function saveScanToDatabase(
  scanResult: ScanResult,
  userId: string,
  now: Date
): Promise<boolean> {
  // Check database availability first
  const dbAvailable = await isDatabaseAvailable(3000);
  if (!dbAvailable) {
    console.warn('⚠️ Database not available, skipping save');
    return false;
  }

  const result = await executeWithRetry(
    async () => {
      await db.insert(scans).values({
        id: scanResult.scanId,
        userId: userId,
        scanType: scanResult.scanType,
        packagesScanned: scanResult.totalPackages,
        vulnerabilitiesFound: scanResult.totalVulnerabilities,
        scanDate: now,
        scanResults: JSON.stringify(scanResult),
        fileName: scanResult.fileName,
        createdAt: now,
      });
      return true;
    },
    3,
    1000
  );

  return result === true;
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { packageName, ecosystem } = body;

    // Validate required fields
    if (!packageName || !ecosystem) {
      return NextResponse.json(
        { error: 'Package name and ecosystem are required' },
        { status: 400 }
      );
    }

    // Validate ecosystem
    const validEcosystems = ['npm', 'python', 'docker'];
    if (!validEcosystems.includes(ecosystem)) {
      return NextResponse.json(
        { error: 'Invalid ecosystem. Must be: npm, python, or docker' },
        { status: 400 }
      );
    }

    // Create package info
    const packageInfo: PackageInfo = {
      name: packageName,
      version: 'latest',
      ecosystem: ecosystem as 'npm' | 'python' | 'docker',
    };

    // Scan the package
    let analysisResults: PackageAnalysis[] = [];
    try {
      analysisResults = await scanPackages([packageInfo]);
    } catch (scanError) {
      console.error('Failed to scan package:', scanError);
      // Fallback: return empty analysis but continue
      analysisResults = [
        {
          package: packageInfo,
          vulnerabilities: [],
          trustScore: 0,
          trustScoreBreakdown: {
            security: 0,
            maintenance: 0,
            popularity: 0,
            dependencies: 0,
          },
          metadata: {
            description: 'Error during analysis',
          },
          aiDescription: 'Unable to generate description due to analysis error',
        },
      ];
    }

    const analysis = analysisResults[0];

    // Safely count vulnerabilities by severity
    const vulnerabilities = analysis?.vulnerabilities || [];
    const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter((v) => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter((v) => v.severity === 'low').length;

    // Create timestamps
    const now = new Date();

    // Build scan result
    const scanResult: ScanResult = {
      scanId: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scanType: ecosystem,
      fileName: `${packageName} (search)`,
      totalPackages: 1,
      vulnerablePackages: vulnerabilities.length > 0 ? 1 : 0,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      packages: [analysis],
      scanDate: now.toISOString(),
      createdAt: now.toISOString(),
    };

    // Save to database in background (non-blocking)
    const saveToDbAsync = async (): Promise<void> => {
      try {
        // Await headers() - required in Next.js 15
        const headersList = await headers();

        // Get session with timeout
        const session = await getSessionSafely(headersList, 5000);

        if (session?.user?.id) {
          console.log('SESSION USER:', session.user.id);

          const saved = await saveScanToDatabase(scanResult, session.user.id, now);

          if (saved) {
            console.log('✅ Scan saved to DB for user:', session.user.id);
          } else {
            console.warn('⚠️ Failed to save scan to DB after retries');
          }
        } else {
          console.log('ℹ️ No authenticated user, skipping DB save');
        }
      } catch (error) {
        console.error('Error in background DB save:', error);
      }
    };

    // Execute DB save without blocking response
    void saveToDbAsync();

    // Return results immediately
    return NextResponse.json(scanResult);
  } catch (error: unknown) {
    console.error('Package scan error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan package';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}