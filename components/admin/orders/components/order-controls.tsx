import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, RefreshCw, Archive, List, LayoutGrid } from "lucide-react"
import type { OrderStatus } from "../types"
import { statusLabels } from "../constants"

interface OrderControlsProps {
  selectedStatus: OrderStatus | 'ALL'
  onStatusChange: (status: OrderStatus | 'ALL') => void
  viewMode: 'list' | 'kanban'
  onViewModeChange: (mode: 'list' | 'kanban') => void
  onRefresh: () => void
  onArchiveAll: () => void
  onNewManualOrder: () => void
  isLoading: boolean
  isUpdatingStatus: boolean
}

export function OrderControls({
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  onArchiveAll,
  onNewManualOrder,
  isLoading,
  isUpdatingStatus,
}: OrderControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onNewManualOrder}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido Manual
        </Button>
        
        <Button
          onClick={onRefresh}
          variant="outline"
          disabled={isLoading || isUpdatingStatus}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        
        <Button
          onClick={onArchiveAll}
          variant="outline"
          className="text-orange-600 border-orange-600 hover:bg-orange-50"
          disabled={isLoading || isUpdatingStatus}
        >
          <Archive className="w-4 h-4 mr-2" />
          Arquivar Todos Completos
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 ml-auto">
        {/* Seletor de modo de visualização */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('kanban')}
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-none"
          >
            <List className="w-4 h-4 mr-1" />
            Lista
          </Button>
        </div>

        {/* Filtro de status (apenas para modo lista) */}
        {viewMode === 'list' && (
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Todos</Badge>
                </div>
              </SelectItem>
              {Object.entries(statusLabels).map(([status, label]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{label}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}