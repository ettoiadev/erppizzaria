import { Phone, Mail, MapPin } from "lucide-react"

export function ContactHero() {
  return (
    <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Entre em Contato</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Estamos aqui para ajudar! Entre em contato conosco para pedidos, dúvidas ou sugestões.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3">
            <Phone className="h-6 w-6" />
            <span className="text-lg">(11) 99999-9999</span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Mail className="h-6 w-6" />
            <span className="text-lg">contato@williamdiskpizza.com</span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <MapPin className="h-6 w-6" />
            <span className="text-lg">São Paulo, SP</span>
          </div>
        </div>
      </div>
    </section>
  )
}
