"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Clock } from "lucide-react"

export function DownloadApp() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white"
          >
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8" />
              <span className="text-lg font-semibold">Nossa Localização</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Venha nos visitar!</h2>
            <p className="text-xl mb-8 text-white/90">
              Estamos localizados no coração da Vila Italiana, com fácil acesso e estacionamento disponível.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 text-white/80" />
                <div>
                  <p className="font-semibold">Rua das Pizzas, 123</p>
                  <p className="text-white/80">Vila Italiana - São Paulo, SP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-1 text-white/80" />
                <div>
                  <p className="font-semibold">Horário de Funcionamento</p>
                  <p className="text-white/80">Seg-Dom: 18h às 23h</p>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="lg" className="text-lg px-8">
              <Navigation className="mr-2 w-5 h-5" />
              Como Chegar
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              {/* Placeholder para o mapa */}
              <div className="bg-white/20 rounded-lg h-64 flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Mapa Interativo</p>
                  <p className="text-sm text-white/80">Rua das Pizzas, 123 - Vila Italiana</p>
                </div>
              </div>

              <div className="text-white/90 space-y-2">
                <p className="font-semibold text-sm">Pontos de Referência:</p>
                <ul className="text-sm space-y-1">
                  <li>• Próximo ao Shopping Vila Italiana</li>
                  <li>• Em frente à Padaria do João</li>
                  <li>• 200m do metrô Vila Italiana</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
