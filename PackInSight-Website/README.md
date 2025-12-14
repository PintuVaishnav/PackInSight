# PackInsight - Package Security Scanner

A powerful web application that scans npm, Python, and Docker packages for security vulnerabilities, popularity, and reliability.

![PackInsight](https://github.com/PintuVaishanv/post-images/blob/main/unnamed_16x9.png?raw=truefit=crop)

## Features

✅ **Multi-Ecosystem Support**
- NPM (package.json)
- Python (requirements.txt)
- Docker (Dockerfile)

✅ **Comprehensive Security Analysis**
- Real-time vulnerability detection
- Trust Score calculation (0-100)
- Severity classification (Critical, High, Medium, Low)
- Dependency breakdown analysis

✅ **AI-Powered Insights**
- Intelligent vulnerability summaries
- Upgrade/downgrade recommendations
- Alternative package suggestions
- Human-friendly and technical reports

✅ **User Features**
- Authentication with email/password
- Scan history tracking
- PDF export functionality
- Dark/light mode toggle
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Database credentials (provided via better-auth with Turso)

### Local Development

```bash
git clone <repository-url>
cd PackInSight/PackInSight-Website
npm install
```

### Run the development server

```bash
# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### 1. Upload a Dependency File

- Click on the file type selector (NPM/Python/Docker)
- Choose your dependency file:
  - **NPM**: package.json
  - **Python**: requirements.txt
  - **Docker**: Dockerfile
- Click "Scan for Vulnerabilities"

### 2. Review Results

The scan results include:

- **Overview Cards**: Total packages, critical issues, vulnerabilities
- **AI-Powered Insights**: Get intelligent recommendations
- **Package Details**: Individual package analysis with trust scores
- **Vulnerability List**: Complete list of security issues
- **Trust Score Charts**: Visual breakdown of package reliability

### 3. Export and Save

- Export results as PDF
- Save scan history (requires sign-in)
- View past scans in the History page


## Trust Score Algorithm

PackInsight calculates a comprehensive Trust Score (0-100) based on:

- **Security (40%)**: Vulnerability count and severity
- **Maintenance (25%)**: Last update date and activity
- **Popularity (20%)**: Downloads, stars, community usage
- **Dependencies (15%)**: Dependency count and health

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Shadcn/UI + Tailwind CSS
- **Authentication**: Better-auth with Turso database
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Database**: Turso (SQLite)

## API Routes

- `POST /api/scan` - Scan dependency file
- `GET /api/search` - Package autocomplete
- `GET /api/history` - Fetch scan history
- `DELETE /api/history` - Delete scan
- `POST /api/ai-summary` - Generate AI insights

## Security Features

- Real-time vulnerability database
- CVE (Common Vulnerabilities and Exposures) tracking
- CVSS (Common Vulnerability Scoring System) scores
- CWE (Common Weakness Enumeration) classification
- Fix availability detection

## Architecture

```
src/
├── app/
│   ├── api/          # API routes
│   ├── history/      # Scan history page
│   └── page.tsx      # Main dashboard
├── components/
│   ├── ui/           # Shadcn components
│   ├── file-upload.tsx
│   ├── scan-results.tsx
│   ├── trust-score-chart.tsx
│   └── vulnerability-list.tsx
├── lib/
│   ├── package-scanner.ts  # Core scanning logic
│   ├── pdf-export.ts       # PDF generation
│   ├── auth.ts             # Auth configuration
│   └── auth-client.ts      # Client auth
└── db/
    └── schema.ts      # Database schema
```

## Environment Variables

The following environment variables are configured:

```env
# Database (Turso)
TURSO_CONNECTION_URL=<your-turso-url>
TURSO_AUTH_TOKEN=<your-turso-token>

# Better Auth
BETTER_AUTH_SECRET=<your-secret-key>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# GitHub OAuth
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# GitHub Token (for API access)
GITHUB_TOKEN=<your-github-token>
```
## Authentication Setup
```
# GitHub Authentication Setup
1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Set Homepage URL: http://localhost:3000
4. Set Authorization callback URL: http://localhost:3000/api/auth/callback/github
```
```
# Google Authentication Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add to Authorized JavaScript origins:http://localhost:3000
4. Add to Authorized redirect URIs:http://localhost:3000/api/auth/callback/google
```