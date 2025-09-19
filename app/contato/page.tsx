import type { Metadata } from "next"
import { ContactHero } from "@/components/contact/contact-hero"
import { ContactForm } from "@/components/contact/contact-form"
import { ContactInfo } from "@/components/contact/contact-info"
import { ContactMap } from "@/components/contact/contact-map"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Contato - William Disk Pizza",
  description: "Entre em contato conosco. Estamos aqui para ajudar com seus pedidos e dúvidas.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="bg-gray-50">
        <ContactHero />

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <ContactForm />
            </div>
            <div className="space-y-8">
              <ContactInfo />
              <ContactMap />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
