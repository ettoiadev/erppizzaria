"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Bike } from "lucide-react"
import Link from "next/link"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Clock,
      title: "Entrega Rápida",
      description: "Pizza quentinha em até 30 minutos",
    },
    {
      icon: Bike,
      title: "Entrega por Motoboy",
      description: "Nossos motoboys entregam com segurança e agilidade",
    },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-800 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-center bg-cover" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main heading */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              A Melhor Pizza da{" "}
              <span className="text-yellow-400 drop-shadow-lg">Cidade</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-3xl mx-auto leading-relaxed">
              Sabores únicos, ingredientes frescos e entrega super rápida. 
              Experimente agora e descubra por que somos a pizzaria favorita da região!
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/cardapio">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl">
                  Ver Cardápio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sobre">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white text-white hover:bg-white hover:text-red-600 font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  Sobre Nós
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div
            className={`transition-all duration-1000 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-6 transition-all duration-300 hover:bg-white/20">
                  <div className="flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-red-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className={`transition-all duration-1000 delay-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="animate-bounce">
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <div className="w-20 h-20 bg-yellow-400 rounded-full blur-xl" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-20">
        <div className="w-32 h-32 bg-orange-400 rounded-full blur-xl" />
      </div>
    </section>
  )
}
