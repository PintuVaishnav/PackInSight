const POPULAR_PACKAGES = [
  'react', 'vue', 'angular', 'express', 'lodash', 'axios', 'moment', 'webpack',
  'babel', 'eslint', 'jest', 'mocha', 'chai', 'typescript', 'jquery', 'bootstrap',
  'next', 'nuxt', 'gatsby', 'redux', 'mobx', 'graphql', 'apollo', 'prisma',
  'mongoose', 'sequelize', 'knex', 'passport', 'bcrypt', 'jsonwebtoken', 'socket.io',
  'commander', 'chalk', 'ora', 'inquirer', 'yargs', 'minimist', 'dotenv', 'cors',
  'helmet', 'morgan', 'nodemon', 'pm2', 'forever', 'async', 'bluebird', 'rxjs',
  'underscore', 'ramda', 'date-fns', 'dayjs', 'uuid', 'nanoid', 'crypto-js',
  'node-fetch', 'got', 'superagent', 'request', 'cheerio', 'puppeteer', 'playwright'
];

const SUSPICIOUS_SCRIPT_PATTERNS = [
  /curl\s+/i,
  /wget\s+/i,
  /eval\s*\(/i,
  /\bsh\s+-c\b/i,
  /\bbash\s+-c\b/i,
  /powershell/i,
  /\bexec\s*\(/i,
  /child_process/i,
  /http[s]?:\/\/(?!registry\.npmjs\.org|github\.com|gitlab\.com)/i,
  /base64/i,
  /\$\(.*\)/,
  /`.*`/
];

class Analyzer {
  constructor(options = {}) {
    this.thresholds = {
      lowDownloads: options.lowDownloads || 1000,
      veryLowDownloads: options.veryLowDownloads || 100,
      newPackageDays: options.newPackageDays || 30,
      veryNewPackageDays: options.veryNewPackageDays || 7,
      ...options.thresholds
    };
  }

  analyzePackage(dep) {
    const risks = [];
    const warnings = [];

    if (!dep.metadata) {
      return {
        riskLevel: 'high',
        riskScore: 100,
        risks: [{ type: 'not_found', message: 'Package not found in npm registry', severity: 'high' }],
        warnings: []
      };
    }

    this.checkDownloads(dep, risks, warnings);
    this.checkAge(dep, risks, warnings);
    this.checkLicense(dep, risks, warnings);
    this.checkScripts(dep, risks, warnings);
    this.checkTyposquatting(dep, risks, warnings);
    this.checkMaintainers(dep, risks, warnings);
    this.checkRepository(dep, risks, warnings);
    this.checkReadme(dep, risks, warnings);
    this.checkDeprecation(dep, risks, warnings);

    const riskScore = this.calculateRiskScore(risks, warnings);
    const riskLevel = this.getRiskLevel(riskScore);

    return {
      riskLevel,
      riskScore,
      risks,
      warnings
    };
  }

  checkDownloads(dep, risks, warnings) {
    const downloads = dep.downloads || 0;

    if (downloads < this.thresholds.veryLowDownloads) {
      risks.push({
        type: 'very_low_downloads',
        message: `Very low weekly downloads (${downloads.toLocaleString()})`,
        severity: 'high',
        value: downloads
      });
    } else if (downloads < this.thresholds.lowDownloads) {
      warnings.push({
        type: 'low_downloads',
        message: `Low weekly downloads (${downloads.toLocaleString()})`,
        severity: 'medium',
        value: downloads
      });
    }
  }

  checkAge(dep, risks, warnings) {
    const publishedAt = dep.metadata?.versionPublishedAt || dep.metadata?.createdAt;
    if (!publishedAt) return;

    const ageInDays = Math.floor((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays < this.thresholds.veryNewPackageDays) {
      risks.push({
        type: 'very_new_package',
        message: `Package version published very recently (${ageInDays} days ago)`,
        severity: 'high',
        value: ageInDays
      });
    } else if (ageInDays < this.thresholds.newPackageDays) {
      warnings.push({
        type: 'new_package',
        message: `Package version published recently (${ageInDays} days ago)`,
        severity: 'medium',
        value: ageInDays
      });
    }
  }

  checkLicense(dep, risks, warnings) {
    const license = dep.metadata?.license;

    if (!license || license === 'UNLICENSED' || license === 'UNKNOWN') {
      risks.push({
        type: 'no_license',
        message: 'No license specified',
        severity: 'medium'
      });
    } else if (['GPL', 'AGPL', 'GPL-3.0', 'AGPL-3.0'].some(l => license.includes(l))) {
      warnings.push({
        type: 'copyleft_license',
        message: `Copyleft license detected: ${license}`,
        severity: 'low'
      });
    }
  }

  checkScripts(dep, risks, warnings) {
    const scripts = dep.scripts || {};
    const dangerousHooks = ['preinstall', 'postinstall', 'preuninstall', 'postuninstall'];

    for (const hook of dangerousHooks) {
      if (scripts[hook]) {
        const isSuspicious = this.isScriptSuspicious(scripts[hook]);
        
        if (isSuspicious) {
          risks.push({
            type: 'suspicious_install_script',
            message: `Suspicious ${hook} script detected`,
            severity: 'high',
            script: scripts[hook]
          });
        } else {
          warnings.push({
            type: 'install_script',
            message: `Has ${hook} script: "${scripts[hook].substring(0, 50)}${scripts[hook].length > 50 ? '...' : ''}"`,
            severity: 'medium',
            script: scripts[hook]
          });
        }
      }
    }
  }

  isScriptSuspicious(script) {
    return SUSPICIOUS_SCRIPT_PATTERNS.some(pattern => pattern.test(script));
  }

  checkTyposquatting(dep, risks, warnings) {
    const name = dep.name.toLowerCase();
    
    for (const popular of POPULAR_PACKAGES) {
      if (name === popular) continue;
      
      const similarity = this.calculateSimilarity(name, popular);
      
      if (similarity > 0.8 && similarity < 1) {
        risks.push({
          type: 'potential_typosquatting',
          message: `Name similar to popular package "${popular}" (${Math.round(similarity * 100)}% match)`,
          severity: 'high',
          similarTo: popular,
          similarity
        });
        break;
      } else if (similarity > 0.6 && similarity < 1) {
        const isScope = name.startsWith('@') && name.includes(popular);
        if (!isScope) {
          warnings.push({
            type: 'name_similarity',
            message: `Name somewhat similar to "${popular}"`,
            severity: 'low',
            similarTo: popular,
            similarity
          });
        }
        break;
      }
    }
  }

  calculateSimilarity(a, b) {
    a = a.replace(/[-_@\/]/g, '');
    b = b.replace(/[-_@\/]/g, '');
    
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix = Array(a.length + 1).fill(null).map(() => 
      Array(b.length + 1).fill(null)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[a.length][b.length];
    const maxLength = Math.max(a.length, b.length);
    return 1 - (distance / maxLength);
  }

  checkMaintainers(dep, risks, warnings) {
    const maintainers = dep.metadata?.maintainers || [];

    if (maintainers.length === 0) {
      warnings.push({
        type: 'no_maintainers',
        message: 'No maintainers listed',
        severity: 'low'
      });
    }
  }

  checkRepository(dep, risks, warnings) {
    const repo = dep.metadata?.repository;

    if (!repo) {
      warnings.push({
        type: 'no_repository',
        message: 'No repository URL specified',
        severity: 'low'
      });
    } else if (typeof repo === 'string') {
      const isKnownHost = /github\.com|gitlab\.com|bitbucket\.org|codeberg\.org/.test(repo);
      if (!isKnownHost) {
        warnings.push({
          type: 'unknown_repository_host',
          message: 'Repository hosted on unknown platform',
          severity: 'low'
        });
      }
    }
  }

  checkReadme(dep, risks, warnings) {
    if (!dep.metadata?.hasReadme) {
      warnings.push({
        type: 'no_readme',
        message: 'No README or very short documentation',
        severity: 'low'
      });
    }
  }

  checkDeprecation(dep, risks, warnings) {
    if (dep.metadata?.deprecated) {
      risks.push({
        type: 'deprecated',
        message: `Package is deprecated: ${dep.metadata.deprecated}`,
        severity: 'medium'
      });
    }
  }

  calculateRiskScore(risks, warnings) {
    let score = 0;

    for (const risk of risks) {
      switch (risk.severity) {
        case 'high': score += 30; break;
        case 'medium': score += 15; break;
        case 'low': score += 5; break;
      }
    }

    for (const warning of warnings) {
      switch (warning.severity) {
        case 'high': score += 15; break;
        case 'medium': score += 8; break;
        case 'low': score += 3; break;
      }
    }

    return Math.min(100, score);
  }

  getRiskLevel(score) {
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  analyzeDependencies(dependencies) {
    return dependencies.map(dep => ({
      ...dep,
      analysis: this.analyzePackage(dep)
    }));
  }
}

module.exports = Analyzer;
