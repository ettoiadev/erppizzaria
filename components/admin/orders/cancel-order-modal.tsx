import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { XCircle, RefreshCw } from "lucide-react"

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  notes: string
  onNotesChange: (notes: string) => void
  orderNumber: string
  isLoading?: boolean
}

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  notes,
  onNotesChange,
  orderNumber,
  isLoading = false
}: CancelOrderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="cancel-order-modal-description">
        <DialogHeader>
          <DialogTitle>Cancelar Pedido #{orderNumber}</DialogTitle>
          <DialogDescription id="cancel-order-modal-description">
            Confirme o cancelamento do pedido e informe o motivo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>Tem certeza que deseja cancelar este pedido?</p>
          
          <div>
            <Label htmlFor="cancellation-notes">Motivo do cancelamento (opcional):</Label>
            <Textarea
              id="cancellation-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}