"use client"

import { motion } from "framer-motion"

interface AboutHeroProps {
  content?: {
    title: string
    subtitle: string
    description: string
    image: string
  }
}

export function AboutHero({ content }: AboutHeroProps) {
  const defaultContent = {
    title: "Nossa História",
    subtitle: "Tradição e Sabor desde 2010",
    description:
      "Somos uma pizzaria familiar que nasceu do sonho de compartilhar o verdadeiro sabor da pizza italiana com nossa comunidade.",
    image: "/default-image.svg",
  }

  const heroContent = content || defaultContent

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-white to-orange-50 py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">{heroContent.title}</h1>
              <h2 className="text-xl md:text-2xl text-primary font-semibold">{heroContent.subtitle}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">{heroContent.description}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10">
              <img
                src={heroContent.image || "/default-image.svg"}
                alt="Nossa pizzaria"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-300/20 rounded-2xl transform rotate-3"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
