"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

interface PackageSearchProps {
  onSearch: (packageName: string, ecosystem: 'npm' | 'python' | 'docker') => void
}

interface Suggestion {
  name: string
  description?: string
  version?: string
}

export function PackageSearch({ onSearch }: PackageSearchProps) {
  const [query, setQuery] = useState("")
  const [ecosystem, setEcosystem] = useState<'npm' | 'python' | 'docker'>('npm')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&ecosystem=${ecosystem}`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("Search error:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query, ecosystem])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else if (query) {
          handleSearch()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.name)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSearch(suggestion.name, ecosystem)
  }

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false)
      onSearch(query.trim(), ecosystem)
    }
  }

  const handleClear = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Packages</CardTitle>
        <CardDescription>
          Search for npm packages, Python libraries, or Docker images to scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Select value={ecosystem} onValueChange={(value) => setEcosystem(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select ecosystem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="npm">
                <div className="flex items-center gap-2">
                  <NpmLogo className="h-4 w-4" />

                  NPM
                </div>
              </SelectItem>
              <SelectItem value="python">
                <div className="flex items-center gap-2">
                  <PythonLogo className="h-4 w-4" />
                  Python (PyPI)
                </div>
              </SelectItem>
              <SelectItem value="docker">
                <div className="flex items-center gap-2">
                  <DockerLogo className="h-4 w-4" />
                  Docker
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div ref={searchRef} className="flex-1 relative">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder={`Search ${ecosystem === 'npm' ? 'packages' : ecosystem === 'python' ? 'libraries' : 'images'}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${index}`}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0",
                      selectedIndex === index && "bg-accent"
                    )}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {suggestion.name}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                      {suggestion.version && (
                        <div className="text-xs text-muted-foreground shrink-0">
                          v{suggestion.version}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="w-full"
          size="lg"
        >
          <Search className="mr-2 h-4 w-4" />
          Scan Package
        </Button>
      </CardContent>
    </Card>
  )
}
