import { useCallback } from "react"
import { DropResult } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"
import { statusLabels } from "../constants"

interface UseDragDropProps {
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>
}

export function useDragDrop({ onStatusUpdate }: UseDragDropProps) {
  const { toast } = useToast()

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Se não há destino, cancelar
    if (!destination) return

    // Se a posição não mudou, cancelar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId
    const orderId = draggableId

    try {
      await onStatusUpdate(orderId, newStatus)
      
      toast({
        title: "Status Atualizado",
        description: `Pedido movido para ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      })
    }
  }, [onStatusUpdate, toast])

  return {
    handleDragEnd
  }
}