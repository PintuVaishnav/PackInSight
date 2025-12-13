import { NextRequest, NextResponse } from 'next/server';
import { 
  parsePackageJson, 
  parseRequirementsTxt, 
  parseDockerfile,
  scanPackages,
  ScanResult,
  PackageInfo
} from '@/lib/package-scanner';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scanType = formData.get('type') as 'npm' | 'python' | 'docker';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const content = await file.text();
    let packages: PackageInfo[] = [];
    
    // Parse based on file type
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
      default:
        return NextResponse.json({ error: 'Invalid scan type' }, { status: 400 });
    }
    
    if (packages.length === 0) {
      return NextResponse.json({ error: 'No packages found in file' }, { status: 400 });
    }
    
    // Scan packages
    const packageAnalyses = await scanPackages(packages);
    
    // Calculate statistics
    const vulnerablePackages = packageAnalyses.filter(p => p.vulnerabilities.length > 0).length;
    const allVulnerabilities = packageAnalyses.flatMap(p => p.vulnerabilities);
    
    const scanResult: ScanResult = {
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scanType,
      fileName: file.name,
      totalPackages: packages.length,
      vulnerablePackages,
      totalVulnerabilities: allVulnerabilities.length,
      criticalCount: allVulnerabilities.filter(v => v.severity === 'critical').length,
      highCount: allVulnerabilities.filter(v => v.severity === 'high').length,
      mediumCount: allVulnerabilities.filter(v => v.severity === 'medium').length,
      lowCount: allVulnerabilities.filter(v => v.severity === 'low').length,
      packages: packageAnalyses,
      timestamp: new Date(),
    };
    
    // Save to database if user is authenticated
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      
      if (session?.user) {
        await db.insert(scans).values({
          id: scanResult.scanId,
          userId: session.user.id,
          scanType: scanResult.scanType,
          packagesScanned: scanResult.totalPackages,
          vulnerabilitiesFound: scanResult.totalVulnerabilities,
          scanDate: new Date(),
          scanResults: JSON.stringify(scanResult),
          fileName: file.name,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving scan to database:', error);
      // Continue even if save fails
    }
    
    return NextResponse.json(scanResult);
  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan packages' },
      { status: 500 }
    );
  }
}
