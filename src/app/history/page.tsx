"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, FileText, Calendar, Package } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { ThemeToggle } from "@/components/theme-toggle"

interface ScanHistory {
  id: string
  scanType: string
  packagesScanned: number
  vulnerabilitiesFound: number
  scanDate: string
  fileName: string | null
  scanResults: string
}

export default function HistoryPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [scans, setScans] = useState<ScanHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchHistory()
    }
  }, [session])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScans(data)
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScan = async (scanId: string) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scanId }),
      })

      if (response.ok) {
        setScans(scans.filter(scan => scan.id !== scanId))
      }
    } catch (error) {
      console.error("Failed to delete scan:", error)
    }
  }

  const viewScan = (scan: ScanHistory) => {
    // Store scan result in sessionStorage for viewing
    sessionStorage.setItem("viewScan", scan.scanResults)
    router.push("/?view=scan")
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">PackInsight</h1>
            <nav className="flex gap-4">
              <Button variant="ghost" onClick={() => router.push("/")}>
                Dashboard
              </Button>
              <Button variant="ghost" className="font-semibold">
                History
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Scan History</h2>
          <p className="text-muted-foreground">
            View and manage your previous security scans
          </p>
        </div>

        {scans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start scanning your dependencies to see results here
              </p>
              <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scans.map((scan) => (
              <Card key={scan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {scan.fileName || "Unnamed Scan"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(scan.scanDate).toLocaleString()}
                        </span>
                        <Badge variant="outline">{scan.scanType.toUpperCase()}</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewScan(scan)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteScan(scan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{scan.packagesScanned}</div>
                      <div className="text-xs text-muted-foreground">Packages Scanned</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">
                        {scan.vulnerabilitiesFound}
                      </div>
                      <div className="text-xs text-muted-foreground">Vulnerabilities</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {scan.packagesScanned - (JSON.parse(scan.scanResults).vulnerablePackages || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Secure Packages</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {JSON.parse(scan.scanResults).criticalCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Critical Issues</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
