"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

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
                  <Package className="h-4 w-4" />
                  NPM
                </div>
              </SelectItem>
              <SelectItem value="python">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Python (PyPI)
                </div>
              </SelectItem>
              <SelectItem value="docker">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
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
