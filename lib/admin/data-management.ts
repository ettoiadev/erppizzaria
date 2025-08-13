// =============================================
// FUNÇÕES DE EXPORTAÇÃO (USANDO APIs)
// =============================================

export async function exportClientsToExcel(): Promise<void> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando exportação de clientes...')

    const response = await fetch('/api/admin/data-management/export-clients')
    
    if (!response.ok) {
      throw new Error('Erro ao exportar clientes')
    }

    const blob = await response.blob()
    const filename = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`
    downloadFile(blob, filename)
    
    console.log('[DATA_MANAGEMENT] Arquivo Excel gerado com sucesso')

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro ao exportar clientes:', error)
    throw new Error('Erro ao exportar clientes para Excel')
  }
}

export async function exportProductsToExcel(): Promise<void> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando exportação de produtos...')

    const response = await fetch('/api/admin/data-management/export-products')
    
    if (!response.ok) {
      throw new Error('Erro ao exportar produtos')
    }

    const blob = await response.blob()
    const filename = `produtos_${new Date().toISOString().split('T')[0]}.xlsx`
    downloadFile(blob, filename)
    
    console.log('[DATA_MANAGEMENT] Arquivo Excel de produtos gerado com sucesso')

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro ao exportar produtos:', error)
    throw new Error('Erro ao exportar produtos para Excel')
  }
}

// =============================================
// FUNÇÕES DE IMPORTAÇÃO (USANDO APIs)
// =============================================

export async function importClientsFromFile(file: File): Promise<{ success: number; errors: string[] }> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando importação de clientes...')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/data-management/import-clients', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao importar clientes')
    }

    console.log(`[DATA_MANAGEMENT] Importação concluída: ${result.success} sucessos, ${result.errors?.length || 0} erros`)
    return { success: result.success, errors: result.errors || [] }

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro geral na importação:', error)
    throw new Error('Erro ao processar arquivo de importação')
  }
}

// =============================================
// FUNÇÕES DE EXCLUSÃO EM MASSA (USANDO APIs)
// =============================================

export async function deleteAllClients(): Promise<number> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando exclusão de todos os clientes...')

    const response = await fetch('/api/admin/data-management/delete-clients', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar clientes')
    }

    console.log(`[DATA_MANAGEMENT] ${result.message}`)
    return result.deletedCount

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro ao deletar todos os clientes:', error)
    throw new Error('Erro ao excluir todos os clientes')
  }
}

export async function deleteAllProducts(): Promise<number> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando exclusão de todos os produtos...')

    const response = await fetch('/api/admin/data-management/delete-products', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar produtos')
    }

    console.log(`[DATA_MANAGEMENT] ${result.message}`)
    return result.deletedCount

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro ao deletar todos os produtos:', error)
    throw new Error('Erro ao excluir todos os produtos')
  }
}

export async function deleteAllSales(): Promise<{ deletedOrders: number; deletedOrderItems: number; totalDeleted: number }> {
  try {
    console.log('[DATA_MANAGEMENT] Iniciando exclusão de todos os dados de vendas...')

    const response = await fetch('/api/admin/data-management/delete-sales', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao deletar dados de vendas')
    }

    console.log(`[DATA_MANAGEMENT] ${result.message}`)
    return result.details

  } catch (error) {
    console.error('[DATA_MANAGEMENT] Erro ao deletar todos os dados de vendas:', error)
    throw new Error('Erro ao excluir todos os dados de vendas')
  }
}

// =============================================
// FUNÇÕES UTILITÁRIAS
// =============================================

export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function validateFileType(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]
  return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
}