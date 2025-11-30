const OpenAI = require('openai');

class AIRecommender {
  constructor(options = {}) {
    this.enabled = !!process.env.OPENAI_API_KEY;
    this.client = null;
    this.model = options.model || 'gpt-4o-mini';
    
    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  isEnabled() {
    return this.enabled && this.client !== null;
  }

  async generateRecommendation(dep) {
    if (!this.isEnabled()) {
      return this.generateFallbackRecommendation(dep);
    }

    try {
      const prompt = this.buildPrompt(dep);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a security expert analyzing npm packages. Provide concise, actionable security recommendations in 1-3 sentences. Focus on the most critical issues and suggest alternatives when relevant. Be direct and specific.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content?.trim() || this.generateFallbackRecommendation(dep);
    } catch (error) {
      console.error(`AI recommendation failed for ${dep.name}: ${error.message}`);
      return this.generateFallbackRecommendation(dep);
    }
  }

  buildPrompt(dep) {
    const analysis = dep.analysis || {};
    const risks = analysis.risks || [];
    const warnings = analysis.warnings || [];
    const metadata = dep.metadata || {};

    let prompt = `Analyze npm package "${dep.name}" (v${dep.version}):\n`;
    prompt += `- Risk Level: ${analysis.riskLevel || 'unknown'}\n`;
    prompt += `- Weekly Downloads: ${(dep.downloads || 0).toLocaleString()}\n`;
    prompt += `- License: ${metadata.license || 'unknown'}\n`;
    
    if (risks.length > 0) {
      prompt += `- Risks: ${risks.map(r => r.message).join('; ')}\n`;
    }
    
    if (warnings.length > 0) {
      prompt += `- Warnings: ${warnings.map(w => w.message).join('; ')}\n`;
    }

    if (metadata.deprecated) {
      prompt += `- DEPRECATED: ${metadata.deprecated}\n`;
    }

    prompt += `\nProvide a brief security recommendation (1-3 sentences).`;
    
    return prompt;
  }

  generateFallbackRecommendation(dep) {
    const analysis = dep.analysis || {};
    const risks = analysis.risks || [];
    const warnings = analysis.warnings || [];
    const metadata = dep.metadata || {};

    if (!metadata) {
      return `Unable to verify package "${dep.name}" - not found in npm registry. Verify the package name or check if it's a private package.`;
    }

    const recommendations = [];

    const highRisks = risks.filter(r => r.severity === 'high');
    if (highRisks.length > 0) {
      const typosquatting = highRisks.find(r => r.type === 'potential_typosquatting');
      if (typosquatting) {
        recommendations.push(`Warning: Package name is very similar to "${typosquatting.similarTo}". Verify this is the intended package to avoid typosquatting attacks.`);
      }

      const suspiciousScript = highRisks.find(r => r.type === 'suspicious_install_script');
      if (suspiciousScript) {
        recommendations.push(`Critical: Contains suspicious install scripts. Review the package source carefully before installation.`);
      }

      const veryNew = highRisks.find(r => r.type === 'very_new_package');
      if (veryNew) {
        recommendations.push(`Caution: This version was published very recently (${veryNew.value} days). Wait for community verification or review source code.`);
      }

      const veryLowDownloads = highRisks.find(r => r.type === 'very_low_downloads');
      if (veryLowDownloads) {
        recommendations.push(`Low adoption: Only ${veryLowDownloads.value} weekly downloads. Consider well-established alternatives.`);
      }
    }

    const deprecated = risks.find(r => r.type === 'deprecated');
    if (deprecated) {
      recommendations.push(`This package is deprecated. ${metadata.deprecated || 'Consider finding an alternative.'}`);
    }

    const installScript = warnings.find(w => w.type === 'install_script');
    if (installScript && !highRisks.find(r => r.type === 'suspicious_install_script')) {
      recommendations.push(`Has install scripts - review them if security is critical.`);
    }

    const noLicense = risks.find(r => r.type === 'no_license');
    if (noLicense) {
      recommendations.push(`No license specified - may have legal implications for your project.`);
    }

    if (recommendations.length === 0) {
      if (analysis.riskLevel === 'low') {
        return `Package appears safe with no significant concerns detected.`;
      } else if (analysis.riskLevel === 'medium') {
        const issueCount = risks.length + warnings.length;
        return `Package has ${issueCount} minor concern${issueCount > 1 ? 's' : ''} but is generally safe to use. Review warnings if needed.`;
      }
    }

    return recommendations.slice(0, 2).join(' ') || 'No specific recommendations at this time.';
  }

  async generateBatchRecommendations(dependencies, onProgress) {
    const results = [];
    let processed = 0;

    for (const dep of dependencies) {
      const recommendation = await this.generateRecommendation(dep);
      results.push({
        ...dep,
        recommendation
      });

      processed++;
      if (onProgress) {
        onProgress(processed, dependencies.length, dep.name);
      }
    }

    return results;
  }

  async generateSummary(dependencies) {
    if (!this.isEnabled()) {
      return this.generateFallbackSummary(dependencies);
    }

    try {
      const highRisk = dependencies.filter(d => d.analysis?.riskLevel === 'high');
      const mediumRisk = dependencies.filter(d => d.analysis?.riskLevel === 'medium');

      if (highRisk.length === 0 && mediumRisk.length === 0) {
        return 'All dependencies appear safe with no significant security concerns detected.';
      }

      const criticalIssues = [];
      highRisk.forEach(dep => {
        dep.analysis?.risks?.forEach(risk => {
          if (risk.severity === 'high') {
            criticalIssues.push(`${dep.name}: ${risk.message}`);
          }
        });
      });

      const prompt = `Summarize the security status of a project with ${dependencies.length} dependencies:
- ${highRisk.length} high-risk packages
- ${mediumRisk.length} medium-risk packages
${criticalIssues.length > 0 ? `Critical issues:\n${criticalIssues.slice(0, 5).join('\n')}` : ''}

Provide a 2-3 sentence executive summary with the most important action items.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a security expert providing executive summaries of npm dependency security scans. Be concise and actionable.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content?.trim() || this.generateFallbackSummary(dependencies);
    } catch (error) {
      return this.generateFallbackSummary(dependencies);
    }
  }

  generateFallbackSummary(dependencies) {
    const highRisk = dependencies.filter(d => d.analysis?.riskLevel === 'high');
    const mediumRisk = dependencies.filter(d => d.analysis?.riskLevel === 'medium');
    const lowRisk = dependencies.filter(d => d.analysis?.riskLevel === 'low');

    if (highRisk.length === 0 && mediumRisk.length === 0) {
      return `All ${dependencies.length} dependencies appear safe with no significant security concerns.`;
    }

    let summary = `Scanned ${dependencies.length} dependencies: `;
    const parts = [];
    
    if (highRisk.length > 0) {
      parts.push(`${highRisk.length} high-risk`);
    }
    if (mediumRisk.length > 0) {
      parts.push(`${mediumRisk.length} medium-risk`);
    }
    if (lowRisk.length > 0) {
      parts.push(`${lowRisk.length} low-risk`);
    }

    summary += parts.join(', ') + '.';

    if (highRisk.length > 0) {
      summary += ` Review high-risk packages immediately: ${highRisk.slice(0, 3).map(d => d.name).join(', ')}${highRisk.length > 3 ? '...' : ''}.`;
    }

    return summary;
  }
}

module.exports = AIRecommender;
