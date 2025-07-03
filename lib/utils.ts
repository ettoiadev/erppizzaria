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
  let numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  const realValue = parseInt(numericValue) / 100
  
  let formatted = realValue.toFixed(2).replace('.', ',')
  
  formatted = formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  
  return `R$ ${formatted}`
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
