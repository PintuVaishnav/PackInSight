// src/app/page.tsx
import { Suspense } from 'react'
import HomeClient from './HomeClient'
import { Shield } from 'lucide-react'

// Loading component
function HomeLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Shield className="h-12 w-12 text-primary animate-pulse" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeClient />
    </Suspense>
  )
}