import { NextRequest, NextResponse } from 'next/server';
import { PackageAnalysis } from '@/lib/package-scanner';

export async function POST(request: NextRequest) {
  try {
    const { analysis } = await request.json() as { analysis: PackageAnalysis };
    
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis data required' }, { status: 400 });
    }

    const { package: pkg, metadata, vulnerabilities, githubStats, downloadStats, trustScore } = analysis;

    // Fetch all available versions for the package
    let allVersions: string[] = [];
    let latestVersion = metadata.latestVersion || metadata.currentVersion;
    
    try {
      if (pkg.ecosystem === 'npm') {
        const versionResponse = await fetch(`https://registry.npmjs.org/${pkg.name}`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          allVersions = Object.keys(versionData.versions || {}).reverse();
        }
      } else if (pkg.ecosystem === 'python') {
        const versionResponse = await fetch(`https://pypi.org/pypi/${pkg.name}/json`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          allVersions = Object.keys(versionData.releases || {}).reverse();
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }

    // Fetch alternative packages based on ecosystem
    const alternatives = await fetchAlternativePackages(pkg.name, pkg.ecosystem, metadata.description);

    // Build context for AI
    const context = {
      packageName: pkg.name,
      currentVersion: metadata.currentVersion || pkg.version,
      latestVersion,
      allVersions: allVersions.slice(0, 10), // Last 10 versions
      ecosystem: pkg.ecosystem,
      vulnerabilities: vulnerabilities.map(v => ({
        severity: v.severity,
        title: v.title,
        fixedIn: v.fixedIn
      })),
      trustScore,
      githubStats: githubStats ? {
        stars: githubStats.stars,
        forks: githubStats.forks,
        openIssues: githubStats.openIssues,
        lastCommit: githubStats.lastCommit
      } : null,
      downloads: downloadStats?.lastMonth || 0,
      isDeprecated: metadata.isDeprecated || false,
      alternatives
    };

    // Generate AI insights using OpenAI
    const insights = await generatePersonalizedInsights(context);

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Package insights error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

async function fetchAlternativePackages(packageName: string, ecosystem: string, description?: string) {
  const alternatives: Array<{ name: string; reason: string; stats?: { stars: number; downloads: number } }> = [];

  try {
    if (ecosystem === 'npm') {
      // Search for similar packages
      const searchTerm = packageName.split('-')[0]; // Use first part of package name
      const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${searchTerm}&size=5`);
      
      if (response.ok) {
        const data = await response.json();
        const packages = data.objects || [];
        
        for (const item of packages) {
          if (item.package.name !== packageName) {
            // Fetch download stats for alternative
            let downloads = 0;
            try {
              const downloadResponse = await fetch(
                `https://api.npmjs.org/downloads/point/last-month/${item.package.name}`
              );
              if (downloadResponse.ok) {
                const downloadData = await downloadResponse.json();
                downloads = downloadData.downloads || 0;
              }
            } catch (e) {
              // Ignore download errors
            }

            alternatives.push({
              name: item.package.name,
              reason: item.package.description || 'Alternative package',
              stats: {
                stars: item.package.publisher?.stars || 0,
                downloads
              }
            });
            
            if (alternatives.length >= 3) break;
          }
        }
      }
    } else if (ecosystem === 'python') {
      // Search PyPI for similar packages
      const searchTerm = packageName.toLowerCase();
      const response = await fetch(`https://pypi.org/search/?q=${searchTerm}`);
      
      // For Python, we'll use a simpler approach with common alternatives
      const commonAlternatives: Record<string, string[]> = {
        'django': ['flask', 'fastapi', 'pyramid'],
        'flask': ['django', 'fastapi', 'bottle'],
        'requests': ['httpx', 'aiohttp', 'urllib3'],
        'numpy': ['cupy', 'jax', 'dask'],
        'pandas': ['polars', 'dask', 'modin'],
        'pytest': ['unittest', 'nose2', 'testify']
      };

      const alts = commonAlternatives[packageName.toLowerCase()] || [];
      for (const alt of alts.slice(0, 3)) {
        alternatives.push({
          name: alt,
          reason: `Popular alternative to ${packageName}`,
        });
      }
    } else if (ecosystem === 'docker') {
      // Common Docker image alternatives
      const commonAlternatives: Record<string, string[]> = {
        'nginx': ['apache', 'caddy', 'traefik'],
        'node': ['node-alpine', 'bun', 'deno'],
        'python': ['python-alpine', 'python-slim', 'pypy'],
        'postgres': ['postgresql', 'timescaledb', 'cockroachdb'],
        'redis': ['valkey', 'dragonfly', 'memcached'],
        'mysql': ['mariadb', 'percona', 'postgres']
      };

      const alts = commonAlternatives[packageName.toLowerCase()] || [];
      for (const alt of alts.slice(0, 3)) {
        alternatives.push({
          name: alt,
          reason: `Alternative to ${packageName}`,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching alternatives:', error);
  }

  return alternatives;
}

async function generatePersonalizedInsights(context: any): Promise<any> {
  try {
    const prompt = `Analyze this ${context.ecosystem} package and provide personalized insights:

Package: ${context.packageName}
Current Version: ${context.currentVersion}
Latest Version: ${context.latestVersion}
Recent Versions: ${context.allVersions.slice(0, 5).join(', ')}
Trust Score: ${context.trustScore}/100
Vulnerabilities: ${context.vulnerabilities.length} (${context.vulnerabilities.filter((v: any) => v.severity === 'critical' || v.severity === 'high').length} critical/high)
Stars: ${context.githubStats?.stars || 0}
Monthly Downloads: ${context.downloads}
Open Issues: ${context.githubStats?.openIssues || 0}
Deprecated: ${context.isDeprecated}

Generate a JSON response with:
1. versionRecommendation: Suggest upgrading to newer version if beneficial (mention specific version number)
2. suggestedVersion: The specific version number recommended (if applicable)
3. issuesFound: Warn about known issues with latest version if trust score is low or many vulnerabilities exist
4. safeVersion: Suggest a stable older version if newer one has issues (specific version number)
5. recommendations: Array of 2-3 specific actionable recommendations for THIS package
6. alternatives: Use these alternatives: ${JSON.stringify(context.alternatives)}

Be specific, mention actual version numbers, and personalize advice based on the package's stats.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a package security expert. Provide specific, actionable insights with version numbers. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0]?.message?.content || '{}');

    // Ensure alternatives have the fetched data
    if (aiResponse.alternatives && Array.isArray(context.alternatives)) {
      aiResponse.alternatives = context.alternatives.map((alt: any, idx: number) => ({
        ...alt,
        reason: aiResponse.alternatives[idx]?.reason || alt.reason
      }));
    }

    return aiResponse;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    
    // Fallback to rule-based insights
    return generateRuleBasedInsights(context);
  }
}

function generateRuleBasedInsights(context: any): any {
  const insights: any = {
    recommendations: []
  };

  // Version recommendation
  if (context.latestVersion && context.latestVersion !== context.currentVersion) {
    insights.versionRecommendation = `A newer version (${context.latestVersion}) is available. Consider upgrading to benefit from bug fixes and improvements.`;
    insights.suggestedVersion = context.latestVersion;
  } else {
    insights.versionRecommendation = `You're using the latest version (${context.currentVersion}). Stay updated with security patches.`;
  }

  // Issues found
  const criticalVulns = context.vulnerabilities.filter((v: any) => v.severity === 'critical' || v.severity === 'high');
  if (criticalVulns.length > 0) {
    const fixedVersions = criticalVulns.map((v: any) => v.fixedIn).filter(Boolean);
    insights.issuesFound = `${criticalVulns.length} critical/high severity vulnerabilities found in current version.`;
    
    if (fixedVersions.length > 0) {
      insights.safeVersion = fixedVersions[0];
      insights.recommendations.push(`Upgrade to version ${fixedVersions[0]} or later to fix security vulnerabilities`);
    }
  }

  // Trust score based recommendations
  if (context.trustScore < 60) {
    insights.recommendations.push('Consider alternatives due to low trust score');
    if (context.githubStats?.openIssues > 50) {
      insights.recommendations.push(`Monitor the ${context.githubStats.openIssues} open issues on GitHub`);
    }
  }

  // Deprecation warning
  if (context.isDeprecated) {
    insights.recommendations.push('This package is deprecated. Plan migration to an alternative');
  }

  // Add alternatives
  if (context.alternatives && context.alternatives.length > 0) {
    insights.alternatives = context.alternatives.slice(0, 3);
  }

  // Generic recommendations if none exist
  if (insights.recommendations.length === 0) {
    insights.recommendations = [
      'Keep the package updated to the latest version',
      'Monitor security advisories regularly',
      'Review dependencies for vulnerabilities'
    ];
  }

  return insights;
}
