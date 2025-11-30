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
