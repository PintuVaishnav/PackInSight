# PackInSight

## Overview
PackInSight is an AI-powered npm package security scanner CLI tool that analyzes dependencies for security risks and provides actionable recommendations.

## Project Structure
```
packinsight/
├── bin/
│   └── packinsight.js      # CLI entry point (executable)
├── src/
│   ├── scanner.js          # Dependency scanning and npm metadata fetching
│   ├── analyzer.js         # Risk analysis with heuristics
│   ├── ai.js               # AI-powered recommendations (OpenAI integration)
│   ├── reporter.js         # Output formatting (terminal/JSON)
│   ├── cli.js              # CLI commands and options
│   └── index.js            # Module exports
├── tests/
│   └── test.js             # Unit tests
├── package.json            # npm package configuration with bin entry
├── README.md               # Documentation
├── LICENSE                 # MIT License
└── .gitignore
```

## Key Features
- Scans package.json and package-lock.json files
- Fetches npm registry metadata (downloads, license, maintainers, etc.)
- Heuristic-based risk scoring (typosquatting, suspicious scripts, low downloads, etc.)
- AI recommendations via OpenAI API (optional)
- Color-coded terminal output with tables
- JSON output for CI/CD integration

## Commands
```bash
# Scan current project
packinsight scan

# Scan specific directory
packinsight scan /path/to/project

# Check single package
packinsight check lodash

# Safe install with pre-scan
packinsight install express axios

# JSON output
packinsight scan --json

# Verbose mode
packinsight scan --verbose
```

## Dependencies
- axios - HTTP requests to npm registry
- chalk - Terminal colors
- cli-table3 - Terminal tables
- commander - CLI argument parsing
- openai - AI recommendations
- ora - Loading spinners
- semver - Version utilities

## Environment Variables
- `OPENAI_API_KEY` - Required for AI-powered recommendations (optional feature)

## Recent Changes
- Initial implementation with all core modules
- All 17 unit and integration tests passing
- CLI fully functional with scan, check, and install commands
- Full enrichment pipeline verified with real npm registry data
