const chalk = require('chalk');
const Table = require('cli-table3');

class Reporter {
  constructor(options = {}) {
    this.jsonMode = options.json || false;
    this.verbose = options.verbose || false;
  }

  formatResults(dependencies, summary = null) {
    if (this.jsonMode) {
      return this.formatJSON(dependencies, summary);
    }
    return this.formatTerminal(dependencies, summary);
  }

  formatJSON(dependencies, summary = null) {
    const output = {
      timestamp: new Date().toISOString(),
      totalPackages: dependencies.length,
      summary: {
        high: dependencies.filter(d => d.analysis?.riskLevel === 'high').length,
        medium: dependencies.filter(d => d.analysis?.riskLevel === 'medium').length,
        low: dependencies.filter(d => d.analysis?.riskLevel === 'low').length
      },
      aiSummary: summary,
      packages: dependencies.map(dep => ({
        name: dep.name,
        version: dep.version,
        riskLevel: dep.analysis?.riskLevel || 'unknown',
        riskScore: dep.analysis?.riskScore || 0,
        downloads: dep.downloads || 0,
        license: dep.metadata?.license || 'unknown',
        risks: dep.analysis?.risks || [],
        warnings: dep.analysis?.warnings || [],
        recommendation: dep.recommendation || null,
        metadata: {
          author: dep.metadata?.author || null,
          repository: dep.metadata?.repository || null,
          maintainers: dep.metadata?.maintainers || [],
          deprecated: dep.metadata?.deprecated || null
        }
      }))
    };

    return JSON.stringify(output, null, 2);
  }

  formatTerminal(dependencies, summary = null) {
    const output = [];

    output.push('');
    output.push(chalk.bold.cyan('╔══════════════════════════════════════════════════════════════════╗'));
    output.push(chalk.bold.cyan('║') + chalk.bold.white('                    PackInSight Security Report                   ') + chalk.bold.cyan('║'));
    output.push(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════════╝'));
    output.push('');

    const highRisk = dependencies.filter(d => d.analysis?.riskLevel === 'high');
    const mediumRisk = dependencies.filter(d => d.analysis?.riskLevel === 'medium');
    const lowRisk = dependencies.filter(d => d.analysis?.riskLevel === 'low');

    output.push(chalk.bold('Summary:'));
    output.push(`  Total Packages: ${chalk.bold(dependencies.length)}`);
    output.push(`  ${chalk.red('●')} High Risk:   ${chalk.red.bold(highRisk.length)}`);
    output.push(`  ${chalk.yellow('●')} Medium Risk: ${chalk.yellow.bold(mediumRisk.length)}`);
    output.push(`  ${chalk.green('●')} Low Risk:    ${chalk.green.bold(lowRisk.length)}`);
    output.push('');

    if (summary) {
      output.push(chalk.bold('AI Summary:'));
      output.push(chalk.dim(`  ${summary}`));
      output.push('');
    }

    const table = new Table({
      head: [
        chalk.bold('Package'),
        chalk.bold('Version'),
        chalk.bold('Risk'),
        chalk.bold('Downloads'),
        chalk.bold('Issues')
      ],
      colWidths: [25, 12, 10, 15, 40],
      style: {
        head: [],
        border: ['grey']
      },
      wordWrap: true
    });

    const sortedDeps = [...dependencies].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2, unknown: 3 };
      return (order[a.analysis?.riskLevel] || 3) - (order[b.analysis?.riskLevel] || 3);
    });

    for (const dep of sortedDeps) {
      const riskLevel = dep.analysis?.riskLevel || 'unknown';
      const riskBadge = this.getRiskBadge(riskLevel);
      const downloads = this.formatDownloads(dep.downloads);
      const issues = this.formatIssues(dep.analysis);

      table.push([
        dep.name,
        dep.version || 'N/A',
        riskBadge,
        downloads,
        issues
      ]);
    }

    output.push(table.toString());
    output.push('');

    if (highRisk.length > 0 || mediumRisk.length > 0) {
      output.push(chalk.bold('Detailed Findings:'));
      output.push('');

      for (const dep of [...highRisk, ...mediumRisk]) {
        output.push(this.formatDetailedFindings(dep));
      }
    }

    return output.join('\n');
  }

  getRiskBadge(level) {
    switch (level) {
      case 'high':
        return chalk.bgRed.white.bold(' HIGH ');
      case 'medium':
        return chalk.bgYellow.black.bold(' MED  ');
      case 'low':
        return chalk.bgGreen.white.bold(' LOW  ');
      default:
        return chalk.bgGray.white(' N/A  ');
    }
  }

  formatDownloads(count) {
    if (!count && count !== 0) return chalk.dim('N/A');
    
    if (count >= 1000000) {
      return chalk.green(`${(count / 1000000).toFixed(1)}M/wk`);
    } else if (count >= 1000) {
      return chalk.green(`${(count / 1000).toFixed(1)}K/wk`);
    } else if (count < 100) {
      return chalk.red(`${count}/wk`);
    } else if (count < 1000) {
      return chalk.yellow(`${count}/wk`);
    }
    return `${count}/wk`;
  }

  formatIssues(analysis) {
    if (!analysis) return chalk.dim('Unable to analyze');
    
    const risks = analysis.risks || [];
    const warnings = analysis.warnings || [];
    
    if (risks.length === 0 && warnings.length === 0) {
      return chalk.green('No issues found');
    }

    const issues = [];
    
    const highRisks = risks.filter(r => r.severity === 'high');
    const medRisks = risks.filter(r => r.severity === 'medium');
    
    if (highRisks.length > 0) {
      issues.push(chalk.red(`${highRisks.length} critical`));
    }
    if (medRisks.length > 0) {
      issues.push(chalk.yellow(`${medRisks.length} warning`));
    }
    if (warnings.length > 0) {
      issues.push(chalk.dim(`${warnings.length} info`));
    }

    return issues.join(', ');
  }

  formatDetailedFindings(dep) {
    const lines = [];
    const riskLevel = dep.analysis?.riskLevel || 'unknown';
    const riskColor = riskLevel === 'high' ? chalk.red : chalk.yellow;

    lines.push(riskColor(`  ┌─ ${dep.name}@${dep.version}`));
    lines.push(riskColor(`  │  Risk: ${riskLevel.toUpperCase()} (Score: ${dep.analysis?.riskScore || 0}/100)`));

    const risks = dep.analysis?.risks || [];
    const warnings = dep.analysis?.warnings || [];

    if (risks.length > 0) {
      lines.push(riskColor('  │'));
      lines.push(riskColor('  │  Risks:'));
      for (const risk of risks) {
        const icon = risk.severity === 'high' ? '✖' : '⚠';
        lines.push(riskColor(`  │    ${icon} ${risk.message}`));
      }
    }

    if (warnings.length > 0 && this.verbose) {
      lines.push(chalk.dim('  │'));
      lines.push(chalk.dim('  │  Warnings:'));
      for (const warning of warnings) {
        lines.push(chalk.dim(`  │    ○ ${warning.message}`));
      }
    }

    if (dep.recommendation) {
      lines.push(riskColor('  │'));
      lines.push(riskColor('  │  Recommendation:'));
      const wrapped = this.wrapText(dep.recommendation, 60);
      wrapped.forEach(line => {
        lines.push(riskColor(`  │    ${line}`));
      });
    }

    lines.push(riskColor('  └────────────────────────────────────────'));
    lines.push('');

    return lines.join('\n');
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  printProgress(message) {
    if (!this.jsonMode) {
      console.log(chalk.dim(message));
    }
  }
}

module.exports = Reporter;
