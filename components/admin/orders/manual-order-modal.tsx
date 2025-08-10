import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ManualOrderForm } from "./manual-order-form"

interface ManualOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

export function ManualOrderModal({ isOpen, onClose, onOrderCreated }: ManualOrderModalProps) {
  const handleSuccess = () => {
    onOrderCreated()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="manual-order-modal-description">
        <DialogHeader>
          <DialogTitle>Criar Pedido Manual</DialogTitle>
          <DialogDescription id="manual-order-modal-description">
            Crie um pedido manualmente para um cliente.
          </DialogDescription>
        </DialogHeader>
        <ManualOrderForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}