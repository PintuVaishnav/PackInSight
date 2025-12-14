"use client"

import { useState, useEffect } from "react"
import { Shield, History, Github, Mail, LogOut, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"
import { PackageSearch } from "@/components/package-search"
import { ScanResults } from "@/components/scan-results"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession, authClient, signInWithGoogle, signInWithGithub } from "@/lib/auth-client"
import { ScanResult } from "@/lib/package-scanner"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { exportToPDF } from "@/lib/pdf-export"

// Google Icon Component
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

export default function Home() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  // Check if viewing a scan from history
  useEffect(() => {
    if (searchParams.get('view') === 'scan') {
      const storedScan = sessionStorage.getItem('viewScan')
      if (storedScan) {
        setScanResult(JSON.parse(storedScan))
        sessionStorage.removeItem('viewScan')
      }
    }
  }, [searchParams])

  // Handle OAuth callback errors
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(`Authentication failed: ${error}`)
      router.replace('/')
    }
  }, [searchParams, router])

  // Close dialog when session is established
  useEffect(() => {
    if (session?.user && showAuthDialog) {
      setShowAuthDialog(false)
      setOauthLoading(null)
    }
  }, [session, showAuthDialog])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      })

      if (error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Logged in successfully!")
        setShowAuthDialog(false)
        refetch()
      }
    } catch (error) {
      toast.error("Login failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string

    try {
      const { error } = await authClient.signUp.email({
        email,
        name,
        password,
      })

      if (error) {
        if (error.message?.includes('already exists')) {
          toast.error("User already exists")
        } else {
          toast.error("Registration failed")
        }
      } else {
        toast.success("Account created! Please log in.")
        setAuthMode('login')
      }
    } catch (error) {
      toast.error("Registration failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setOauthLoading('google')
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error("Google sign-in failed")
      setOauthLoading(null)
    }
  }

  const handleGithubSignIn = async () => {
    setOauthLoading('github')
    try {
      await signInWithGithub()
    } catch (error) {
      toast.error("GitHub sign-in failed")
      setOauthLoading(null)
    }
  }

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      await authClient.signOut({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      localStorage.removeItem("bearer_token")
      toast.success("Signed out successfully")
      refetch()
    } catch (error) {
      toast.error("Sign out failed")
    }
  }

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result)
    toast.success("Scan completed successfully!")
  }

  const handlePackageSearch = async (packageName: string, ecosystem: 'npm' | 'python' | 'docker') => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/scan-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageName, ecosystem }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to scan package')
      }

      const result = await response.json()
      setScanResult(result)
      toast.success(`Scanned ${packageName} successfully!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan package')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">PackInsight</h1>
          </div>
          <nav className="flex items-center gap-4">
            {session?.user && (
              <Button variant="ghost" onClick={() => router.push("/history")}>
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            )}
            <ThemeToggle />
            {isPending ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-md" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthDialog(true)}>
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Secure Your Dependencies
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Scan npm, Python, and Docker packages for security vulnerabilities with AI-powered insights
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Real-time vulnerability detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Trust Score (0-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>AI-powered recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!scanResult ? (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Package Search */}
            <PackageSearch onSearch={handlePackageSearch} />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or upload a file
                </span>
              </div>
            </div>

            {/* File Upload */}
            <FileUpload onScanComplete={handleScanComplete} />
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Supported File Types</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">NPM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">package.json</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Python</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">requirements.txt</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Docker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Dockerfile</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-3xl font-bold">Scan Results</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => {
                  exportToPDF(scanResult, null)
                  toast.success("PDF exported successfully!")
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => setScanResult(null)}>
                  New Scan
                </Button>
              </div>
            </div>
            <ScanResults result={scanResult} />
          </div>
        )}
      </main>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'login' 
                ? 'Sign in to save your scan history and access all features'
                : 'Create an account to track your security scans'}
            </DialogDescription>
          </DialogHeader>

          {/* OAuth Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              variant="outline" 
              className="w-full h-11" 
              onClick={handleGoogleSignIn}
              disabled={oauthLoading !== null || authLoading}
            >
              {oauthLoading === 'google' ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-11" 
              onClick={handleGithubSignIn}
              disabled={oauthLoading !== null || authLoading}
            >
              {oauthLoading === 'github' ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              Continue with GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
          
          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={authLoading || oauthLoading !== null}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={authLoading || oauthLoading !== null}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={authLoading || oauthLoading !== null}
                >
                  {authLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Sign In with Email
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                    disabled={authLoading || oauthLoading !== null}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={authLoading || oauthLoading !== null}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={8}
                    required
                    disabled={authLoading || oauthLoading !== null}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={authLoading || oauthLoading !== null}
                >
                  {authLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground pt-2">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                © 2024 PackInsight. Secure your dependencies.
              </span>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* Loading overlay for search */}
      {isSearching && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[300px]">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground text-center">
                  Scanning package for vulnerabilities...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}