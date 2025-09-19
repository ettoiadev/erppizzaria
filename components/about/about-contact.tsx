"use client"

import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AboutContactProps {
  content?: {
    title: string
    subtitle: string
    address: string
    phone: string
    email: string
    hours: string
  }
}

export function AboutContact({ content }: AboutContactProps) {
  const defaultContent = {
    title: "Venha nos Visitar",
    subtitle: "Estamos sempre prontos para recebê-lo",
    address: "Rua das Pizzas, 123 - Centro, São Paulo/SP",
    phone: "(11) 99999-9999",
    email: "contato@pizzaexpress.com",
    hours: "Seg-Dom: 18h às 23h",
  }

  const contactContent = content || defaultContent

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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{contactContent.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{contactContent.subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Endereço</h3>
                <p className="text-gray-600">{contactContent.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
                <p className="text-gray-600">{contactContent.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">{contactContent.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Horário de Funcionamento</h3>
                <p className="text-gray-600">{contactContent.hours}</p>
              </div>
            </div>

            <div className="pt-6">
              <Button asChild size="lg">
                <Link href="/cardapio">Ver Nosso Cardápio</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/default-image.svg"
                alt="Localização da pizzaria"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
