"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PackageAnalysis } from "@/lib/package-scanner"
import { Shield, TrendingUp, Users, Package, AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface TrustScoreChartProps {
  packages: PackageAnalysis[]
}

export function TrustScoreChart({ packages }: TrustScoreChartProps) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 }
    if (score >= 60) return { label: 'Good', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertCircle }
    return { label: 'Poor', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: XCircle }
  }

  const getMetricColor = (metric: 'security' | 'maintenance' | 'popularity' | 'dependencies') => {
    const colors = {
      security: { 
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        iconBg: 'bg-slate-200 dark:bg-slate-700',
        iconColor: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700'
      },
      maintenance: { 
        bg: 'bg-violet-100 dark:bg-violet-900/20',
        text: 'text-violet-700 dark:text-violet-300',
        iconBg: 'bg-violet-200 dark:bg-violet-800/30',
        iconColor: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-200 dark:border-violet-800'
      },
      popularity: { 
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-200 dark:bg-amber-800/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800'
      },
      dependencies: { 
        bg: 'bg-emerald-100 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-200 dark:bg-emerald-800/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800'
      }
    }
    return colors[metric]
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-background via-muted/30 to-background border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              Trust Score Dashboard
            </CardTitle>
            <CardDescription className="mt-2">
              Comprehensive security and reliability analysis for {packages.length} {packages.length === 1 ? 'package' : 'packages'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Package Trust Score Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => {
            const status = getScoreStatus(pkg.trustScore)
            const StatusIcon = status.icon

            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/30 overflow-hidden"
              >
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate mb-1">
                        {pkg.package.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        v{pkg.package.version}
                      </CardDescription>
                    </div>
                    
                    {/* Trust Score Badge */}
                    <div className="flex flex-col items-center">
                      <div className={`relative w-20 h-20 rounded-full ${status.bg} ${status.border} border-2 flex items-center justify-center`}>
                        <div className="flex flex-col items-center relative z-10">
                          <span className={`text-2xl font-bold ${status.color}`}>
                            {pkg.trustScore}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <div className={`mt-2 flex items-center gap-1 px-2 py-1 rounded-full ${status.bg} ${status.border} border`}>
                        <StatusIcon className={`h-3 w-3 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative pt-0">
                  {/* Metric Boxes Grid - 2x2 Layout */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Security Box */}
                    <div className={`relative overflow-hidden rounded-lg border ${getMetricColor('security').border} ${getMetricColor('security').bg} p-4 transition-all duration-300 hover:shadow-md aspect-square flex flex-col items-center justify-center`}>
                      <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
                        <div className={`p-2 ${getMetricColor('security').iconBg} rounded-lg`}>
                          <Shield className={`h-5 w-5 ${getMetricColor('security').iconColor}`} />
                        </div>
                        <div className={`text-3xl font-bold ${getMetricColor('security').text}`}>
                          {pkg.trustScoreBreakdown.security}
                        </div>
                        <div className={`text-xs font-medium ${getMetricColor('security').text} uppercase tracking-wide`}>
                          Security
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Box */}
                    <div className={`relative overflow-hidden rounded-lg border ${getMetricColor('maintenance').border} ${getMetricColor('maintenance').bg} p-4 transition-all duration-300 hover:shadow-md aspect-square flex flex-col items-center justify-center`}>
                      <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
                        <div className={`p-2 ${getMetricColor('maintenance').iconBg} rounded-lg`}>
                          <TrendingUp className={`h-5 w-5 ${getMetricColor('maintenance').iconColor}`} />
                        </div>
                        <div className={`text-3xl font-bold ${getMetricColor('maintenance').text}`}>
                          {pkg.trustScoreBreakdown.maintenance}
                        </div>
                        <div className={`text-xs font-medium ${getMetricColor('maintenance').text} uppercase tracking-wide`}>
                          Maintenance
                        </div>
                      </div>
                    </div>

                    {/* Popularity Box */}
                    <div className={`relative overflow-hidden rounded-lg border ${getMetricColor('popularity').border} ${getMetricColor('popularity').bg} p-4 transition-all duration-300 hover:shadow-md aspect-square flex flex-col items-center justify-center`}>
                      <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
                        <div className={`p-2 ${getMetricColor('popularity').iconBg} rounded-lg`}>
                          <Users className={`h-5 w-5 ${getMetricColor('popularity').iconColor}`} />
                        </div>
                        <div className={`text-3xl font-bold ${getMetricColor('popularity').text}`}>
                          {pkg.trustScoreBreakdown.popularity}
                        </div>
                        <div className={`text-xs font-medium ${getMetricColor('popularity').text} uppercase tracking-wide`}>
                          Popularity
                        </div>
                      </div>
                    </div>

                    {/* Dependencies Box */}
                    <div className={`relative overflow-hidden rounded-lg border ${getMetricColor('dependencies').border} ${getMetricColor('dependencies').bg} p-4 transition-all duration-300 hover:shadow-md aspect-square flex flex-col items-center justify-center`}>
                      <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
                        <div className={`p-2 ${getMetricColor('dependencies').iconBg} rounded-lg`}>
                          <Package className={`h-5 w-5 ${getMetricColor('dependencies').iconColor}`} />
                        </div>
                        <div className={`text-3xl font-bold ${getMetricColor('dependencies').text}`}>
                          {pkg.trustScoreBreakdown.dependencies}
                        </div>
                        <div className={`text-xs font-medium ${getMetricColor('dependencies').text} uppercase tracking-wide`}>
                          Dependencies
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary Stats */}
        {packages.length > 1 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Security</p>
                    <p className="text-3xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                      {Math.round(packages.reduce((sum, p) => sum + p.trustScoreBreakdown.security, 0) / packages.length)}%
                    </p>
                  </div>
                  <Shield className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Maintenance</p>
                    <p className="text-3xl font-bold text-violet-700 dark:text-violet-300 mt-1">
                      {Math.round(packages.reduce((sum, p) => sum + p.trustScoreBreakdown.maintenance, 0) / packages.length)}%
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-violet-300 dark:text-violet-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Popularity</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                      {Math.round(packages.reduce((sum, p) => sum + p.trustScoreBreakdown.popularity, 0) / packages.length)}%
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-amber-300 dark:text-amber-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Dependencies</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                      {Math.round(packages.reduce((sum, p) => sum + p.trustScoreBreakdown.dependencies, 0) / packages.length)}%
                    </p>
                  </div>
                  <Package className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}