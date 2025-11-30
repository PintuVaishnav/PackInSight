const axios = require('axios');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const NPM_API_URL = 'https://api.npmjs.org';

class Scanner {
  constructor(options = {}) {
    this.cache = new Map();
    this.timeout = options.timeout || 10000;
  }

  async scanProject(projectPath) {
    const packageJsonPath = path.resolve(projectPath, 'package.json');
    const packageLockPath = path.resolve(projectPath, 'package-lock.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`No package.json found at ${projectPath}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let lockFile = null;

    if (fs.existsSync(packageLockPath)) {
      lockFile = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    }

    const dependencies = this.extractDependencies(packageJson, lockFile);
    return dependencies;
  }

  async scanPackage(packageName) {
    const metadata = await this.fetchPackageMetadata(packageName);
    if (!metadata) {
      throw new Error(`Package "${packageName}" not found on npm registry`);
    }

    const latestVersion = metadata['dist-tags']?.latest || Object.keys(metadata.versions || {}).pop();
    const versionData = metadata.versions?.[latestVersion] || {};

    return [{
      name: packageName,
      version: latestVersion,
      metadata: this.extractMetadata(metadata, versionData),
      scripts: versionData.scripts || {},
      isDirectDependency: true
    }];
  }

  extractDependencies(packageJson, lockFile) {
    const deps = [];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [name, versionRange] of Object.entries(allDeps)) {
      let resolvedVersion = versionRange;
      
      if (lockFile?.packages) {
        const lockEntry = lockFile.packages[`node_modules/${name}`];
        if (lockEntry) {
          resolvedVersion = lockEntry.version || versionRange;
        }
      } else if (lockFile?.dependencies?.[name]) {
        resolvedVersion = lockFile.dependencies[name].version || versionRange;
      }

      deps.push({
        name,
        version: resolvedVersion.replace(/^[\^~>=<]/, ''),
        versionRange,
        isDirectDependency: true,
        isDev: !!packageJson.devDependencies?.[name]
      });
    }

    return deps;
  }

  async fetchPackageMetadata(packageName) {
    if (this.cache.has(packageName)) {
      return this.cache.get(packageName);
    }

    try {
      const response = await axios.get(
        `${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`,
        { timeout: this.timeout }
      );
      this.cache.set(packageName, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch metadata for ${packageName}: ${error.message}`);
    }
  }

  async fetchDownloadCount(packageName, period = 'last-week') {
    try {
      const response = await axios.get(
        `${NPM_API_URL}/downloads/point/${period}/${encodeURIComponent(packageName)}`,
        { timeout: this.timeout }
      );
      return response.data.downloads || 0;
    } catch (error) {
      return 0;
    }
  }

  extractMetadata(registryData, versionData) {
    const latestVersion = registryData['dist-tags']?.latest;
    const versionInfo = versionData || registryData.versions?.[latestVersion] || {};
    const timeData = registryData.time || {};

    return {
      name: registryData.name,
      description: registryData.description || '',
      latestVersion,
      license: versionInfo.license || registryData.license || 'UNLICENSED',
      author: this.parseAuthor(versionInfo.author || registryData.author),
      maintainers: (registryData.maintainers || []).map(m => m.name || m),
      repository: this.parseRepository(versionInfo.repository || registryData.repository),
      homepage: versionInfo.homepage || registryData.homepage || '',
      keywords: registryData.keywords || [],
      createdAt: timeData.created ? new Date(timeData.created) : null,
      updatedAt: timeData.modified ? new Date(timeData.modified) : null,
      versionPublishedAt: timeData[latestVersion] ? new Date(timeData[latestVersion]) : null,
      hasReadme: !!(registryData.readme && registryData.readme.length > 100),
      versionsCount: Object.keys(registryData.versions || {}).length,
      distTags: registryData['dist-tags'] || {},
      scripts: versionInfo.scripts || {},
      deprecated: versionInfo.deprecated || registryData.deprecated || null
    };
  }

  parseAuthor(author) {
    if (!author) return null;
    if (typeof author === 'string') return author;
    return author.name || author.email || null;
  }

  parseRepository(repo) {
    if (!repo) return null;
    if (typeof repo === 'string') return repo;
    return repo.url || null;
  }

  async enrichDependencies(dependencies, onProgress) {
    const enriched = [];
    let processed = 0;

    for (const dep of dependencies) {
      try {
        const metadata = await this.fetchPackageMetadata(dep.name);
        const downloads = await this.fetchDownloadCount(dep.name);

        if (metadata) {
          const versionData = metadata.versions?.[dep.version] || 
                              metadata.versions?.[metadata['dist-tags']?.latest] || {};
          
          enriched.push({
            ...dep,
            metadata: this.extractMetadata(metadata, versionData),
            downloads,
            scripts: versionData.scripts || {}
          });
        } else {
          enriched.push({
            ...dep,
            metadata: null,
            downloads: 0,
            scripts: {},
            notFound: true
          });
        }
      } catch (error) {
        enriched.push({
          ...dep,
          metadata: null,
          downloads: 0,
          scripts: {},
          error: error.message
        });
      }

      processed++;
      if (onProgress) {
        onProgress(processed, dependencies.length, dep.name);
      }
    }

    return enriched;
  }
}

module.exports = Scanner;
