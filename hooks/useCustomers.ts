import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Customer } from "@/components/admin/pdv/types"

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadCustomers = async (searchTerm?: string) => {
    try {
      setLoading(true)
      const url = searchTerm 
        ? `/api/admin/customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/admin/customers'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Falha ao carregar clientes')
      }
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar clientes",
      })
    } finally {
      setLoading(false)
    }
  }

  const searchCustomers = async (searchTerm: string) => {
    if (searchTerm.trim().length >= 2) {
      await loadCustomers(searchTerm)
    } else {
      setCustomers([])
    }
  }

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [customer, ...prev])
  }

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    )
  }

  return {
    customers,
    loading,
    loadCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer
  }
}