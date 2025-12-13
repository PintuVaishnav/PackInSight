import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { scanResult, reportType } = await request.json();
    
    // Mock AI-generated summary
    // In production, integrate with OpenAI API using OPENAI_API_KEY
    const summaries = {
      technical: {
        overview: `Technical Analysis Report\n\nScanned ${scanResult.totalPackages} packages with ${scanResult.totalVulnerabilities} vulnerabilities detected across ${scanResult.vulnerablePackages} packages.`,
        critical: `Found ${scanResult.criticalCount} critical vulnerabilities requiring immediate attention. These pose severe security risks.`,
        recommendations: [
          'Update all packages with critical vulnerabilities immediately',
          'Review and patch high-severity issues within 48 hours',
          'Implement automated dependency scanning in CI/CD pipeline',
          'Consider alternative packages for those with poor trust scores'
        ],
        alternatives: scanResult.packages
          .filter((p: any) => p.trustScore < 50)
          .slice(0, 3)
          .map((p: any) => ({
            package: p.package.name,
            suggestion: `Consider migrating to more secure alternatives with better maintenance records`
          }))
      },
      humanFriendly: {
        overview: `📊 Package Security Report\n\nWe checked ${scanResult.totalPackages} packages in your project and found some security concerns that need your attention.`,
        critical: scanResult.criticalCount > 0 
          ? `⚠️ ${scanResult.criticalCount} critical security issues found! These are serious and should be fixed right away.`
          : '✅ Great news! No critical security issues found.',
        recommendations: [
          '🔄 Update your vulnerable packages to the latest versions',
          '🛡️ Set up automatic security alerts for your project',
          '📚 Review the security best practices for your dependencies',
          '🔍 Regular security scans help keep your project safe'
        ],
        alternatives: scanResult.packages
          .filter((p: any) => p.trustScore < 50)
          .slice(0, 3)
          .map((p: any) => ({
            package: p.package.name,
            suggestion: `This package has a low trust score. You might want to look for better maintained alternatives.`
          }))
      }
    };
    
    const summary = reportType === 'technical' ? summaries.technical : summaries.humanFriendly;
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
