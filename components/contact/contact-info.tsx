import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react"

export function ContactInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Informações de Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start space-x-4">
          <Phone className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Telefone</h3>
            <p className="text-gray-600">(11) 99999-9999</p>
            <p className="text-sm text-gray-500">WhatsApp disponível</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <Mail className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">E-mail</h3>
            <p className="text-gray-600">contato@williamdiskpizza.com</p>
            <p className="text-sm text-gray-500">Respondemos em até 24h</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <MapPin className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Endereço</h3>
            <p className="text-gray-600">
              Rua das Pizzas, 123
              <br />
              Vila Italiana - São Paulo, SP
              <br />
              CEP: 01234-567
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <Clock className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Horário de Funcionamento</h3>
            <div className="text-gray-600 space-y-1">
              <p>Segunda a Quinta: 18h às 23h</p>
              <p>Sexta e Sábado: 18h às 00h</p>
              <p>Domingo: 18h às 22h</p>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <MessageCircle className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Redes Sociais</h3>
            <div className="space-y-2">
              <p className="text-gray-600">@williamdiskpizza</p>
              <div className="flex space-x-4">
                <a href="#" className="text-blue-600 hover:underline">
                  Facebook
                </a>
                <a href="#" className="text-pink-600 hover:underline">
                  Instagram
                </a>
                <a href="#" className="text-green-600 hover:underline">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
