"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Zap, Shield, Lock } from "lucide-react"

interface TorchHeroProps {
  isDark: boolean
  textSecondary: string
  bgMuted: string
  borderColor: string
  borderColorHover: string
}

export function TorchHero({
  isDark,
  textSecondary,
  bgMuted,
  borderColor,
  borderColorHover
}: TorchHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const check = () => setIsLargeScreen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!isLargeScreen || !containerRef.current) return

    const container = containerRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    const handleMouseLeave = () => {
      setMousePos(null)
    }

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isLargeScreen])

  const torchRadius = 280
  const isHovering = mousePos !== null

  const hiddenTextColor = isDark ? "rgb(115, 115, 115)" : "rgb(163, 163, 163)"

  const torchGlow = isHovering
    ? isDark
      ? `radial-gradient(circle ${torchRadius}px at ${mousePos.x}px ${mousePos.y}px, 
          rgba(255, 255, 255, 0.2) 0%, 
          rgba(200, 200, 200, 0.1) 40%,
          transparent 100%)`
      : `radial-gradient(circle ${torchRadius}px at ${mousePos.x}px ${mousePos.y}px, 
          rgba(0, 0, 0, 0.15) 0%, 
          rgba(50, 50, 50, 0.08) 40%,
          transparent 100%)`
    : 'none'

  const revealMask = isHovering
    ? `radial-gradient(circle ${torchRadius}px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 50%, transparent 80%)`
    : 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)'

  return (
    <section
      ref={containerRef}
      id="hero-section"
      className={`relative border-b ${borderColor} overflow-hidden`}
    >
      {isLargeScreen && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          aria-hidden="true"
          style={{
            maskImage: revealMask,
            WebkitMaskImage: revealMask,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(5rem, 16vw, 13rem)',
              fontWeight: 900,
              color: hiddenTextColor,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            PACKINSIGHT
          </span>
        </div>
      )}

      {isLargeScreen && isHovering && (
        <div
          className="absolute inset-0 pointer-events-none z-5"
          style={{ background: torchGlow }}
        />
      )}

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 lg:py-15 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgMuted} border ${borderColor} mb-8 sm:mb-10 transition-all duration-300 cursor-default animate-float-bounce animate-border-glow`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className={`text-xs sm:text-sm ${textSecondary} font-medium`}>
            AI-Powered Security Analysis
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-[1.1]">
          <span className="block text-glow">Secure Your</span>
          <span
            className="block mt-2 sm:mt-3 bg-clip-text text-transparent animate-gradient"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(90deg, #ffffff 0%, #737373 25%, #525252 50%, #737373 75%, #ffffff 100%)'
                : 'linear-gradient(90deg, #000000 0%, #525252 25%, #a3a3a3 50%, #525252 75%, #000000 100%)',
              backgroundSize: '200% 100%',
            }}
          >
            Dependencies
          </span>
        </h1>

        <p className={`text-base sm:text-lg md:text-xl ${textSecondary} max-w-sm sm:max-w-lg md:max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed`}>
          Scan npm, Python, and Docker packages for security vulnerabilities with enterprise-grade AI-powered insights.
        </p>

        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {[
            { icon: Zap, text: "Real-time Detection" },
            { icon: Shield, text: "Trust Score" },
            { icon: Lock, text: "AI Insights" }
          ].map((feature, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${bgMuted} border ${borderColor} ${borderColorHover} transition-all duration-300 cursor-default group hover:animate-glow`}
            >
              <feature.icon className={`h-4 w-4 ${textSecondary} group-hover:scale-110 transition-transform duration-300`} />
              <span className={`text-sm ${textSecondary} font-medium`}>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}