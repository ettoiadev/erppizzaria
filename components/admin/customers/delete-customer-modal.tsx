"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Loader2, Trash2, X, ShoppingBag } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Customer } from "@/types/admin"

interface DeleteCustomerModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteCustomerModal({ customer, isOpen, onClose, onSuccess }: DeleteCustomerModalProps) {
  const [loading, setLoading] = useState(false)
  const [confirmDeletion, setConfirmDeletion] = useState(false)

  if (!customer) return null

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir cliente')
      }

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso",
        variant: "default"
      })

      onSuccess()
      handleClose()
      
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o cliente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmDeletion(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-left">
            Esta ação não pode ser desfeita. O cliente será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Cliente:</span>
              {customer.customer_code && (
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  #{customer.customer_code.toString().padStart(4, '0')}
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div><strong>Nome:</strong> {customer.name}</div>
              <div><strong>Email:</strong> {customer.email}</div>
              <div><strong>Telefone:</strong> {customer.phone}</div>
              <div><strong>Total de Pedidos:</strong> {customer.totalOrders}</div>
              <div><strong>Total Gasto:</strong> R$ {Number(customer.totalSpent).toFixed(2)}</div>
            </div>
          </div>

          {/* Aviso sobre pedidos */}
          {(customer.totalOrders || 0) > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-semibold">Atenção - Cliente com Pedidos</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Este cliente possui <strong>{customer.totalOrders} pedido(s)</strong> registrado(s). 
                Para preservar a integridade dos dados, o cliente será <strong>anonimizado</strong> 
                (dados pessoais removidos, mas pedidos preservados no sistema).
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox 
                  id="confirm-deletion" 
                  checked={confirmDeletion}
                  onCheckedChange={(checked) => setConfirmDeletion(checked as boolean)}
                />
                <label 
                  htmlFor="confirm-deletion" 
                  className="text-sm text-red-700 cursor-pointer"
                >
                  Entendo que o cliente será anonimizado e desejo continuar
                </label>
              </div>
            </div>
          )}

          {/* Informação sobre reutilização de código */}
          {customer.totalOrders === 0 && customer.customer_code && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="text-sm font-semibold">Código do Cliente</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                O código #{customer.customer_code.toString().padStart(4, '0')} ficará disponível 
                para reuso se for o último da sequência.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              onClick={handleDelete}
              disabled={loading || ((customer.totalOrders || 0) > 0 && !confirmDeletion)}
              variant="destructive"
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {(customer.totalOrders || 0) > 0 ? "Anonimizar" : "Excluir"}
                </>
              )}
            </Button>
          </div>

          {(customer.totalOrders || 0) > 0 && !confirmDeletion && (
            <p className="text-xs text-red-500 text-center">
              Marque a confirmação acima para habilitar a anonimização
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}