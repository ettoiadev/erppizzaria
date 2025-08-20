"use client"

import { motion } from "framer-motion"

interface AboutStoryProps {
  content?: {
    title: string
    paragraphs: string[]
    image: string
  }
}

export function AboutStory({ content }: AboutStoryProps) {
  const defaultContent = {
    title: "Como Tudo Começou",
    paragraphs: [
      "Em 2010, com muito amor pela culinária italiana e o sonho de criar algo especial, nasceu a Pizza Express. Começamos como uma pequena pizzaria familiar no coração de São Paulo, com apenas algumas mesas e um forno a lenha tradicional.",
      "Nossa receita secreta não está apenas na massa artesanal ou nos ingredientes frescos selecionados diariamente. Está no carinho e dedicação que colocamos em cada pizza, tratando cada cliente como parte da nossa família.",
      "Ao longo dos anos, crescemos e evoluímos, mas nunca perdemos nossa essência: fazer a melhor pizza da cidade com ingredientes de qualidade e muito amor. Hoje, atendemos toda a região com nosso serviço de delivery, levando o sabor autêntico da Pizza Express até você.",
    ],
    image: "/default-image.svg",
  }

  const storyContent = content || defaultContent

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src={storyContent.image || "/default-image.svg"}
              alt="Nossa história"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{storyContent.title}</h2>
            <div className="space-y-4">
              {storyContent.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
