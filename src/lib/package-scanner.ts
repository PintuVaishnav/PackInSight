// src/lib/package-scanner.ts
// Package scanning utilities and Trust Score calculation

export interface PackageInfo {
  name: string;
  version: string;
  ecosystem: 'npm' | 'python' | 'docker';
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cvss?: number;
  cwe?: string[];
  references?: string[];
  fixedIn?: string;
}

// Add to src/lib/package-scanner.ts

export interface ScanResult {
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

export interface GitHubStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  contributors: number;
  pullRequests: number;
  lastCommit: string;
  createdAt: string;
  defaultBranch: string;
  language: string;
  topics: string[];
}

export interface DownloadStats {
  lastDay?: number;
  lastWeek?: number;
  lastMonth?: number;
  total?: number;
}

export interface PackageAnalysis {
  package: PackageInfo;
  vulnerabilities: Vulnerability[];
  trustScore: number;
  trustScoreBreakdown: {
    security: number;
    maintenance: number;
    popularity: number;
    dependencies: number;
  };
  metadata: {
    description?: string;
    license?: string;
    author?: string;
    downloads?: number;
    stars?: number;
    lastPublish?: string;
    homepage?: string;
    repository?: string;
    dependencies?: Record<string, string>;
    latestVersion?: string;
    currentVersion?: string;
    isDeprecated?: boolean;
    npmUrl?: string;
    githubUrl?: string;
    officialUrl?: string;
    maintainers?: number;
    hasTests?: boolean;
    hasSecurity?: boolean;
    bundleSize?: string;
  };
  githubStats?: GitHubStats;
  downloadStats?: DownloadStats;
  aiDescription?: string;
}

// ============================================
// HELPER FUNCTIONS FOR RELIABLE API CALLS
// ============================================

/**
 * Fetch with timeout - aborts request if it takes too long
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeout = 15000
): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      return response;
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      
      if (isLastAttempt) {
        console.warn(`Fetch failed after ${retries} attempts for ${url}`);
        return null;
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = 1000 * Math.pow(2, attempt);
      console.warn(`Fetch attempt ${attempt + 1}/${retries} failed for ${url}, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Safe JSON parse from response
 */
async function safeJsonParse<T>(response: Response | null): Promise<T | null> {
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================
// PARSING FUNCTIONS
// ============================================

// Parse package.json
export function parsePackageJson(content: string): PackageInfo[] {
  try {
    const data = JSON.parse(content);
    const packages: PackageInfo[] = [];

    const deps = { ...data.dependencies, ...data.devDependencies };
    for (const [name, version] of Object.entries(deps)) {
      packages.push({
        name,
        version: (version as string).replace(/^[\^~]/, ''),
        ecosystem: 'npm'
      });
    }

    return packages;
  } catch (error) {
    throw new Error('Invalid package.json format');
  }
}

// Parse requirements.txt
export function parseRequirementsTxt(content: string): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)\s*([=<>!]=?)\s*(.+)$/);
    if (match) {
      packages.push({
        name: match[1],
        version: match[3].split(',')[0].trim(),
        ecosystem: 'python'
      });
    } else if (/^[a-zA-Z0-9\-_.]+$/.test(trimmed)) {
      packages.push({
        name: trimmed,
        version: 'latest',
        ecosystem: 'python'
      });
    }
  }

  return packages;
}

// Parse Dockerfile
export function parseDockerfile(content: string): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const fromMatch = trimmed.match(/^FROM\s+([^:\s]+):?([^\s]*)/i);

    if (fromMatch) {
      packages.push({
        name: fromMatch[1],
        version: fromMatch[2] || 'latest',
        ecosystem: 'docker'
      });
    }
  }

  return packages;
}

// ============================================
// GITHUB STATS FETCHING
// ============================================

export async function fetchGitHubStats(repoUrl: string): Promise<GitHubStats | null> {
  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PackInsight'
    };

    // Add authorization if token exists
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch repository data
    const repoResponse = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${cleanRepo}`,
      { headers },
      2,
      10000
    );

    const repoData = await safeJsonParse<any>(repoResponse);
    if (!repoData) return null;

    // Fetch contributors count
    let contributorsCount = 0;
    try {
      const contributorsResponse = await fetchWithRetry(
        `https://api.github.com/repos/${owner}/${cleanRepo}/contributors?per_page=1&anon=true`,
        { headers },
        2,
        10000
      );

      if (contributorsResponse?.ok) {
        const linkHeader = contributorsResponse.headers.get('Link');
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/);
          contributorsCount = match ? parseInt(match[1]) : 1;
        } else {
          const contributors = await safeJsonParse<any[]>(contributorsResponse);
          contributorsCount = Array.isArray(contributors) ? contributors.length : 0;
        }
      }
    } catch (e) {
      // Ignore contributors count errors
    }

    // Fetch pull requests count
    let prCount = 0;
    try {
      const prResponse = await fetchWithRetry(
        `https://api.github.com/repos/${owner}/${cleanRepo}/pulls?state=all&per_page=1`,
        { headers },
        2,
        10000
      );

      if (prResponse?.ok) {
        const linkHeader = prResponse.headers.get('Link');
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/);
          prCount = match ? parseInt(match[1]) : 0;
        }
      }
    } catch (e) {
      // Ignore PR count errors
    }

    return {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      openIssues: repoData.open_issues_count || 0,
      contributors: contributorsCount,
      pullRequests: prCount,
      lastCommit: repoData.pushed_at,
      createdAt: repoData.created_at,
      defaultBranch: repoData.default_branch,
      language: repoData.language || 'Unknown',
      topics: repoData.topics || [],
    };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return null;
  }
}

// ============================================
// DOWNLOAD STATS FETCHING
// ============================================

export async function fetchNpmDownloadStats(packageName: string): Promise<DownloadStats> {
  try {
    const encodedName = encodeURIComponent(packageName);

    // Fetch all stats in parallel with timeout
    const [dayResponse, weekResponse, monthResponse] = await Promise.all([
      fetchWithRetry(`https://api.npmjs.org/downloads/point/last-day/${encodedName}`, {}, 2, 5000),
      fetchWithRetry(`https://api.npmjs.org/downloads/point/last-week/${encodedName}`, {}, 2, 5000),
      fetchWithRetry(`https://api.npmjs.org/downloads/point/last-month/${encodedName}`, {}, 2, 5000),
    ]);

    const [dayData, weekData, monthData] = await Promise.all([
      safeJsonParse<{ downloads: number }>(dayResponse),
      safeJsonParse<{ downloads: number }>(weekResponse),
      safeJsonParse<{ downloads: number }>(monthResponse),
    ]);

    return {
      lastDay: dayData?.downloads || 0,
      lastWeek: weekData?.downloads || 0,
      lastMonth: monthData?.downloads || 0,
    };
  } catch (error) {
    console.error('Error fetching npm download stats:', error);
    return {};
  }
}

export async function fetchPypiDownloadStats(packageName: string): Promise<DownloadStats> {
  try {
    const response = await fetchWithRetry(
      `https://pypistats.org/api/packages/${packageName}/recent`,
      {},
      2,
      10000
    );

    const data = await safeJsonParse<{ data: { last_day: number; last_week: number; last_month: number } }>(response);
    if (!data) return {};

    return {
      lastDay: data.data?.last_day || 0,
      lastWeek: data.data?.last_week || 0,
      lastMonth: data.data?.last_month || 0,
    };
  } catch (error) {
    console.error('Error fetching PyPI download stats:', error);
    return {};
  }
}

// ============================================
// PACKAGE DATA FETCHING
// ============================================

export async function fetchNpmPackageData(name: string, version: string) {
  try {
    const response = await fetchWithRetry(
      `https://registry.npmjs.org/${encodeURIComponent(name)}`,
      {},
      3,
      15000
    );

    const data = await safeJsonParse<any>(response);
    if (!data) return {};

    const latestVersion = data['dist-tags']?.latest || version;
    const versionData = data.versions?.[version] || data.versions?.[latestVersion];

    const repositoryUrl = typeof data.repository === 'string'
      ? data.repository
      : data.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '');

    // Get bundle size from bundlephobia (optional, don't fail if unavailable)
    let bundleSize = undefined;
    try {
      const bundleResponse = await fetchWithRetry(
        `https://bundlephobia.com/api/size?package=${encodeURIComponent(name)}@${latestVersion}`,
        {},
        1,
        5000
      );
      const bundleData = await safeJsonParse<{ size: number }>(bundleResponse);
      if (bundleData?.size) {
        bundleSize = `${(bundleData.size / 1024).toFixed(1)} KB`;
      }
    } catch (e) {
      // Ignore bundle size errors
    }

    return {
      description: data.description,
      license: versionData?.license || data.license,
      author: data.author?.name || (typeof data.author === 'string' ? data.author : undefined),
      homepage: data.homepage,
      repository: repositoryUrl,
      dependencies: versionData?.dependencies || {},
      lastPublish: data.time?.[version] || data.time?.modified,
      latestVersion,
      currentVersion: version,
      isDeprecated: !!data.deprecated,
      npmUrl: `https://www.npmjs.com/package/${name}`,
      githubUrl: repositoryUrl,
      officialUrl: data.homepage || `https://www.npmjs.com/package/${name}`,
      maintainers: data.maintainers?.length || 0,
      hasTests: !!(versionData?.scripts?.test),
      bundleSize,
    };
  } catch (error) {
    console.error('Error fetching npm package data:', error);
    return {};
  }
}

export async function fetchPypiPackageData(name: string) {
  try {
    const response = await fetchWithRetry(
      `https://pypi.org/pypi/${encodeURIComponent(name)}/json`,
      {},
      3,
      15000
    );

    const data = await safeJsonParse<any>(response);
    if (!data) return {};

    const repositoryUrl = data.info?.project_urls?.Source ||
      data.info?.project_urls?.Repository ||
      data.info?.project_urls?.GitHub;

    return {
      description: data.info?.summary,
      license: data.info?.license,
      author: data.info?.author,
      homepage: data.info?.home_page || data.info?.project_urls?.Homepage,
      repository: repositoryUrl,
      lastPublish: data.releases?.[data.info?.version]?.[0]?.upload_time,
      latestVersion: data.info?.version,
      currentVersion: data.info?.version,
      npmUrl: `https://pypi.org/project/${name}/`,
      githubUrl: repositoryUrl,
      officialUrl: data.info?.home_page || `https://pypi.org/project/${name}/`,
      maintainers: data.info?.maintainer ? 1 : 0,
      hasTests: !!data.info?.project_urls?.Tests,
    };
  } catch (error) {
    console.error('Error fetching PyPI package data:', error);
    return {};
  }
}

export async function fetchDockerImageData(name: string) {
  try {
    const cleanName = name.includes('/') ? name : `library/${name}`;
    const response = await fetchWithRetry(
      `https://hub.docker.com/v2/repositories/${cleanName}`,
      {},
      3,
      15000
    );

    const data = await safeJsonParse<any>(response);
    if (!data) return {};

    // Fetch tags to get more info
    let imageSize = undefined;
    try {
      const tagsResponse = await fetchWithRetry(
        `https://hub.docker.com/v2/repositories/${cleanName}/tags?page_size=1`,
        {},
        1,
        5000
      );
      const tagsData = await safeJsonParse<{ results: Array<{ full_size: number }> }>(tagsResponse);
      if (tagsData?.results?.[0]?.full_size) {
        const size = tagsData.results[0].full_size;
        imageSize = `${(size / 1024 / 1024).toFixed(1)} MB`;
      }
    } catch (e) {
      // Ignore size errors
    }

    return {
      description: data.description,
      author: data.user,
      lastPublish: data.last_updated,
      stars: data.star_count,
      npmUrl: `https://hub.docker.com/r/${name}`,
      officialUrl: `https://hub.docker.com/r/${name}`,
      downloads: data.pull_count,
      bundleSize: imageSize,
    };
  } catch (error) {
    console.error('Error fetching Docker image data:', error);
    return {};
  }
}

// ============================================
// AI DESCRIPTION GENERATION
// ============================================

export async function generateAIDescription(
  packageName: string,
  ecosystem: string,
  metadata: any,
  githubStats?: GitHubStats | null
): Promise<string> {
  // Return early if no API key
  if (!process.env.OPENAI_API_KEY) {
    return metadata?.description || 'No description available';
  }

  try {
    const prompt = `Generate a concise 2-3 sentence description explaining what the "${packageName}" ${ecosystem} package does, its primary use cases, and why developers might choose it. Based on:
- Description: ${metadata?.description || 'Not available'}
- Stars: ${githubStats?.stars || 0}
- Downloads: ${metadata?.downloads || 0}
- Language: ${githubStats?.language || ecosystem}

Keep it informative, technical but accessible.`;

    const response = await fetchWithRetry(
      'https://openrouter.ai/api/v1/chat/completions',
      {
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
              content: 'You are a technical writer who creates concise, accurate package descriptions for developers.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      },
      2,
      30000
    );

    const data = await safeJsonParse<any>(response);
    return data?.choices?.[0]?.message?.content?.trim() || metadata?.description || 'No description available';
  } catch (error) {
    console.error('Error generating AI description:', error);
    return metadata?.description || 'No description available';
  }
}

// ============================================
// VULNERABILITY FETCHING
// ============================================

async function fetchGitHubAdvisories(pkg: PackageInfo): Promise<Vulnerability[]> {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.warn('GITHUB_TOKEN not set, skipping GitHub advisories');
    return [];
  }

  if (pkg.ecosystem !== 'npm' && pkg.ecosystem !== 'python') {
    return [];
  }

  const ecosystemMap = {
    'npm': 'NPM',
    'python': 'PIP',
  };

  const query = `
    query($ecosystem: SecurityAdvisoryEcosystem!, $package: String!) {
      securityVulnerabilities(first: 10, ecosystem: $ecosystem, package: $package) {
        nodes {
          advisory {
            ghsaId
            summary
            description
            severity
            cvss {
              score
            }
            cwes(first: 5) {
              nodes {
                cweId
              }
            }
            references {
              url
            }
          }
          vulnerableVersionRange
          firstPatchedVersion {
            identifier
          }
        }
      }
    }
  `;

  try {
    const response = await fetchWithRetry(
      'https://api.github.com/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            ecosystem: ecosystemMap[pkg.ecosystem],
            package: pkg.name,
          },
        }),
      },
      3,
      20000
    );

    const data = await safeJsonParse<any>(response);
    if (!data?.data?.securityVulnerabilities?.nodes) {
      return [];
    }

    const vulns = data.data.securityVulnerabilities.nodes;
    return vulns.map((vuln: any) => ({
      id: vuln.advisory.ghsaId,
      severity: (vuln.advisory.severity?.toLowerCase() || 'medium') as Vulnerability['severity'],
      title: vuln.advisory.summary,
      description: vuln.advisory.description,
      cvss: vuln.advisory.cvss?.score,
      cwe: vuln.advisory.cwes?.nodes?.map((c: any) => c.cweId) || [],
      references: vuln.advisory.references?.map((r: any) => r.url) || [],
      fixedIn: vuln.firstPatchedVersion?.identifier,
    }));
  } catch (error) {
    console.error('Error fetching GitHub advisories:', error);
    return [];
  }
}

async function fetchOSVVulnerabilities(pkg: PackageInfo): Promise<Vulnerability[]> {
  const ecosystemMap: Record<string, string> = {
    'npm': 'npm',
    'python': 'PyPI',
    'docker': 'Docker',
  };

  try {
    const response = await fetchWithRetry(
      'https://api.osv.dev/v1/query',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: {
            name: pkg.name,
            ecosystem: ecosystemMap[pkg.ecosystem] || pkg.ecosystem,
          },
          version: pkg.version === 'latest' ? undefined : pkg.version,
        }),
      },
      3,
      20000
    );

    const data = await safeJsonParse<{ vulns?: any[] }>(response);
    if (!data?.vulns) {
      return [];
    }

    return data.vulns.slice(0, 10).map((vuln: any) => {
      let severity: Vulnerability['severity'] = 'medium';
      if (vuln.database_specific?.severity) {
        severity = vuln.database_specific.severity.toLowerCase() as Vulnerability['severity'];
      } else if (vuln.severity?.[0]?.score) {
        const score = vuln.severity[0].score;
        if (score >= 9) severity = 'critical';
        else if (score >= 7) severity = 'high';
        else if (score >= 4) severity = 'medium';
        else severity = 'low';
      }

      return {
        id: vuln.id,
        severity,
        title: vuln.summary || 'Security vulnerability',
        description: vuln.details || vuln.summary || 'No description available',
        cvss: vuln.severity?.[0]?.score,
        cwe: vuln.database_specific?.cwe_ids || [],
        references: vuln.references?.map((r: any) => r.url) || [],
        fixedIn: vuln.affected?.[0]?.ranges?.[0]?.events?.find((e: any) => e.fixed)?.fixed,
      };
    });
  } catch (error) {
    console.error('Error fetching OSV data:', error);
    return [];
  }
}

// Fallback vulnerability database for demo/offline
const FALLBACK_VULNERABILITIES: Record<string, Vulnerability[]> = {
  'lodash': [
    {
      id: 'CVE-2021-23337',
      severity: 'high',
      title: 'Command Injection',
      description: 'Lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.',
      cvss: 7.2,
      cwe: ['CWE-78'],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23337'],
      fixedIn: '4.17.21'
    }
  ],
  'express': [
    {
      id: 'CVE-2022-24999',
      severity: 'medium',
      title: 'Open Redirect',
      description: 'Express.js vulnerable to open redirect via malformed URLs.',
      cvss: 6.1,
      cwe: ['CWE-601'],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-24999'],
      fixedIn: '4.17.3'
    }
  ],
  'django': [
    {
      id: 'CVE-2023-23969',
      severity: 'critical',
      title: 'SQL Injection',
      description: 'Django 3.2 before 3.2.18 allows SQL injection.',
      cvss: 9.8,
      cwe: ['CWE-89'],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-23969'],
      fixedIn: '3.2.18'
    }
  ],
  'requests': [
    {
      id: 'CVE-2023-32681',
      severity: 'medium',
      title: 'Unintended Proxy Authentication',
      description: 'Requests library can leak Proxy-Authorization headers.',
      cvss: 6.1,
      cwe: ['CWE-200'],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-32681'],
      fixedIn: '2.31.0'
    }
  ],
  'nginx': [
    {
      id: 'CVE-2021-23017',
      severity: 'high',
      title: 'Off-by-one Buffer Overflow',
      description: 'Nginx DNS resolver off-by-one heap write.',
      cvss: 8.1,
      cwe: ['CWE-193'],
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23017'],
      fixedIn: '1.20.1'
    }
  ]
};

export async function fetchVulnerabilities(pkg: PackageInfo): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  const seenIds = new Set<string>();

  // Fetch from GitHub Security Advisories
  try {
    const githubVulns = await fetchGitHubAdvisories(pkg);
    for (const vuln of githubVulns) {
      if (!seenIds.has(vuln.id)) {
        seenIds.add(vuln.id);
        vulnerabilities.push(vuln);
      }
    }
  } catch (error) {
    console.error('Error in GitHub advisories fetch:', error);
  }

  // Fetch from OSV
  try {
    const osvVulns = await fetchOSVVulnerabilities(pkg);
    for (const vuln of osvVulns) {
      if (!seenIds.has(vuln.id)) {
        seenIds.add(vuln.id);
        vulnerabilities.push(vuln);
      }
    }
  } catch (error) {
    console.error('Error in OSV fetch:', error);
  }

  // Use fallback data if no vulnerabilities found from APIs
  if (vulnerabilities.length === 0 && FALLBACK_VULNERABILITIES[pkg.name]) {
    return FALLBACK_VULNERABILITIES[pkg.name];
  }

  return vulnerabilities;
}

// ============================================
// TRUST SCORE CALCULATION
// ============================================

export function calculateTrustScore(
  vulnerabilities: Vulnerability[],
  metadata: any,
  dependencies: Record<string, string> = {},
  githubStats?: GitHubStats | null,
  downloadStats?: DownloadStats
): { score: number; breakdown: PackageAnalysis['trustScoreBreakdown'] } {

  // Security Score (40 points)
  let securityScore = 40;
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;

  securityScore -= criticalCount * 15;
  securityScore -= highCount * 10;
  securityScore -= mediumCount * 5;
  securityScore = Math.max(0, securityScore);

  // Maintenance Score (25 points)
  let maintenanceScore = 25;
  if (metadata?.lastPublish) {
    try {
      const lastPublishDate = new Date(metadata.lastPublish);
      if (!isNaN(lastPublishDate.getTime())) {
        const daysSinceUpdate = (Date.now() - lastPublishDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 730) maintenanceScore -= 15; // 2+ years
        else if (daysSinceUpdate > 365) maintenanceScore -= 10; // 1+ year
        else if (daysSinceUpdate > 180) maintenanceScore -= 5; // 6+ months
      }
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  // Bonus for active GitHub repo
  if (githubStats?.lastCommit) {
    try {
      const lastCommitDate = new Date(githubStats.lastCommit);
      if (!isNaN(lastCommitDate.getTime())) {
        const daysSinceCommit = (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCommit < 30) maintenanceScore += 5; // Active within last month
      }
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  maintenanceScore = Math.min(25, Math.max(0, maintenanceScore));

  // Popularity Score (20 points)
  let popularityScore = 5; // Base score

  // GitHub stars factor
  if (githubStats?.stars) {
    if (githubStats.stars > 10000) popularityScore += 8;
    else if (githubStats.stars > 1000) popularityScore += 6;
    else if (githubStats.stars > 100) popularityScore += 4;
    else if (githubStats.stars > 10) popularityScore += 2;
  }

  // Download stats factor
  if (downloadStats?.lastMonth) {
    if (downloadStats.lastMonth > 1000000) popularityScore += 7;
    else if (downloadStats.lastMonth > 100000) popularityScore += 5;
    else if (downloadStats.lastMonth > 10000) popularityScore += 3;
    else if (downloadStats.lastMonth > 1000) popularityScore += 1;
  }

  popularityScore = Math.min(20, popularityScore);

  // Dependencies Score (15 points)
  const depCount = Object.keys(dependencies || {}).length;
  let dependenciesScore = 15;
  if (depCount > 100) dependenciesScore = 5;
  else if (depCount > 50) dependenciesScore = 10;
  else if (depCount > 20) dependenciesScore = 12;

  const totalScore = Math.round(securityScore + maintenanceScore + popularityScore + dependenciesScore);

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      security: Math.round((securityScore / 40) * 100),
      maintenance: Math.round((maintenanceScore / 25) * 100),
      popularity: Math.round((popularityScore / 20) * 100),
      dependencies: Math.round((dependenciesScore / 15) * 100),
    }
  };
}

// ============================================
// MAIN SCAN FUNCTION
// ============================================

export async function scanPackages(packages: PackageInfo[]): Promise<PackageAnalysis[]> {
  const results: PackageAnalysis[] = [];

  console.log(`Starting comprehensive scan of ${packages.length} packages...`);

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    console.log(`Scanning package ${i + 1}/${packages.length}: ${pkg.name}`);

    try {
      let metadata: any = {};
      let downloadStats: DownloadStats = {};

      
      if (pkg.ecosystem === 'npm') {
        metadata = await fetchNpmPackageData(pkg.name, pkg.version);
        downloadStats = await fetchNpmDownloadStats(pkg.name);
      } else if (pkg.ecosystem === 'python') {
        metadata = await fetchPypiPackageData(pkg.name);
        downloadStats = await fetchPypiDownloadStats(pkg.name);
      } else if (pkg.ecosystem === 'docker') {
        metadata = await fetchDockerImageData(pkg.name);
      }

      // Fetch GitHub stats if repository URL exists
      let githubStats: GitHubStats | null = null;
      if (metadata?.repository) {
        githubStats = await fetchGitHubStats(metadata.repository);
        if (githubStats) {
          metadata.hasSecurity = githubStats.topics?.includes('security') || false;
        }
      }

      // Fetch vulnerabilities
      const vulnerabilities = await fetchVulnerabilities(pkg);

      // Calculate trust score
      const { score, breakdown } = calculateTrustScore(
        vulnerabilities,
        metadata,
        metadata?.dependencies || {},
        githubStats,
        downloadStats
      );

      // Generate AI description
      const aiDescription = await generateAIDescription(
        pkg.name,
        pkg.ecosystem,
        metadata,
        githubStats
      );

      results.push({
        package: pkg,
        vulnerabilities,
        trustScore: score,
        trustScoreBreakdown: breakdown,
        metadata: metadata || {},
        githubStats: githubStats || undefined,
        downloadStats,
        aiDescription,
      });

      console.log(`✓ Completed analysis for ${pkg.name} (${i + 1}/${packages.length})`);
    } catch (error) {
      console.error(`Error scanning ${pkg.name}:`, error);

      // Even on error, add minimal data so package shows up in results
      results.push({
        package: pkg,
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
      });
    }
  }

  console.log(`Scan complete! Analyzed ${results.length} packages.`);
  return results;
}

