"use client"

import { useState } from "react"
import { Shield, AlertTriangle, AlertCircle, Info, Download, Sparkles, ExternalLink, Github, Globe, Code, GitFork, Star, Users, GitPullRequest, AlertOctagon, Calendar, Package, TrendingUp, FileCode, Zap, TestTube, Lock, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScanResult, PackageAnalysis } from "@/lib/package-scanner"
import { TrustScoreChart } from "./trust-score-chart"
import { VulnerabilityList } from "./vulnerability-list"
import { exportToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

interface ScanResultsProps {
  result: ScanResult
}

export function ScanResults({ result }: ScanResultsProps) {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0)
  
  const severityColor = (count: number) => {
    if (count === 0) return "text-green-500"
    if (count < 5) return "text-yellow-500"
    return "text-red-500"
  }

  const handleExportPDF = () => {
    exportToPDF(result, null)
    toast.success("PDF exported successfully!")
  }

  const selectedPackage = result.packages[selectedPackageIndex]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.totalPackages}</div>
            <p className="text-xs text-muted-foreground">
              {result.vulnerablePackages} vulnerable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className={`h-4 w-4 ${severityColor(result.criticalCount)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${severityColor(result.criticalCount)}`}>
              {result.criticalCount}
            </div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${severityColor(result.highCount)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${severityColor(result.highCount)}`}>
              {result.highCount}
            </div>
            <p className="text-xs text-muted-foreground">Should be addressed soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground">
              {result.mediumCount} medium, {result.lowCount} low
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scanned Packages Selector - Only show if multiple packages */}
      {result.packages.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Scanned Packages ({result.packages.length})
            </CardTitle>
            <CardDescription>
              Select a package to view detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.packages.map((pkg, index) => (
                <Button
                  key={index}
                  variant={selectedPackageIndex === index ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setSelectedPackageIndex(index)}
                >
                  <Package className="h-4 w-4" />
                  {pkg.package.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Package Details */}
      {selectedPackage && (
        <div className="space-y-4">
          {result.packages.length > 1 && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Package {selectedPackageIndex + 1} of {result.packages.length}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedPackageIndex === 0}
                  onClick={() => setSelectedPackageIndex(selectedPackageIndex - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedPackageIndex === result.packages.length - 1}
                  onClick={() => setSelectedPackageIndex(selectedPackageIndex + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          <PackageCard analysis={selectedPackage} />
        </div>
      )}

      {/* All Vulnerabilities and Trust Scores Tabs */}
      <Tabs defaultValue="vulnerabilities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vulnerabilities">All Vulnerabilities</TabsTrigger>
          <TabsTrigger value="trust">Trust Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities">
          <VulnerabilityList packages={result.packages} />
        </TabsContent>

        <TabsContent value="trust">
          <TrustScoreChart packages={result.packages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CircularTrustScore({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 80) return "#22c55e"
    if (score >= 60) return "#eab308"
    return "#ef4444"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="160" height="160" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted"
          opacity="0.2"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: getColor() }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className="text-xs text-muted-foreground mt-1">Trust Score</span>
      </div>
    </div>
  )
}

function PackageCard({ analysis }: { analysis: PackageAnalysis }) {
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getRunLocallyCommand = () => {
    const { name, ecosystem } = analysis.package
    if (ecosystem === 'npm') return `npm install ${name}`
    if (ecosystem === 'python') return `pip install ${name}`
    if (ecosystem === 'docker') return `docker pull ${name}`
    return ''
  }

  const handleRunLocally = async () => {
    const command = getRunLocallyCommand()
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(command)
      setCopied(true)
      toast.success(`Copied: ${command}`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for iframe or unsupported browsers
      const textArea = document.createElement('textarea')
      textArea.value = command
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success(`Copied: ${command}`)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        toast.error('Failed to copy command')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    // Check if in iframe
    const isInIframe = window.self !== window.top
    if (isInIframe) {
      // Post message to parent to open URL
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*")
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const generatePackageInsights = async () => {
    setLoadingAI(true)
    try {
      const response = await fetch('/api/package-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      })
      
      if (!response.ok) throw new Error('Failed to generate insights')
      
      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      toast.error('Failed to generate AI insights')
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <CardTitle className="text-xl truncate">
                {analysis.package.name}
              </CardTitle>
              <Badge variant="outline">
                v{analysis.metadata.currentVersion || analysis.package.version}
              </Badge>
              {analysis.metadata.latestVersion && 
               analysis.metadata.latestVersion !== analysis.metadata.currentVersion && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  v{analysis.metadata.latestVersion} available
                </Badge>
              )}
              {analysis.metadata.isDeprecated && (
                <Badge variant="destructive">Deprecated</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {analysis.package.ecosystem}
              </Badge>
            </div>
            
            {/* AI-Generated Description */}
            {analysis.aiDescription && (
              <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {analysis.aiDescription}
                  </p>
                </div>
              </div>
            )}
            
            {!analysis.aiDescription && (
              <CardDescription className="line-clamp-2">
                {analysis.metadata.description || 'No description available'}
              </CardDescription>
            )}
            
            {/* Quick Links */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {analysis.metadata.githubUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => handleLinkClick(analysis.metadata.githubUrl!, e)}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
              {analysis.metadata.npmUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => handleLinkClick(analysis.metadata.npmUrl!, e)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Package
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
              {analysis.metadata.officialUrl && analysis.metadata.officialUrl !== analysis.metadata.npmUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => handleLinkClick(analysis.metadata.officialUrl!, e)}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
              <Button 
                variant="default" 
                size="sm"
                onClick={handleRunLocally}
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied!' : 'Run Locally'}
              </Button>
            </div>
          </div>
          
          {/* Circular Trust Score */}
          <div className="flex-shrink-0">
            <CircularTrustScore score={analysis.trustScore} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* AI-Powered Insights Section */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </h4>
            {!aiInsights && (
              <Button 
                size="sm" 
                onClick={generatePackageInsights}
                disabled={loadingAI}
              >
                {loadingAI ? 'Analyzing...' : 'Generate Insights'}
              </Button>
            )}
          </div>
          
          {aiInsights && (
            <div className="space-y-4">
              {/* Version Recommendations */}
              {aiInsights.versionRecommendation && (
                <div className="p-3 bg-background rounded-md border">
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Version Recommendation
                  </h5>
                  <p className="text-sm text-muted-foreground">{aiInsights.versionRecommendation}</p>
                  {aiInsights.suggestedVersion && (
                    <Badge variant="secondary" className="mt-2">
                      Suggested: v{aiInsights.suggestedVersion}
                    </Badge>
                  )}
                </div>
              )}

              {/* Issues & Downgrade Suggestion */}
              {aiInsights.issuesFound && (
                <div className="p-3 bg-background rounded-md border border-orange-500/20">
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Known Issues
                  </h5>
                  <p className="text-sm text-muted-foreground">{aiInsights.issuesFound}</p>
                  {aiInsights.safeVersion && (
                    <Badge variant="outline" className="mt-2 border-green-500 text-green-700 dark:text-green-400">
                      Stable: v{aiInsights.safeVersion}
                    </Badge>
                  )}
                </div>
              )}

              {/* Alternative Packages */}
              {aiInsights.alternatives && aiInsights.alternatives.length > 0 && (
                <div className="p-3 bg-background rounded-md border">
                  <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Alternative Packages
                  </h5>
                  <div className="space-y-3">
                    {aiInsights.alternatives.map((alt: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{alt.name}</span>
                            {alt.stats && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {formatNumber(alt.stats.stars)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {formatNumber(alt.stats.downloads)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{alt.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Recommendations */}
              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div className="p-3 bg-background rounded-md border">
                  <h5 className="text-sm font-semibold mb-2">Key Recommendations</h5>
                  <ul className="space-y-1">
                    {aiInsights.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analysis.metadata.bundleSize && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Bundle Size</p>
                <p className="text-sm font-semibold">{analysis.metadata.bundleSize}</p>
              </div>
            </div>
          )}
          {analysis.metadata.maintainers !== undefined && analysis.metadata.maintainers > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Maintainers</p>
                <p className="text-sm font-semibold">{analysis.metadata.maintainers}</p>
              </div>
            </div>
          )}
          {analysis.metadata.hasTests && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <TestTube className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Tests</p>
                <p className="text-sm font-semibold">✓ Included</p>
              </div>
            </div>
          )}
          {analysis.metadata.hasSecurity && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Lock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Security</p>
                <p className="text-sm font-semibold">✓ Policy</p>
              </div>
            </div>
          )}
        </div>

        {/* GitHub Stats */}
        {analysis.githubStats && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 text-yellow-500 mb-1" />
                <span className="text-2xl font-bold">{formatNumber(analysis.githubStats.stars)}</span>
                <span className="text-xs text-muted-foreground">Stars</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <GitFork className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-2xl font-bold">{formatNumber(analysis.githubStats.forks)}</span>
                <span className="text-xs text-muted-foreground">Forks</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-2xl font-bold">{formatNumber(analysis.githubStats.contributors)}</span>
                <span className="text-xs text-muted-foreground">Contributors</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <GitPullRequest className="h-5 w-5 text-purple-500 mb-1" />
                <span className="text-2xl font-bold">{formatNumber(analysis.githubStats.pullRequests)}</span>
                <span className="text-xs text-muted-foreground">Pull Requests</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <AlertOctagon className="h-5 w-5 text-orange-500 mb-1" />
                <span className="text-2xl font-bold">{formatNumber(analysis.githubStats.openIssues)}</span>
                <span className="text-xs text-muted-foreground">Open Issues</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-500 mb-1" />
                <span className="text-sm font-bold">{formatDate(analysis.githubStats.lastCommit)}</span>
                <span className="text-xs text-muted-foreground">Last Commit</span>
              </div>
            </div>
          </div>
        )}

        {/* Download Stats */}
        {analysis.downloadStats && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Download Statistics
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {analysis.downloadStats.lastDay !== undefined && (
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Download className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-2xl font-bold">{formatNumber(analysis.downloadStats.lastDay)}</span>
                  <span className="text-xs text-muted-foreground">Last Day</span>
                </div>
              )}
              {analysis.downloadStats.lastWeek !== undefined && (
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Download className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-2xl font-bold">{formatNumber(analysis.downloadStats.lastWeek)}</span>
                  <span className="text-xs text-muted-foreground">Last Week</span>
                </div>
              )}
              {analysis.downloadStats.lastMonth !== undefined && (
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Download className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-2xl font-bold">{formatNumber(analysis.downloadStats.lastMonth)}</span>
                  <span className="text-xs text-muted-foreground">Last Month</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trust Score Breakdown - Professional Colors */}
        <div>
          <h4 className="font-semibold mb-3 text-sm">Trust Score Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Security Box - Professional Blue */}
            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {analysis.trustScoreBreakdown.security}%
                </div>
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Security
                </div>
              </div>
            </div>

            {/* Maintenance Box - Professional Violet */}
            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/30 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-md">
                  <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {analysis.trustScoreBreakdown.maintenance}%
                </div>
                <div className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                  Maintenance
                </div>
              </div>
            </div>

            {/* Popularity Box - Professional Amber */}
            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-md">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {analysis.trustScoreBreakdown.popularity}%
                </div>
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Popularity
                </div>
              </div>
            </div>

            {/* Dependencies Box - Professional Emerald */}
            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-md">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {analysis.trustScoreBreakdown.dependencies}%
                </div>
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Dependencies
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Metadata */}
        <div>
          <h4 className="font-semibold mb-3">Package Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {analysis.metadata.license && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">License</span>
                <Badge variant="outline" className="w-fit">{analysis.metadata.license}</Badge>
              </div>
            )}
            {analysis.metadata.author && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">Author</span>
                <span className="font-medium truncate">{analysis.metadata.author}</span>
              </div>
            )}
            {analysis.metadata.lastPublish && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">Last Updated</span>
                <span className="font-medium">{formatDate(analysis.metadata.lastPublish)}</span>
              </div>
            )}
            {analysis.githubStats?.language && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">Language</span>
                <span className="font-medium">{analysis.githubStats.language}</span>
              </div>
            )}
            {analysis.metadata.dependencies && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">Dependencies</span>
                <span className="font-medium">{Object.keys(analysis.metadata.dependencies).length}</span>
              </div>
            )}
            {analysis.githubStats?.createdAt && (
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1">Created</span>
                <span className="font-medium">{formatDate(analysis.githubStats.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vulnerabilities */}
        {analysis.vulnerabilities.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Security Vulnerabilities ({analysis.vulnerabilities.length})
            </h4>
            <div className="space-y-3">
              {analysis.vulnerabilities.map((vuln, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{vuln.title}</span>
                        <Badge
                          variant={
                            vuln.severity === 'critical' ? 'destructive' :
                            vuln.severity === 'high' ? 'destructive' :
                            vuln.severity === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {vuln.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </div>
                    {vuln.cvss && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold">{vuln.cvss}</div>
                        <div className="text-xs text-muted-foreground">CVSS</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge variant="outline">{vuln.id}</Badge>
                    {vuln.cwe && vuln.cwe.map(cwe => (
                      <Badge key={cwe} variant="outline">{cwe}</Badge>
                    ))}
                  </div>
                  {vuln.fixedIn && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                        ✓ Fixed in version {vuln.fixedIn}
                      </Badge>
                    </div>
                  )}
                  {vuln.references && vuln.references.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground mb-1 block">References:</span>
                      {vuln.references.slice(0, 2).map((ref, idx) => (
                        <a 
                          key={idx}
                          href={ref} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {ref.length > 50 ? ref.substring(0, 50) + '...' : ref}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics/Tags */}
        {analysis.githubStats?.topics && analysis.githubStats.topics.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Topics</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.githubStats.topics.slice(0, 10).map((topic, i) => (
                <Badge key={i} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}