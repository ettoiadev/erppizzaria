"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Heart, Star, Zap } from "lucide-react"

interface AppSettings {
  restaurant_name?: string
}

export function Features() {
  const [settings, setSettings] = useState<AppSettings>({
    restaurant_name: 'William Disk Pizza'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const features = [
    {
      icon: Shield,
      title: "Ingredientes Premium",
      description: "Selecionamos apenas os melhores ingredientes para nossas pizzas",
    },
    {
      icon: Heart,
      title: "Feito com Amor",
      description: "Cada pizza é preparada com carinho e dedicação pelos nossos chefs",
    },
    {
      icon: Star,
      title: "Qualidade Garantida",
      description: "Mais de 10 anos de experiência em delivery de pizza",
    },
    {
      icon: Zap,
      title: "Super Rápido",
      description: "Entrega expressa em até 30 minutos ou sua pizza é grátis",
    },
  ]

  const restaurantName = settings.restaurant_name || 'William Disk Pizza'

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Por que escolher a {restaurantName}?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Somos apaixonados por pizza e queremos compartilhar essa paixão com você
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
