// Testing auto-deploy2
// Testing auto-deploy
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { PopularItems } from "@/components/landing/popular-items"
import { DownloadApp } from "@/components/landing/download-app"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to cardapio page
    if (user && !isLoading) {
      router.push("/cardapio")
    }
  }, [user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show landing page only for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Features />
          <PopularItems />
          <DownloadApp />
        </main>
        <Footer />
      </div>
    )
  }

  // Return null while redirecting authenticated users
  return null
}
