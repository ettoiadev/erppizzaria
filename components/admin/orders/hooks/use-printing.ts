import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useThermalPrinter } from "@/lib/thermal-printer"
import type { Order } from "../types"
import { statusLabels } from "../constants"
import { formatCurrency, formatDateTime, mapPaymentMethodToPortuguese } from "../utils"

export function usePrinting() {
  const [thermalPrintEnabled, setThermalPrintEnabled] = useState(false)
  const { toast } = useToast()
  const thermalPrinter = useThermalPrinter()

  // Verificar status da impressora térmica ao carregar
  useEffect(() => {
    const checkThermalPrinter = async () => {
      try {
        const serverRunning = await thermalPrinter.checkServer()
        setThermalPrintEnabled(serverRunning)
      } catch (error) {
        // Silenciosamente desabilitar impressão térmica se não houver servidor
        console.log('[THERMAL_PRINTER] Servidor de impressão térmica não disponível')
        setThermalPrintEnabled(false)
      }
    }
    checkThermalPrinter()
  }, [])

  // Função para imprimir via impressora térmica Bematech
  const printThermal = async (order: Order) => {
    try {
      const result = await thermalPrinter.printOrder(order)
      
      if (result.success) {
        toast({
          title: "Impressão Térmica",
          description: `Pedido #${(order as any).order_number || order.id.slice(-8)} impresso na Bematech MP-4200 TH`,
        })
      } else {
        toast({
          title: "Erro na Impressão Térmica",
          description: result.message,
          variant: "destructive"
        })
        // Fallback para impressão via navegador
        printBrowserReceipt(order)
      }
    } catch (error) {
      console.error('❌ Erro na impressão térmica:', error)
      toast({
        title: "Erro na Impressão Térmica",
        description: "Usando impressão via navegador como alternativa",
        variant: "destructive"
      })
      // Fallback para impressão via navegador
      printBrowserReceipt(order)
    }
  }

  // Função para imprimir via navegador (sistema original)
  const printBrowserReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido #${order.id.slice(-8)} - Cozinha</title>
        <style>
          @media print {
            @page { 
              margin: 5mm; 
              size: 80mm auto;
            }
            body { 
              margin: 0; 
              font-size: 11px;
              line-height: 1.2;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 70mm;
            margin: 0 auto;
            padding: 5mm;
            background: white;
            color: black;
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .order-number {
            font-size: 18px;
            font-weight: bold;
            margin: 5px 0;
          }
          .status {
            background: #000;
            color: white;
            padding: 3px 8px;
            font-weight: bold;
            font-size: 12px;
            margin: 5px 0;
          }
          .section {
            margin: 8px 0;
            padding: 3px 0;
          }
          .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 3px;
          }
          .item {
            margin: 3px 0;
            padding: 2px 0;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            margin-left: 5px;
            font-size: 10px;
          }
          .observations {
            background: #f0f0f0;
            padding: 5px;
            border: 1px solid #000;
            margin: 5px 0;
            font-weight: bold;
          }
          .footer {
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
          }
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .customer-info {
            font-size: 10px;
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: bold; font-size: 14px;">WILLIAM DISK PIZZA</div>
          <div style="font-size: 10px;">PEDIDO PARA COZINHA</div>
          <div class="order-number">PEDIDO #${(order as any).order_number || order.id.slice(-8)}</div>
          <div class="status">${statusLabels[order.status]}</div>
        </div>

        <div class="section">
          <div style="font-weight: bold;">DATA/HORA:</div>
          <div>${formatDateTime(order.created_at)}</div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">CLIENTE</div>
          <div class="customer-info">Cliente: ${(order as any).customer_code ? `[${(order as any).customer_code}] ` : ""}${(order as any).customer_display_name || (order as any).profiles?.full_name || (order as any).customer_name || 'N/A'}</div>
          <div class="customer-info">Fone: ${(order as any).customer_display_phone || (order as any).delivery_phone || (order as any).profiles?.phone || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">ENTREGA</div>
          <div style="font-size: 10px; word-wrap: break-word;">
            ${order.delivery_address}
          </div>
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div class="section-title">ITENS DO PEDIDO</div>
          ${order.order_items?.map(item => `
            <div class="item">
              <div class="item-name">${item.quantity}x ${item.products?.name || (item as any).name || 'Produto'}</div>
              ${item.size ? `<div class="item-details">Tamanho: ${item.size}</div>` : ''}
              
              ${item.half_and_half ? `
                <div class="item-details" style="background: #f0f0f0; padding: 3px; margin: 2px 0; border: 1px solid #ccc;">
                  <div style="font-weight: bold;">🍕 PIZZA MEIO A MEIO:</div>
                  <div>1ª metade: ${item.half_and_half.firstHalf?.productName || ''}</div>
                  ${item.half_and_half.firstHalf?.toppings && item.half_and_half.firstHalf.toppings.length > 0 ? 
                    `<div style="margin-left: 10px;">+ ${item.half_and_half.firstHalf.toppings.join(', ')}</div>` : ''
                  }
                  <div>2ª metade: ${item.half_and_half.secondHalf?.productName || ''}</div>
                  ${item.half_and_half.secondHalf?.toppings && item.half_and_half.secondHalf.toppings.length > 0 ? 
                    `<div style="margin-left: 10px;">+ ${item.half_and_half.secondHalf.toppings.join(', ')}</div>` : ''
                  }
                </div>
              ` : ''}
              
              ${!item.half_and_half && item.toppings && item.toppings.length > 0 ? 
                `<div class="item-details">Adicionais: ${item.toppings.join(', ')}</div>` : ''
              }
              
              ${item.special_instructions ? `
                <div class="observations" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 3px; margin: 2px 0;">
                  <div style="font-weight: bold; font-size: 10px;">📝 OBSERVAÇÕES:</div>
                  <div style="font-size: 10px;">${item.special_instructions}</div>
                </div>
              ` : ''}
            </div>
          `).join('') || ''}
        </div>

        <div class="dashed-line"></div>

        <div class="section">
          <div style="font-weight: bold;">PAGAMENTO: ${mapPaymentMethodToPortuguese(order.payment_method)}</div>
          <div style="font-weight: bold;">TOTAL: ${formatCurrency(order.total)}</div>
        </div>

        ${order.delivery_instructions ? `
          <div class="observations">
            <div style="text-decoration: underline; margin-bottom: 3px;">OBSERVAÇÕES:</div>
            <div>${order.delivery_instructions}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="dashed-line"></div>
          <div>Impresso em: ${new Date().toLocaleString('pt-BR')}</div>
          <div style="margin-top: 5px; font-weight: bold;">
            ${order.status === 'RECEIVED' ? '⏰ AGUARDANDO PREPARO' : 
              order.status === 'PREPARING' ? '🔥 EM PREPARO' : 
              '✅ PROCESSADO'}
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    
    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }

    toast({
      title: "Imprimindo via Navegador",
      description: `Pedido #${(order as any).order_number || order.id.slice(-8)} enviado para impressão`,
    })
  }

  // Função principal de impressão (escolhe automaticamente o melhor método)
  const printKitchenReceipt = (order: Order) => {
    if (thermalPrintEnabled) {
      printThermal(order)
    } else {
      printBrowserReceipt(order)
    }
  }

  return {
    thermalPrintEnabled,
    printKitchenReceipt,
    printThermal,
    printBrowserReceipt,
  }
}