"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, Upload, Trash2, Users, Package, 
  AlertTriangle, FileSpreadsheet, Loader2
} from "lucide-react"
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
import {
  exportClientsToExcel,
  exportProductsToExcel,
  importClientsFromFile,
  deleteAllClients,
  deleteAllProducts,
  deleteAllSales,
  downloadFile,
  validateFileType
} from "@/lib/admin/data-management"

interface DataManagementSectionProps {
  onDataChange?: () => void
}

export function DataManagementSection({ onDataChange }: DataManagementSectionProps) {
  const [isExportingClients, setIsExportingClients] = useState(false)
  const [isExportingProducts, setIsExportingProducts] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeletingClients, setIsDeletingClients] = useState(false)
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const [isDeletingSales, setIsDeletingSales] = useState(false)
  const [showDeleteClientsDialog, setShowDeleteClientsDialog] = useState(false)
  const [showDeleteProductsDialog, setShowDeleteProductsDialog] = useState(false)
  const [showDeleteSalesDialog, setShowDeleteSalesDialog] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // =============================================
  // FUNÇÕES DE EXPORTAÇÃO
  // =============================================

  const handleExportClients = async () => {
    setIsExportingClients(true)
    try {
      await exportClientsToExcel()
      
      toast({
        title: "Exportação Concluída",
        description: "Arquivo de clientes baixado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar clientes:', error)
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar os clientes. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsExportingClients(false)
    }
  }

  const handleExportProducts = async () => {
    setIsExportingProducts(true)
    try {
      await exportProductsToExcel()
      
      toast({
        title: "Exportação Concluída",
        description: "Arquivo de produtos baixado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar produtos:', error)
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar os produtos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsExportingProducts(false)
    }
  }

  // =============================================
  // FUNÇÕES DE IMPORTAÇÃO
  // =============================================

  const handleImportClients = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo do arquivo
    if (!validateFileType(file)) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo .xlsx, .xls ou .csv",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      const result = await importClientsFromFile(file)
      
      if (result.errors.length === 0) {
        toast({
          title: "Importação Concluída",
          description: `${result.success} clientes importados com sucesso!`
        })
      } else {
        toast({
          title: "Importação Parcial",
          description: `${result.success} clientes importados. ${result.errors.length} erros encontrados. Verifique o console para detalhes.`,
          variant: "destructive"
        })
        console.error('Erros de importação:', result.errors)
      }

      // Notificar mudança nos dados
      if (onDataChange) {
        onDataChange()
      }

    } catch (error) {
      console.error('Erro na importação:', error)
      toast({
        title: "Erro na Importação",
        description: "Não foi possível importar o arquivo. Verifique o formato e tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // =============================================
  // FUNÇÕES DE EXCLUSÃO EM MASSA
  // =============================================

  const handleDeleteAllClients = async () => {
    setIsDeletingClients(true)
    try {
      const deletedCount = await deleteAllClients()
      
      toast({
        title: "Clientes Excluídos",
        description: `${deletedCount} clientes foram excluídos com sucesso.`
      })

      // Notificar mudança nos dados
      if (onDataChange) {
        onDataChange()
      }

    } catch (error) {
      console.error('Erro ao deletar clientes:', error)
      toast({
        title: "Erro na Exclusão",
        description: "Não foi possível excluir todos os clientes. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingClients(false)
      setShowDeleteClientsDialog(false)
    }
  }

  const handleDeleteAllProducts = async () => {
    setIsDeletingProducts(true)
    try {
      const deletedCount = await deleteAllProducts()
      
      toast({
        title: "Produtos Excluídos",
        description: `${deletedCount} produtos foram excluídos com sucesso.`
      })

      // Notificar mudança nos dados
      if (onDataChange) {
        onDataChange()
      }

    } catch (error) {
      console.error('Erro ao deletar produtos:', error)
      toast({
        title: "Erro na Exclusão",
        description: "Não foi possível excluir todos os produtos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingProducts(false)
      setShowDeleteProductsDialog(false)
    }
  }

  const handleDeleteAllSales = async () => {
    setIsDeletingSales(true)
    try {
      const result = await deleteAllSales()
      
      toast({
        title: "Dados de Vendas Excluídos",
        description: `${result.totalDeleted} registros de vendas foram excluídos com sucesso. (${result.deletedOrders} pedidos e ${result.deletedOrderItems} itens)`
      })

      // Notificar mudança nos dados
      if (onDataChange) {
        onDataChange()
      }

    } catch (error) {
      console.error('Erro ao deletar dados de vendas:', error)
      toast({
        title: "Erro na Exclusão",
        description: "Não foi possível excluir todos os dados de vendas. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingSales(false)
      setShowDeleteSalesDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Seção de Gerenciamento de Dados de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Dados de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Clientes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Exportar Clientes</Label>
              <Button
                onClick={handleExportClients}
                disabled={isExportingClients}
                className="w-full"
                variant="outline"
              >
                {isExportingClients ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Clientes
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Baixa arquivo Excel (.xlsx) com todos os clientes
              </p>
            </div>

            {/* Importar Clientes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Importar Clientes</Label>
              <Button
                onClick={handleImportClients}
                disabled={isImporting}
                className="w-full"
                variant="outline"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Clientes
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Aceita arquivos .xlsx, .xls ou .csv
              </p>
            </div>
          </div>

          {/* Input oculto para seleção de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Exportar Produtos */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Exportar Produtos
              </Label>
              <Button
                onClick={handleExportProducts}
                disabled={isExportingProducts}
                className="w-full md:w-auto"
                variant="outline"
              >
                {isExportingProducts ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Produtos
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Baixa arquivo Excel (.xlsx) com todos os produtos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Exclusão em Massa */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Excluir Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 mb-3">
              <strong>⚠️ Atenção:</strong> Estas ações são irreversíveis. 
              Produtos e clientes com pedidos associados serão apenas desativados.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Excluir Todos os Clientes */}
              <Button
                onClick={() => setShowDeleteClientsDialog(true)}
                disabled={isDeletingClients}
                variant="destructive"
                className="w-full"
              >
                {isDeletingClients ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Todos os Clientes
                  </>
                )}
              </Button>

              {/* Excluir Todos os Produtos */}
              <Button
                onClick={() => setShowDeleteProductsDialog(true)}
                disabled={isDeletingProducts}
                variant="destructive"
                className="w-full"
              >
                {isDeletingProducts ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Todos os Produtos
                  </>
                )}
              </Button>
            </div>

            {/* Separador e nova seção para vendas */}
            <div className="border-t border-red-200 mt-4 pt-4">
              <div className="bg-red-100 p-3 rounded-lg border border-red-300 mb-3">
                <p className="text-sm text-red-900 font-medium mb-2">
                  <strong>🚨 Exclusão de Dados de Vendas</strong>
                </p>
                <p className="text-xs text-red-800">
                  Esta ação irá excluir permanentemente TODOS os pedidos, itens de pedidos e histórico de transações. 
                  Os clientes e produtos NÃO serão excluídos, apenas o histórico de vendas será removido.
                </p>
              </div>

              {/* Excluir Todas as Vendas */}
              <Button
                onClick={() => setShowDeleteSalesDialog(true)}
                disabled={isDeletingSales}
                variant="destructive"
                className="w-full"
              >
                {isDeletingSales ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Todas as Vendas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação - Excluir Clientes */}
      <AlertDialog open={showDeleteClientsDialog} onOpenChange={setShowDeleteClientsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão de Todos os Clientes
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <strong>Esta ação irá excluir TODOS os clientes do sistema.</strong>
                </p>
                <p>
                  • Clientes com pedidos associados serão apenas desativados<br/>
                  • Clientes sem pedidos serão excluídos permanentemente<br/>
                  • Esta ação não pode ser desfeita
                </p>
                <p className="text-red-600 font-medium">
                  Tem certeza que deseja continuar?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllClients}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingClients}
            >
              {isDeletingClients ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, Excluir Todos'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação - Excluir Produtos */}
      <AlertDialog open={showDeleteProductsDialog} onOpenChange={setShowDeleteProductsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão de Todos os Produtos
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <strong>Esta ação irá excluir TODOS os produtos do sistema.</strong>
                </p>
                <p>
                  • Produtos com pedidos associados serão apenas desativados<br/>
                  • Produtos sem pedidos serão excluídos permanentemente<br/>
                  • Esta ação não pode ser desfeita
                </p>
                <p className="text-red-600 font-medium">
                  Tem certeza que deseja continuar?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllProducts}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingProducts}
            >
              {isDeletingProducts ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, Excluir Todos'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação - Excluir Vendas */}
      <AlertDialog open={showDeleteSalesDialog} onOpenChange={setShowDeleteSalesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão de Todas as Vendas
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <strong>Esta ação irá excluir TODOS os dados de vendas do sistema.</strong>
                </p>
                <p>
                  • Todos os pedidos serão excluídos permanentemente<br/>
                  • Todos os itens de pedidos serão excluídos permanentemente<br/>
                  • Todo o histórico de transações será perdido<br/>
                  • Os clientes e produtos NÃO serão afetados<br/>
                  • Esta ação não pode ser desfeita
                </p>
                <div className="bg-red-100 p-3 rounded-lg border border-red-300">
                  <p className="text-red-800 font-medium text-sm">
                    ⚠️ ATENÇÃO: Esta ação é irreversível e removerá permanentemente todo o histórico de vendas!
                  </p>
                </div>
                <p className="text-red-600 font-medium">
                  Tem certeza que deseja continuar?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllSales}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingSales}
            >
              {isDeletingSales ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, Excluir Todas as Vendas'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}