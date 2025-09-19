"use client"

import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutHero } from "@/components/about/about-hero"
import { AboutStory } from "@/components/about/about-story"
import { AboutValues } from "@/components/about/about-values"
import { AboutTeam } from "@/components/about/about-team"
import { AboutContact } from "@/components/about/about-contact"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AboutPage() {
  const { data: aboutContent, isLoading } = useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const response = await fetch("/api/about-content")
      if (!response.ok) throw new Error("Erro ao carregar conteúdo")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <AboutHero content={aboutContent?.hero} />
        <AboutStory content={aboutContent?.story} />
        <AboutValues content={aboutContent?.values} />
        <AboutTeam content={aboutContent?.team} />
        <AboutContact content={aboutContent?.contact} />
      </main>
      <Footer />
    </div>
  )
}
