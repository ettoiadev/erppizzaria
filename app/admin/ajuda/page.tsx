"use client"

import { AdminLayout } from "@/components/admin/layout/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

// Dados de ajuda simplificados
const helpItems = [
  {
    question: "Como navegar pelo sistema administrativo?",
    answer: "Use a barra de navegação superior para acessar as diferentes seções do sistema."
  },
  {
    question: "Como alterar minha senha de acesso?",
    answer: "Acesse o menu de configurações, clique na aba 'Perfil' e selecione a opção 'Alterar senha'."
  },
  {
    question: "Como ativar o tema escuro?",
    answer: "Clique no ícone de lua/sol no canto superior direito da tela."
  },
  {
    question: "Como criar um novo pedido?",
    answer: "Acesse a seção 'PDV' para criar um novo pedido."
  },
  {
    question: "Como adicionar um novo produto?",
    answer: "Na seção 'Produtos', clique no botão 'Adicionar produto'."
  },
  {
    question: "Como gerar relatórios de vendas?",
    answer: "Acesse a seção 'Relatórios', selecione 'Relatório de vendas'."
  }
]

export default function AdminHelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Filtrar perguntas com base no termo de pesquisa
  const filteredItems = searchTerm 
    ? helpItems.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : helpItems

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Central de Ajuda</h2>
          <p className="text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre o sistema administrativo.
          </p>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar ajuda..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Conteúdo de ajuda */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  Nenhum resultado encontrado para "{searchTerm}"
                </p>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}