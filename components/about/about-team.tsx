"use client"

import { motion } from "framer-motion"

interface TeamMember {
  name: string
  role: string
  description: string
  image: string
}

interface AboutTeamProps {
  content?: {
    title: string
    subtitle: string
    members: TeamMember[]
    showTeamSection?: boolean
  }
}

export function AboutTeam({ content }: AboutTeamProps) {
  const defaultContent = {
    title: "Nossa Equipe",
    subtitle: "As pessoas que fazem a magia acontecer",
    showTeamSection: true,
    members: [
      {
        name: "Marco Rossi",
        role: "Chef Pizzaiolo",
        description:
          "Com mais de 15 anos de experiência, Marco é o responsável por manter a tradição e qualidade de nossas pizzas.",
        image: "/default-image.svg",
      },
      {
        name: "Ana Silva",
        role: "Gerente Geral",
        description: "Ana cuida de toda a operação, garantindo que cada cliente tenha a melhor experiência possível.",
        image: "/default-image.svg",
      },
      {
        name: "Carlos Santos",
        role: "Coordenador de Delivery",
        description:
          "Carlos lidera nossa equipe de entrega, assegurando que sua pizza chegue quentinha e no tempo certo.",
        image: "/default-image.svg",
      },
    ],
  }

  const teamContent = content || defaultContent

  // If the team section is disabled, don't render anything
  if (teamContent.showTeamSection === false) {
    return null
  }

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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{teamContent.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{teamContent.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {teamContent.members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="relative mb-6">
                <img
                  src={member.image || "/default-image.svg"}
                  alt={member.name}
                  className="w-48 h-48 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
              <p className="text-primary font-medium mb-3">{member.role}</p>
              <p className="text-gray-600 leading-relaxed">{member.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
