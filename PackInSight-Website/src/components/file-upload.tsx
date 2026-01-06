"use client"

import { useState, useRef } from "react"
import { Upload, FileText, Loader2, X, CheckCircle2, Package, FileCode, Container, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanResult } from "@/lib/package-scanner"

/* ---------- File Type Config (Grey Colors) ---------- */
const fileTypeConfig = {
  npm: {
    label: "NPM Package",
    icon: Package,
    fileName: "package.json",
  },
  python: {
    label: "Python Requirements",
    icon: FileCode,
    fileName: "requirements.txt",
  },
  docker: {
    label: "Dockerfile",
    icon: Container,
    fileName: "Dockerfile",
  },
}

/* ---------- Types ---------- */
interface FileUploadProps {
  onScanComplete: (result: ScanResult) => void
}

/* ---------- Component ---------- */
export function FileUpload({ onScanComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [scanType, setScanType] = useState<"npm" | "python" | "docker" | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  // Ref for programmatic file input click
  const inputRef = useRef<HTMLInputElement>(null)

  /* ---------- Detect Type ---------- */
  const detectType = (file: File) => {
    if (file.name === "package.json") return "npm"
    if (file.name === "requirements.txt") return "python"
    if (file.name.toLowerCase() === "dockerfile") return "docker"
    return null
  }

  /* ---------- Handlers ---------- */
  const handleFile = (f: File) => {
    const type = detectType(f)
    if (!type) {
      setError("Unsupported file. Upload package.json, requirements.txt, or Dockerfile.")
      setFile(null)
      setScanType(null)
      return
    }

    setFile(f)
    setScanType(type)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setScanType(null)
    setError(null)
    // Reset input value so same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleBrowseClick = () => {
    inputRef.current?.click()
  }

  const handleScan = async () => {
    if (!file || !scanType) return

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", scanType)

      const res = await fetch("/api/scan", { method: "POST", body: formData })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Scan failed")
      }

      const result = await res.json()
      onScanComplete(result)
    } catch (err: any) {
      setError(err.message || "Scan failed")
    } finally {
      setIsScanning(false)
    }
  }

  const config = scanType ? fileTypeConfig[scanType] : null
  const TypeIcon = config?.icon || FileText

  return (
    <Card className="w-full max-w-3xl mx-auto border shadow-lg bg-gradient-to-b from-card to-card/80">
      <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold">
          Upload Dependency File
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm md:text-base">
          Scan package.json, requirements.txt, or Dockerfile
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Hidden File Input */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".json,.txt,Dockerfile"
        />

        {/* Upload Area */}
        <div
          onClick={!file ? handleBrowseClick : undefined}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          className={`
            relative rounded-xl transition-all duration-200 ease-out
            ${file 
              ? "border-2 border-solid border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50" 
              : dragActive 
                ? "border-2 border-dashed border-primary bg-primary/5 cursor-pointer scale-[1.01]" 
                : "border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer"
            }
          `}
        >
          {file && scanType ? (
            /* ===== File Selected State ===== */
            <div className="flex items-center gap-3 p-3 sm:p-4">
              {/* File Icon */}
              <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <p className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px]">
                    {file.name}
                  </p>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • {config?.label}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBrowseClick()
                  }}
                  title="Change file"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                  onClick={handleRemoveFile}
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* ===== Empty State ===== */
            <div className="text-center py-6 px-4 sm:py-8 sm:px-6">
              {/* Upload Icon */}
              <div className={`
                mx-auto w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200
                ${dragActive 
                  ? "bg-primary text-primary-foreground scale-110" 
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}>
                <Upload className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 ${dragActive ? "-translate-y-0.5" : ""}`} />
              </div>
              
              {/* Text */}
              <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                {dragActive ? "Drop your file here" : "Drag & drop or click to browse"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Supported dependency files
              </p>

              {/* Supported Files - Grey Badges */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {Object.entries(fileTypeConfig).map(([key, { fileName, icon: Icon }]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                  >
                    <Icon className="h-3 w-3" />
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-2 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Upload failed</p>
              <p className="text-red-500 dark:text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* Scan Button */}
        <Button
          onClick={handleScan}
          disabled={!file || isScanning}
          size="lg"
          className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:shadow-none"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Analyzing Dependencies...</span>
              <span className="sm:hidden">Analyzing...</span>
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Scan for Vulnerabilities
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}