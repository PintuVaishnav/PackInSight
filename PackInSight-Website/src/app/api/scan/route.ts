import { NextRequest, NextResponse } from 'next/server';
import {
  parsePackageJson,
  parseRequirementsTxt,
  parseDockerfile,
  scanPackages,
  PackageInfo,
  PackageAnalysis,
} from '@/lib/package-scanner';
import { db, isDatabaseAvailable, executeWithRetry } from '@/db';
import { scans } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// ============================================
// TYPES
// ============================================

interface ScanResult {
  scanId: string;
  scanType: 'npm' | 'python' | 'docker';
  fileName: string;
  totalPackages: number;
  vulnerablePackages: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  packages: PackageAnalysis[];
  timestamp: string;
  scanDate: string;
  createdAt: string;
}

console.log('SCAN API FILE LOADED');

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
 * Save scan to database with retry logic
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
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const scanType = formData.get('type') as 'npm' | 'python' | 'docker' | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate scan type
    const validScanTypes = ['npm', 'python', 'docker'];
    if (!scanType || !validScanTypes.includes(scanType)) {
      return NextResponse.json(
        { error: 'Invalid or missing scan type. Must be: npm, python, or docker' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    let packages: PackageInfo[] = [];

    // Parse based on file type
    try {
      switch (scanType) {
        case 'npm':
          packages = parsePackageJson(content);
          break;
        case 'python':
          packages = parseRequirementsTxt(content);
          break;
        case 'docker':
          packages = parseDockerfile(content);
          break;
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      const errorMessage = parseError instanceof Error
        ? parseError.message
        : 'Failed to parse file';
      return NextResponse.json(
        { error: `Parse error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Check if packages were found
    if (packages.length === 0) {
      return NextResponse.json(
        { error: 'No packages found in file' },
        { status: 400 }
      );
    }

    console.log(`Starting scan of ${packages.length} packages from ${file.name}...`);

    // Scan packages
    let packageAnalyses: PackageAnalysis[] = [];
    try {
      packageAnalyses = await scanPackages(packages);
    } catch (scanError) {
      console.error('Error scanning packages:', scanError);
      return NextResponse.json(
        { error: 'Failed to scan packages. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const vulnerablePackages = packageAnalyses.filter(
      (p) => p.vulnerabilities && p.vulnerabilities.length > 0
    ).length;

    const allVulnerabilities = packageAnalyses.flatMap(
      (p) => p.vulnerabilities || []
    );

    // Create timestamps
    const now = new Date();

    // Build scan result
    const scanResult: ScanResult = {
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      scanType,
      fileName: file.name,
      totalPackages: packages.length,
      vulnerablePackages,
      totalVulnerabilities: allVulnerabilities.length,
      criticalCount: allVulnerabilities.filter((v) => v.severity === 'critical').length,
      highCount: allVulnerabilities.filter((v) => v.severity === 'high').length,
      mediumCount: allVulnerabilities.filter((v) => v.severity === 'medium').length,
      lowCount: allVulnerabilities.filter((v) => v.severity === 'low').length,
      packages: packageAnalyses,
      timestamp: now.toISOString(),
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
            console.log('✅ SCAN SAVED TO DB');
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
    console.error('Scan error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to scan packages';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}