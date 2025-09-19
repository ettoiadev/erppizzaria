"use client"

import { motion } from "framer-motion"
import { Heart, Star, Users, Leaf } from "lucide-react"

interface AboutValuesProps {
  content?: {
    title: string
    subtitle: string
    values: Array<{
      icon: string
      title: string
      description: string
    }>
  }
}

export function AboutValues({ content }: AboutValuesProps) {
  const iconMap = {
    heart: Heart,
    star: Star,
    users: Users,
    leaf: Leaf,
  }

  const defaultContent = {
    title: "Nossos Valores",
    subtitle: "Os princípios que nos guiam todos os dias",
    values: [
      {
        icon: "heart",
        title: "Paixão pela Qualidade",
        description:
          "Cada pizza é feita com ingredientes selecionados e muito carinho, garantindo sempre o melhor sabor.",
      },
      {
        icon: "star",
        title: "Excelência no Atendimento",
        description: "Tratamos cada cliente como família, oferecendo um atendimento personalizado e acolhedor.",
      },
      {
        icon: "users",
        title: "Compromisso com a Comunidade",
        description: "Somos parte da comunidade e nos orgulhamos de contribuir para o bem-estar local.",
      },
      {
        icon: "leaf",
        title: "Sustentabilidade",
        description: "Nos preocupamos com o meio ambiente, usando embalagens eco-friendly e ingredientes locais.",
      },
    ],
  }

  const valuesContent = content || defaultContent

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{valuesContent.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{valuesContent.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {valuesContent.values.map((value, index) => {
            const IconComponent = iconMap[value.icon as keyof typeof iconMap] || Heart

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
