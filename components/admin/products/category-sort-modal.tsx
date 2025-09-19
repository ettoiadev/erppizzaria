"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, GripVertical, Save } from "lucide-react"
import type { Category } from "@/types"

interface CategorySortModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSave: () => void
}

interface SortableCategory extends Category {
  sort_order: number
}

export function CategorySortModal({ open, onOpenChange, categories, onSave }: CategorySortModalProps) {
  const [sortableCategories, setSortableCategories] = useState<SortableCategory[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && categories.length > 0) {
      // Converter categorias para formato ordenável
      const sorted = categories
        .map((cat, index) => ({
          ...cat,
          sort_order: cat.sort_order || index + 1
        }))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      
      setSortableCategories(sorted)
    }
  }, [open, categories])

  const updateCategoryOrder = (categoryId: string, newOrder: number) => {
    setSortableCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, sort_order: Math.max(1, newOrder) }
          : cat
      ).sort((a, b) => a.sort_order - b.sort_order)
    )
  }

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = sortableCategories.findIndex(cat => cat.id === categoryId)
    if (currentIndex === -1) return

    const newCategories = [...sortableCategories]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      // Trocar posições
      [newCategories[currentIndex], newCategories[targetIndex]] = 
      [newCategories[targetIndex], newCategories[currentIndex]]
      
      // Atualizar sort_order baseado na nova posição
      newCategories.forEach((cat, index) => {
        cat.sort_order = index + 1
      })

      setSortableCategories(newCategories)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Preparar dados para envio
      const categoryOrders = sortableCategories.map((cat, index) => ({
        id: cat.id,
        sort_order: index + 1
      }))

      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryOrders })
      })

      if (response.ok) {
        onSave() // Callback para recarregar dados no componente pai
        onOpenChange(false)
      } else {
        throw new Error('Erro ao salvar ordem das categorias')
      }
    } catch (error) {
      console.error('Erro ao salvar ordem das categorias:', error)
      alert('Erro ao salvar ordem das categorias. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ordenar Categorias</DialogTitle>
          <p className="text-sm text-gray-600">
            Defina a ordem em que as categorias aparecerão no cardápio
          </p>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          {sortableCategories.map((category, index) => (
            <Card key={category.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Grip para indicar drag (visual apenas por enquanto) */}
                  <div className="flex flex-col items-center">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Informações da categoria */}
                  <div className="flex items-center gap-3 flex-1">
                    {category.image && (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 truncate max-w-48">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Campo de ordem numérica */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`order-${category.id}`} className="text-sm">
                      Ordem:
                    </Label>
                    <Input
                      id={`order-${category.id}`}
                      type="number"
                      min="1"
                      value={category.sort_order}
                      onChange={(e) => updateCategoryOrder(category.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </div>

                  {/* Botões de movimento */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0}
                      className="p-1 h-8 w-8"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === sortableCategories.length - 1}
                      className="p-1 h-8 w-8"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Ordem
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 