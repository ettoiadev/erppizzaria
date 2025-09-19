"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: "product" | "category"
  onConfirm: () => void
}

export function DeleteConfirmModal({ open, onOpenChange, itemName, itemType, onConfirm }: DeleteConfirmModalProps) {
  const typeLabel = itemType === "product" ? "produto" : "categoria"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {itemType === "product" ? "este produto" : "esta categoria"}? Esta ação não
            pode ser desfeita.
            {itemType === "category" && (
              <span className="block mt-2 text-red-600 font-medium">
                Atenção: Todos os produtos desta categoria também serão afetados.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Sim, Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
