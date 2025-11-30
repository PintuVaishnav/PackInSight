# PackInSight

AI-powered npm package security scanner with dependency analysis and risk recommendations.

PackInSight scans npm packages and Node.js projects to identify security risks, detect typosquatting attempts, analyze install scripts, and provide actionable recommendations powered by AI.

## Features

- **Dependency Scanning**: Analyze `package.json` and `package-lock.json` files
- **Risk Assessment**: Heuristic-based risk scoring for each dependency
- **Typosquatting Detection**: Identify packages with names similar to popular packages
- **Script Analysis**: Detect suspicious `preinstall`/`postinstall` scripts
- **AI Recommendations**: Get human-readable security insights (requires OpenAI API key)
- **Multiple Output Formats**: Terminal tables with colors or JSON for CI/CD
- **Safe Install**: Pre-scan packages before installing them

## Installation

### Global Installation

```bash
npm install -g packinsight
```

### Local Development

```bash
git clone <repository-url>
cd packinsight
npm install
npm link
```

## Usage

### Scan a Project

Scan your current project:
```bash
packinsight scan
```

Scan a specific directory:
```bash
packinsight scan /path/to/project
```

### Quick Package Check

Check a single package:
```bash
packinsight check lodash
packinsight check some-suspicious-package
```

### Safe Install

Pre-scan packages before installing:
```bash
packinsight install express axios lodash
```

Use `--force` to install even if high-risk packages are found:
```bash
packinsight install risky-package --force
```

### Command Options

```bash
# Output in JSON format (for CI/CD)
packinsight scan --json

# Dry run (scan without installing)
packinsight scan --dry-run

# Verbose output (show all warnings)
packinsight scan --verbose

# Disable AI recommendations
packinsight scan --no-ai

# Scan and then install if safe
packinsight scan --safe-install
```

## AI Recommendations

PackInSight can provide AI-powered security recommendations using OpenAI. To enable this feature:

1. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your-api-key
   ```

2. Run any scan command - AI recommendations will be automatically included

Without an API key, PackInSight will use built-in heuristic-based recommendations.

## Risk Levels

- **HIGH** (Red): Critical security concerns requiring immediate attention
  - Potential typosquatting
  - Suspicious install scripts
  - Very new packages with low adoption
  - Package not found in registry

- **MEDIUM** (Yellow): Moderate concerns to review
  - Low download counts
  - Recently published versions
  - Missing license
  - Deprecated packages

- **LOW** (Green): Minor or informational warnings
  - No repository URL
  - Unknown repository host
  - Missing README

## Risk Heuristics

PackInSight analyzes packages for:

1. **Download Count**: Low weekly downloads may indicate an obscure or malicious package
2. **Package Age**: Very new packages/versions may not be vetted by the community
3. **License**: Missing or unusual licenses may have legal implications
4. **Install Scripts**: `preinstall`/`postinstall` scripts can execute arbitrary code
5. **Typosquatting**: Names similar to popular packages may be malicious
6. **Repository**: Missing or unusual repository URLs may indicate suspicious packages
7. **Documentation**: Missing README may indicate low-quality or malicious packages
8. **Deprecation**: Deprecated packages should be replaced

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install PackInSight
        run: npm install -g packinsight
        
      - name: Run Security Scan
        run: packinsight scan --json > security-report.json
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

## Programmatic Usage

```javascript
const { Scanner, Analyzer, AIRecommender, Reporter } = require('packinsight');

async function scanProject() {
  const scanner = new Scanner();
  const analyzer = new Analyzer();
  const ai = new AIRecommender();
  const reporter = new Reporter({ json: false });

  // Scan dependencies
  const deps = await scanner.scanProject('./');
  
  // Enrich with metadata
  const enriched = await scanner.enrichDependencies(deps);
  
  // Analyze for risks
  const analyzed = analyzer.analyzeDependencies(enriched);
  
  // Add AI recommendations
  const withRecommendations = await ai.generateBatchRecommendations(analyzed);
  
  // Format output
  const output = reporter.formatResults(withRecommendations);
  console.log(output);
}

scanProject();
```

## Configuration

You can customize risk thresholds when using programmatically:

```javascript
const analyzer = new Analyzer({
  lowDownloads: 5000,           // Threshold for "low downloads" warning
  veryLowDownloads: 500,        // Threshold for "very low downloads" risk
  newPackageDays: 60,           // Days to consider a package "new"
  veryNewPackageDays: 14        // Days to consider a package "very new"
});
```

## Project Structure

```
packinsight/
├── bin/
│   └── packinsight.js      # CLI entry point
├── src/
│   ├── scanner.js          # Dependency scanning and metadata fetching
│   ├── analyzer.js         # Risk analysis and heuristics
│   ├── ai.js               # AI-powered recommendations
│   ├── reporter.js         # Output formatting
│   ├── cli.js              # CLI commands and options
│   └── index.js            # Module exports
├── tests/
│   └── test.js             # Basic tests
├── package.json
├── README.md
└── LICENSE
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.
