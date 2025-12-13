"use client"

import { useState } from "react"
import { Upload, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScanResult } from "@/lib/package-scanner"

interface FileUploadProps {
  onScanComplete: (result: ScanResult) => void
}

export function FileUpload({ onScanComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [scanType, setScanType] = useState<'npm' | 'python' | 'docker'>('npm')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleScan = async () => {
    if (!file) return

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', scanType)

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Scan failed')
      }

      const result = await response.json()
      onScanComplete(result)
    } catch (err: any) {
      setError(err.message || 'Failed to scan file')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Dependency File</CardTitle>
        <CardDescription>
          Upload your package.json, requirements.txt, or Dockerfile for security analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Select value={scanType} onValueChange={(value) => setScanType(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="npm">package.json (NPM)</SelectItem>
              <SelectItem value="python">requirements.txt (Python)</SelectItem>
              <SelectItem value="docker">Dockerfile (Docker)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1">
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
            >
              <FileText className="mr-2 h-4 w-4" />
              {file ? file.name : 'Choose file'}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={
                  scanType === 'npm'
                    ? '.json'
                    : scanType === 'python'
                    ? '.txt'
                    : '*'
                }
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <Button
          onClick={handleScan}
          disabled={!file || isScanning}
          className="w-full"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
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