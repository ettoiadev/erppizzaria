"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

const popularItems = [
  {
    id: "1",
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco",
    price: 32.9,
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Pizza Pepperoni",
    description: "Molho de tomate, mussarela, pepperoni",
    price: 38.9,
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.9,
  },
  {
    id: "3",
    name: "Pizza Quatro Queijos",
    description: "Mussarela, gorgonzola, parmesão, provolone",
    price: 45.9,
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.7,
  },
]

export function PopularItems() {
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nossos Sabores Mais Pedidos</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra os sabores que conquistaram o coração dos nossos clientes
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {popularItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{item.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{formatCurrency(item.price)}</span>
                  <Button size="sm">Pedir Agora</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/cardapio">Ver Cardápio Completo</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
