// src/app/HomeClient.tsx
"use client"

import { useState, useEffect } from "react"
import { Shield, History, Github, LogOut, User, Download, Zap, Lock, ChevronRight, ArrowRight, Scan, Moon, Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
import { PackageSearch } from "@/components/package-search"
import { ScanResults } from "@/components/scan-results"
import { TorchHero } from "@/components/torch-hero"
import { useSession, authClient, signInWithGoogle, signInWithGithub } from "@/lib/auth-client"
import { ScanResult } from "@/lib/package-scanner"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { exportToPDF } from "@/lib/pdf-export"

// Google Icon Component
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

// NPM Logo
const NpmLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" className={className || "h-8 w-8"}>
    <rect fill="#C12127" width="256" height="256" rx="8" />
    <path fill="#fff" d="M48 48v160h80v-32h48v32h32V48H48zm128 128h-16v-64h-32v64H80V80h96v96z" />
  </svg>
)

// Python Logo
const PythonLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 255" className={className || "h-8 w-8"}>
    <defs>
      <linearGradient id="pyA" x1="12.959%" x2="79.639%" y1="12.039%" y2="78.201%">
        <stop offset="0%" stopColor="#387EB8" />
        <stop offset="100%" stopColor="#366994" />
      </linearGradient>
      <linearGradient id="pyB" x1="19.128%" x2="90.742%" y1="20.579%" y2="88.429%">
        <stop offset="0%" stopColor="#FFE052" />
        <stop offset="100%" stopColor="#FFC331" />
      </linearGradient>
    </defs>
    <path fill="url(#pyA)" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" />
    <path fill="url(#pyB)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" />
  </svg>
)

// Docker Logo
const DockerLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 185" className={className || "h-8 w-8"}>
    <path fill="#2396ED" d="M250.716 70.497c-5.03-3.198-16.609-4.358-25.513-2.746-1.16-8.428-5.935-15.761-14.578-22.382l-4.971-3.327-3.327 4.97c-6.643 10.04-8.428 26.49-.905 37.435-3.133 1.745-9.26 4.102-17.366 3.94H.11c-3.649 20.96 2.423 48.16 17.172 66.69 14.49 18.139 36.228 27.365 64.728 27.365 61.657 0 107.28-28.395 128.632-80.035 8.395.162 26.49.066 35.757-17.69.226-.421 2.49-5.03 3.133-6.513l-.816-.518zM141.886 45.168h-23.053v23.053h23.053V45.168zm0-30.27h-23.053v23.053h23.053V14.898zm-30.27 30.27H88.563v23.053h23.053V45.168zm-30.27 0H58.293v23.053h23.053V45.168zm-30.27 30.27H28.023v23.053h23.053V75.438zm30.27 0H58.293v23.053h23.053V75.438zm30.27 0H88.563v23.053h23.053V75.438zm30.27 0h-23.053v23.053h23.053V75.438zm30.27 0h-23.053v23.053h23.053V75.438z" />
  </svg>
)

export default function HomeClient() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  // Theme initialization
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', isDark)
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }
  }, [isDark, mounted])

  const toggleTheme = () => setIsDark(!isDark)

  useEffect(() => {
    if (searchParams.get('view') === 'scan') {
      const storedScan = sessionStorage.getItem('viewScan')
      if (storedScan) {
        setScanResult(JSON.parse(storedScan))
        sessionStorage.removeItem('viewScan')
      }
    }
  }, [searchParams])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(`Authentication failed: ${error}`)
      router.replace('/')
    }
  }, [searchParams, router])

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

  // Theme colors
  const bgMain = isDark ? 'bg-black' : 'bg-white'
  const bgCard = isDark ? 'bg-neutral-900' : 'bg-gray-50'
  const bgCardHover = isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
  const bgMuted = isDark ? 'bg-neutral-800' : 'bg-gray-100'
  const bgInput = isDark ? 'bg-neutral-900' : 'bg-white'
  const textPrimary = isDark ? 'text-white' : 'text-black'
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-600'
  const textMuted = isDark ? 'text-neutral-500' : 'text-gray-500'
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200'
  const borderColorHover = isDark ? 'hover:border-neutral-600' : 'hover:border-gray-400'
  const btnPrimary = isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
  const btnGhost = isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-black'
  const btnOutline = isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : 'border-gray-300 text-black hover:bg-gray-100'

  const glowColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const glowColorStrong = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgMain} ${textPrimary} overflow-x-hidden transition-colors duration-300`}>
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px 0 ${glowColor}; }
          50% { box-shadow: 0 0 40px 5px ${glowColorStrong}; }
        }

        @keyframes border-glow {
          0%, 100% { border-color: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; }
          50% { border-color: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        
        .animate-float-bounce {
          animation: float-bounce 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow-pulse 3s ease-in-out infinite;
        }

        .animate-border-glow {
          animation: border-glow 2s ease-in-out infinite;
        }

        .glow-card:hover {
          box-shadow: 0 0 40px -10px ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'};
        }

        .text-glow {
          text-shadow: 0 0 30px ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'};
        }

        .btn-glow:hover {
          box-shadow: 0 0 30px -5px ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'};
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#404040' : '#d1d5db'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#525252' : '#9ca3af'};
        }
      `}</style>

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${borderColor} ${bgMain}/90 backdrop-blur-xl transition-all duration-500`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => { setScanResult(null); router.push('/') }}
          >
            <Shield className={`h-6 w-6 sm:h-8 sm:w-8 transition-all duration-300 ${isDark ? 'text-white' : 'text-black'}`} />
            <span className="text-xl sm:text-2xl font-bold tracking-tight">PackInsight</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {session?.user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/history")}
                className={`${btnGhost} transition-all duration-300 px-2 sm:px-3 rounded-lg`}
              >
                <History className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`h-9 w-9 rounded-lg ${btnGhost} transition-all duration-300`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isPending ? (
              <div className={`h-9 sm:h-10 w-20 sm:w-28 animate-pulse ${bgMuted} rounded-lg`} />
            ) : session?.user ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${bgMuted} border ${borderColor}`}>
                  {session.user.image ? (
                    <img src={session.user.image} alt="Profile" className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" />
                  ) : (
                    <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full ${bgCard} flex items-center justify-center`}>
                      <User className={`h-3 w-3 sm:h-4 sm:w-4 ${textSecondary}`} />
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className={`h-9 w-9 rounded-lg ${btnGhost} transition-all duration-300`}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                className={`font-medium px-4 sm:px-5 h-9 sm:h-10 text-sm rounded-lg transition-all duration-300 ${btnPrimary} btn-glow`}
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Login</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section with Torch Effect - Only show when no scan result */}
      {!scanResult && (
        <TorchHero
          isDark={isDark}
          textSecondary={textSecondary}
          bgMuted={bgMuted}
          borderColor={borderColor}
          borderColorHover={borderColorHover}
        />
      )}

      {/* Main Content */}
      <main className={`relative container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 transition-all duration-1000`}>
        {!scanResult ? (
          <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">

            {/* Package Search */}
            <div className={`glow-card relative ${bgCard} border ${borderColor} rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-500`}>
              <PackageSearch onSearch={handlePackageSearch} />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full h-px ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              </div>
              <div className="relative">
                <span className={`px-6 py-2 text-sm ${textSecondary} ${bgMain} rounded-full border ${borderColor} font-medium`}>
                  Or upload a file
                </span>
              </div>
            </div>

            {/* File Upload */}
            <div className={`glow-card relative ${bgCard} border ${borderColor} rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-500`}>
              <FileUpload onScanComplete={handleScanComplete} />
            </div>

            {/* Supported Ecosystems */}
            <div className="pt-8 sm:pt-12">
              <div className="text-center mb-10 sm:mb-14">
                <h3 className="text-2xl sm:text-3xl font-semibold mb-3 text-glow">Supported Ecosystems</h3>
                <p className={`${textSecondary} text-base sm:text-lg`}>Analyze packages from popular ecosystems</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { name: "NPM", file: "package.json", desc: "JavaScript & Node.js", Logo: NpmLogo },
                  { name: "Python", file: "requirements.txt", desc: "Python packages", Logo: PythonLogo },
                  { name: "Docker", file: "Dockerfile", desc: "Container images", Logo: DockerLogo }
                ].map((item, i) => (
                  <div key={i} className="group relative">
                    <div className={`glow-card relative ${bgCard} border ${borderColor} rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 hover:-translate-y-2`}>
                      <div className="flex justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300">
                        <div className={`p-4 rounded-2xl ${bgMuted} border ${borderColor} group-hover:animate-glow transition-all duration-300`}>
                          <item.Logo className="h-10 w-10" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{item.name}</h4>
                      <p className={`text-sm ${textSecondary} mb-4`}>{item.desc}</p>
                      <code className={`text-xs ${textMuted} ${bgMuted} px-3 py-1.5 rounded-lg font-mono`}>
                        {item.file}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${borderColor}`}>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-glow">Scan Results</h2>
                <p className={textSecondary}>Analysis complete • {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    exportToPDF(scanResult, null)
                    toast.success("PDF exported successfully!")
                  }}
                  variant="outline"
                  className={`flex-1 sm:flex-none font-medium rounded-lg border ${btnOutline}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={() => setScanResult(null)}
                  className={`flex-1 sm:flex-none font-medium rounded-lg ${btnPrimary} btn-glow`}
                >
                  New Scan
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScanResults result={scanResult} />
          </div>
        )}
      </main>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className={`w-[95vw] max-w-[440px] max-h-[90vh] overflow-y-auto ${bgCard} border ${borderColor} ${textPrimary} p-0 rounded-2xl sm:rounded-3xl gap-0 [&>button]:hidden`}>
          <div className="relative p-6 sm:p-8">
            <button
              onClick={() => setShowAuthDialog(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${bgMuted} ${borderColor} border ${btnGhost} transition-all duration-300 z-10`}
            >
              <X className="h-4 w-4" />
            </button>

            <DialogHeader className="text-center mb-6">
              <div className="relative mx-auto w-14 h-14 mb-4">
                <div className={`w-full h-full rounded-2xl ${bgMuted} border ${borderColor} flex items-center justify-center animate-glow`}>
                  <Shield className="h-7 w-7" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </DialogTitle>
              <DialogDescription className={`${textSecondary} mt-2`}>
                {authMode === 'login'
                  ? 'Sign in to save your scan history and access all features'
                  : 'Create an account to track your security scans'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Button
                variant="outline"
                className={`w-full h-12 rounded-xl font-medium transition-all duration-300 ${bgInput} border ${borderColor} ${borderColorHover} ${bgCardHover} btn-glow`}
                onClick={handleGoogleSignIn}
                disabled={oauthLoading !== null || authLoading}
              >
                {oauthLoading === 'google' ? (
                  <div className={`h-5 w-5 mr-2 animate-spin rounded-full border-2 ${isDark ? 'border-white' : 'border-black'} border-t-transparent`} />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className={`w-full h-12 rounded-xl font-medium transition-all duration-300 ${bgInput} border ${borderColor} ${borderColorHover} ${bgCardHover} btn-glow`}
                onClick={handleGithubSignIn}
                disabled={oauthLoading !== null || authLoading}
              >
                {oauthLoading === 'github' ? (
                  <div className={`h-5 w-5 mr-2 animate-spin rounded-full border-2 ${isDark ? 'border-white' : 'border-black'} border-t-transparent`} />
                ) : (
                  <Github className="mr-2 h-5 w-5" />
                )}
                Continue with GitHub
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full h-px ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              </div>
              <div className="relative flex justify-center">
                <span className={`px-4 text-xs uppercase ${textMuted} ${bgCard} tracking-wider font-medium`}>
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
              <TabsList className={`grid w-full grid-cols-2 h-11 p-1 rounded-xl ${bgMuted}`}>
                <TabsTrigger
                  value="login"
                  className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={authLoading || oauthLoading !== null}
                      className={`h-12 rounded-xl transition-all ${bgInput} border ${borderColor} focus:border-neutral-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={authLoading || oauthLoading !== null}
                      className={`h-12 rounded-xl transition-all ${bgInput} border ${borderColor} focus:border-neutral-500`}
                    />
                  </div>
                  <Button
                    type="submit"
                    className={`w-full h-12 rounded-xl font-semibold mt-2 ${btnPrimary} btn-glow`}
                    disabled={authLoading || oauthLoading !== null}
                  >
                    {authLoading ? (
                      <>
                        <div className={`h-4 w-4 mr-2 animate-spin rounded-full border-2 ${isDark ? 'border-black' : 'border-white'} border-t-transparent`} />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-medium">Name</Label>
                    <Input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      required
                      disabled={authLoading || oauthLoading !== null}
                      className={`h-12 rounded-xl transition-all ${bgInput} border ${borderColor} focus:border-neutral-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={authLoading || oauthLoading !== null}
                      className={`h-12 rounded-xl transition-all ${bgInput} border ${borderColor} focus:border-neutral-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      disabled={authLoading || oauthLoading !== null}
                      className={`h-12 rounded-xl transition-all ${bgInput} border ${borderColor} focus:border-neutral-500`}
                    />
                    <p className={`text-xs ${textMuted}`}>Minimum 8 characters</p>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full h-12 rounded-xl font-semibold mt-2 ${btnPrimary} btn-glow`}
                    disabled={authLoading || oauthLoading !== null}
                  >
                    {authLoading ? (
                      <>
                        <div className={`h-4 w-4 mr-2 animate-spin rounded-full border-2 ${isDark ? 'border-black' : 'border-white'} border-t-transparent`} />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className={`text-xs text-center ${textMuted} pt-6`}>
              By continuing, you agree to our{" "}
              <a href="#" className={`underline ${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>Terms</a>
              {" "}and{" "}
              <a href="#" className={`underline ${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>Privacy Policy</a>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className={`relative border-t ${borderColor} mt-20 sm:mt-28 z-10`}>
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className={`h-5 w-5 ${textSecondary}`} />
              <span className={`text-sm ${textSecondary}`}>© 2025 PackInsight. All rights reserved.</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-lg ${btnGhost} transition-all`}
              asChild
            >
              <a href="https://github.com/PintuVaishnav/PackInSight" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </footer>

      {/* Loading Overlay for Package Search */}
      {isSearching && (
        <div className={`fixed inset-0 ${bgMain}/95 backdrop-blur-xl z-50 flex items-center justify-center p-4`}>
          <div className="relative w-full max-w-sm">
            <div className={`${bgCard} border ${borderColor} rounded-3xl p-10 text-center shadow-2xl animate-glow`}>
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className={`absolute inset-0 rounded-full border-4 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`} />
                <div className={`absolute inset-0 rounded-full border-4 ${isDark ? 'border-white' : 'border-black'} border-t-transparent animate-spin`} />
                <div className={`absolute inset-4 rounded-full border-2 ${isDark ? 'border-neutral-700' : 'border-gray-300'}`} />
                <div className={`absolute inset-4 rounded-full border-2 ${isDark ? 'border-neutral-400' : 'border-gray-500'} border-t-transparent animate-spin`} style={{ animationDuration: '0.75s', animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scan className="h-6 w-6 animate-pulse" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2 text-glow">Analyzing Package</h3>
              <p className={textSecondary}>Scanning for vulnerabilities...</p>

              <div className="flex items-center justify-center gap-2 mt-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'} animate-pulse`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}