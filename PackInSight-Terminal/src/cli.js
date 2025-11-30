const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const Scanner = require('./scanner');
const Analyzer = require('./analyzer');
const AIRecommender = require('./ai');
const Reporter = require('./reporter');

const packageJson = require('../package.json');

function createCLI() {
  const program = new Command();

  program
    .name('packinsight')
    .description('AI-powered npm package security scanner')
    .version(packageJson.version);

  program
    .command('scan [target]')
    .description('Scan a package or project for security risks')
    .option('-j, --json', 'Output results in JSON format')
    .option('-d, --dry-run', 'Scan without installing or modifying anything')
    .option('-v, --verbose', 'Show detailed output including all warnings')
    .option('--no-ai', 'Disable AI-powered recommendations')
    .option('--safe-install', 'Run npm install with safety checks after scanning')
    .action(async (target, options) => {
      await runScan(target || '.', options);
    });

  program
    .command('check <package-name>')
    .description('Quick check a single npm package')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (packageName, options) => {
      await runPackageCheck(packageName, options);
    });

  program
    .command('install [packages...]')
    .description('Safe install packages with pre-scan')
    .option('--force', 'Install even if high-risk packages are found')
    .action(async (packages, options) => {
      await runSafeInstall(packages, options);
    });

  return program;
}

async function runScan(target, options) {
  const spinner = ora({ 
    text: 'Initializing PackInSight...', 
    spinner: 'dots',
    color: 'cyan'
  });
  
  if (!options.json) {
    spinner.start();
  }

  try {
    const scanner = new Scanner();
    const analyzer = new Analyzer();
    const ai = new AIRecommender();
    const reporter = new Reporter({ json: options.json, verbose: options.verbose });

    const targetPath = path.resolve(target);
    const isDirectory = fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();
    
    let dependencies;

    if (isDirectory) {
      if (!options.json) {
        spinner.text = `Scanning project at ${targetPath}...`;
      }
      dependencies = await scanner.scanProject(targetPath);
    } else {
      if (!options.json) {
        spinner.text = `Looking up package "${target}"...`;
      }
      dependencies = await scanner.scanPackage(target);
    }

    if (dependencies.length === 0) {
      if (!options.json) {
        spinner.succeed('No dependencies found to scan.');
      } else {
        console.log(JSON.stringify({ message: 'No dependencies found', packages: [] }));
      }
      return;
    }

    if (!options.json) {
      spinner.text = `Fetching metadata for ${dependencies.length} packages...`;
    }

    const enrichedDeps = await scanner.enrichDependencies(dependencies, (current, total, name) => {
      if (!options.json) {
        spinner.text = `Fetching metadata (${current}/${total}): ${name}`;
      }
    });

    if (!options.json) {
      spinner.text = 'Analyzing packages for security risks...';
    }

    const analyzedDeps = analyzer.analyzeDependencies(enrichedDeps);

    let finalDeps = analyzedDeps;
    let summary = null;

    if (options.ai !== false && ai.isEnabled()) {
      if (!options.json) {
        spinner.text = 'Generating AI recommendations...';
      }

      finalDeps = await ai.generateBatchRecommendations(analyzedDeps, (current, total, name) => {
        if (!options.json) {
          spinner.text = `Generating recommendations (${current}/${total}): ${name}`;
        }
      });

      summary = await ai.generateSummary(finalDeps);
    } else if (options.ai !== false) {
      finalDeps = analyzedDeps.map(dep => ({
        ...dep,
        recommendation: ai.generateFallbackRecommendation(dep)
      }));
      summary = ai.generateFallbackSummary(finalDeps);
    }

    if (!options.json) {
      spinner.succeed('Scan complete!');
    }

    const output = reporter.formatResults(finalDeps, summary);
    console.log(output);

    if (options.safeInstall && !options.dryRun) {
      await handleSafeInstall(finalDeps, options);
    }

    const highRiskCount = finalDeps.filter(d => d.analysis?.riskLevel === 'high').length;
    process.exitCode = highRiskCount > 0 ? 1 : 0;

  } catch (error) {
    if (!options.json) {
      spinner.fail(`Scan failed: ${error.message}`);
    } else {
      console.log(JSON.stringify({ error: error.message }));
    }
    process.exitCode = 2;
  }
}

async function runPackageCheck(packageName, options) {
  const spinner = ora({ 
    text: `Checking package "${packageName}"...`, 
    spinner: 'dots',
    color: 'cyan'
  });
  
  if (!options.json) {
    spinner.start();
  }

  try {
    const scanner = new Scanner();
    const analyzer = new Analyzer();
    const ai = new AIRecommender();
    const reporter = new Reporter({ json: options.json });

    const metadata = await scanner.fetchPackageMetadata(packageName);
    
    if (!metadata) {
      throw new Error(`Package "${packageName}" not found on npm registry`);
    }

    const downloads = await scanner.fetchDownloadCount(packageName);
    const latestVersion = metadata['dist-tags']?.latest;
    const versionData = metadata.versions?.[latestVersion] || {};

    const dep = {
      name: packageName,
      version: latestVersion,
      metadata: scanner.extractMetadata(metadata, versionData),
      downloads,
      scripts: versionData.scripts || {}
    };

    const analyzed = {
      ...dep,
      analysis: analyzer.analyzePackage(dep)
    };

    analyzed.recommendation = ai.isEnabled() 
      ? await ai.generateRecommendation(analyzed)
      : ai.generateFallbackRecommendation(analyzed);

    if (!options.json) {
      spinner.succeed('Check complete!');
    }

    const output = reporter.formatResults([analyzed]);
    console.log(output);

  } catch (error) {
    if (!options.json) {
      spinner.fail(`Check failed: ${error.message}`);
    } else {
      console.log(JSON.stringify({ error: error.message }));
    }
    process.exitCode = 2;
  }
}

async function runSafeInstall(packages, options) {
  const spinner = ora({ 
    text: 'Pre-scanning packages before installation...', 
    spinner: 'dots',
    color: 'cyan'
  }).start();

  try {
    const scanner = new Scanner();
    const analyzer = new Analyzer();

    const results = [];

    for (const pkg of packages) {
      spinner.text = `Scanning ${pkg}...`;
      
      const metadata = await scanner.fetchPackageMetadata(pkg);
      if (!metadata) {
        results.push({ name: pkg, error: 'Not found', riskLevel: 'high' });
        continue;
      }

      const downloads = await scanner.fetchDownloadCount(pkg);
      const latestVersion = metadata['dist-tags']?.latest;
      const versionData = metadata.versions?.[latestVersion] || {};

      const dep = {
        name: pkg,
        version: latestVersion,
        metadata: scanner.extractMetadata(metadata, versionData),
        downloads,
        scripts: versionData.scripts || {}
      };

      const analysis = analyzer.analyzePackage(dep);
      results.push({ ...dep, analysis });
    }

    const highRisk = results.filter(r => r.analysis?.riskLevel === 'high' || r.riskLevel === 'high');

    if (highRisk.length > 0 && !options.force) {
      spinner.fail('High-risk packages detected!');
      console.log('');
      console.log(chalk.red('The following packages have high risk scores:'));
      highRisk.forEach(pkg => {
        console.log(chalk.red(`  - ${pkg.name}: ${pkg.error || pkg.analysis?.risks?.map(r => r.message).join(', ')}`));
      });
      console.log('');
      console.log(chalk.yellow('Use --force to install anyway, or review the packages first.'));
      process.exitCode = 1;
      return;
    }

    spinner.text = 'Installing packages...';
    
    try {
      execSync(`npm install ${packages.join(' ')}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      spinner.succeed('Packages installed successfully!');
    } catch (installError) {
      spinner.fail('Installation failed');
      process.exitCode = 1;
    }

  } catch (error) {
    spinner.fail(`Safe install failed: ${error.message}`);
    process.exitCode = 2;
  }
}

async function handleSafeInstall(dependencies, options) {
  const highRisk = dependencies.filter(d => d.analysis?.riskLevel === 'high');
  
  if (highRisk.length > 0) {
    console.log('');
    console.log(chalk.red.bold('⚠ High-risk packages detected - installation blocked'));
    console.log(chalk.red('Review the packages above and address security concerns before installing.'));
    return;
  }

  console.log('');
  console.log(chalk.green('✓ No high-risk packages detected. Safe to install.'));
}

module.exports = { createCLI, runScan, runPackageCheck, runSafeInstall };
