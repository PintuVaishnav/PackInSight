import { NextRequest, NextResponse } from 'next/server';
import { PackageInfo, scanPackages } from '@/lib/package-scanner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, ecosystem } = body;

    if (!packageName || !ecosystem) {
      return NextResponse.json(
        { error: 'Package name and ecosystem are required' },
        { status: 400 }
      );
    }

    // Create a package info object
    const packageInfo: PackageInfo = {
      name: packageName,
      version: 'latest',
      ecosystem: ecosystem as 'npm' | 'python' | 'docker'
    };

    // Scan the package
    const packages = await scanPackages([packageInfo]);

    if (packages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to scan package' },
        { status: 500 }
      );
    }

    const analysis = packages[0];

    // Calculate vulnerability counts
    const criticalCount = analysis.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = analysis.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = analysis.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = analysis.vulnerabilities.filter(v => v.severity === 'low').length;

    // Create scan result
    const result = {
      scanId: `scan-${Date.now()}`,
      scanType: ecosystem,
      fileName: `${packageName} (search)`,
      totalPackages: 1,
      vulnerablePackages: analysis.vulnerabilities.length > 0 ? 1 : 0,
      totalVulnerabilities: analysis.vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      packages: [analysis],
      timestamp: new Date()
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Package scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan package' },
      { status: 500 }
    );
  }
}
