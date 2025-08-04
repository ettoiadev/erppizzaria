import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numPrice) ? '0,00' : numPrice.toFixed(2).replace('.', ',')
}

export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

export function formatCurrencyInput(value: string): string {
  let valor = value.replace(/\D/g, '')
  
  if (!valor) return ''
  
  // Converter para reais (dividir por 100)
  const reais = parseInt(valor) / 100
  
  // Formatar como moeda brasileira
  let formatted = reais.toFixed(2).replace('.', ',')
  formatted = formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  
  return 'R$ ' + formatted
}

export function formatCurrencyInputFromReais(value: number): string {
  if (value <= 0) return ''
  
  // Converter reais para centavos para formatação
  const centavos = Math.round(value * 100)
  return formatCurrencyInput(centavos.toString())
}

export function parseCurrencyInput(formattedValue: string): number {
  if (!formattedValue) return 0
  
  const numericString = formattedValue
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  return parseFloat(numericString) || 0
}

export function useCurrencyInput(initialValue: number = 0) {
  const formatValue = (value: number): string => {
    return formatCurrency(value)
  }
  
  const handleInputChange = (inputValue: string): { formatted: string; numeric: number } => {
    const formatted = formatCurrencyInput(inputValue)
    const numeric = parseCurrencyInput(formatted)
    
    return { formatted, numeric }
  }
  
  return { formatValue, handleInputChange }
}
