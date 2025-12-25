# Package Search Feature

## Overview
PackInsight now includes a powerful real-time search feature that allows you to search and scan individual packages across three ecosystems:
- **NPM** - JavaScript/Node.js packages
- **Python (PyPI)** - Python libraries
- **Docker Hub** - Container images

## Features

### 🔍 Real-Time Autocomplete
- Type at least 2 characters to see suggestions
- Suggestions appear instantly as you type (300ms debounce)
- Each suggestion shows:
  - Package name
  - Description (truncated to 100 characters)
  - Latest version number

### ⌨️ Keyboard Navigation
- **Arrow Down** - Move to next suggestion
- **Arrow Up** - Move to previous suggestion
- **Enter** - Select highlighted suggestion or search current query
- **Escape** - Close suggestions dropdown

### 🎯 Smart Search
- **NPM**: Uses official NPM registry API for accurate, up-to-date results
- **Python**: Searches PyPI with intelligent fallbacks
- **Docker**: Searches Docker Hub registry for container images

### 📊 Package Scanning
After selecting a package:
1. Automatic vulnerability scan
2. Trust score calculation (0-100)
3. Detailed analysis including:
   - Security vulnerabilities (by severity)
   - Maintenance status
   - Popularity metrics
   - Dependency analysis
   - Package metadata (license, author, homepage, etc.)

## API Endpoints

### Search API
```
GET /api/search?q={query}&ecosystem={npm|python|docker}
```

**Parameters:**
- `q` - Search query (minimum 2 characters)
- `ecosystem` - One of: npm, python, docker

**Response:**
```json
[
  {
    "name": "react",
    "description": "React is a JavaScript library for building user interfaces.",
    "version": "19.2.0"
  }
]
```

### Package Scan API
```
POST /api/scan-package
Content-Type: application/json

{
  "packageName": "react",
  "ecosystem": "npm"
}
```

**Response:**
```json
{
  "scanId": "scan-1234567890",
  "scanType": "npm",
  "fileName": "react (search)",
  "totalPackages": 1,
  "vulnerablePackages": 0,
  "totalVulnerabilities": 0,
  "packages": [
    {
      "package": {
        "name": "react",
        "version": "latest",
        "ecosystem": "npm"
      },
      "vulnerabilities": [],
      "trustScore": 90,
      "trustScoreBreakdown": {
        "security": 100,
        "maintenance": 100,
        "popularity": 50,
        "dependencies": 100
      },
      "metadata": {
        "description": "...",
        "license": "MIT",
        "homepage": "...",
        "repository": "...",
        "lastPublish": "2025-11-22T10:50:51.841Z"
      }
    }
  ]
}
```

## Usage Examples

### Example 1: Search NPM Package
1. Select "NPM" from ecosystem dropdown
2. Type "react" in search box
3. See suggestions appear with React, React-DOM, React-Router, etc.
4. Click on "react" or press Enter
5. View comprehensive security scan results

### Example 2: Search Python Library
1. Select "Python (PyPI)" from ecosystem dropdown
2. Type "django" in search box
3. See Django-related packages
4. Select and scan

### Example 3: Search Docker Image
1. Select "Docker" from ecosystem dropdown
2. Type "nginx" in search box
3. See official and community NGINX images
4. Select and scan for vulnerabilities

## Integration with File Upload
The search feature works alongside the existing file upload functionality:
- Use **search** for individual package analysis
- Use **file upload** for scanning entire dependency files (package.json, requirements.txt, Dockerfile)

Both methods provide the same comprehensive security analysis and Trust Score calculation.

## Benefits
✅ **Instant Results** - Real-time search with no page reloads
✅ **Multi-Ecosystem** - Support for NPM, Python, and Docker
✅ **Comprehensive Data** - Rich package information from official registries
✅ **Keyboard Accessible** - Full keyboard navigation support
✅ **Clean UI** - Intuitive dropdown with hover states
✅ **Error Handling** - Graceful error messages for failed requests
✅ **Loading States** - Visual feedback during searches and scans
