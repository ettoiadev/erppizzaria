"use client"

import React, { useState, useEffect, forwardRef } from "react"
import { Input } from "./input"
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: number
  onChange?: (value: number) => void
  onFormattedChange?: (formatted: string) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, onFormattedChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")

    // Inicializar valor formatado
    useEffect(() => {
      if (value !== undefined) {
        const formatted = value > 0 ? formatCurrencyInput((value * 100).toString()) : ""
        setDisplayValue(formatted)
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Se o campo estiver sendo limpo
      if (!inputValue) {
        setDisplayValue("")
        onChange?.(0)
        onFormattedChange?.("")
        return
      }

      // Formatar o valor
      const formatted = formatCurrencyInput(inputValue)
      const numericValue = parseCurrencyInput(formatted)

      setDisplayValue(formatted)
      onChange?.(numericValue)
      onFormattedChange?.(formatted)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir apenas números, backspace, delete, tab, escape, enter, home, end, setas
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
      ]
      
      const isNumber = (e.key >= '0' && e.key <= '9')
      const isAllowedKey = allowedKeys.includes(e.key)
      const isSelectAll = (e.ctrlKey || e.metaKey) && e.key === 'a'
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c'
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v'
      
      if (!isNumber && !isAllowedKey && !isSelectAll && !isCopy && !isPaste) {
        e.preventDefault()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedText = e.clipboardData.getData('text')
      
      // Extrair apenas números do texto colado
      const numbersOnly = pastedText.replace(/\D/g, '')
      
      if (numbersOnly) {
        const formatted = formatCurrencyInput(numbersOnly)
        const numericValue = parseCurrencyInput(formatted)
        
        setDisplayValue(formatted)
        onChange?.(numericValue)
        onFormattedChange?.(formatted)
      }
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="R$ 0,00"
      />
    )
  }
)

CurrencyInput.displayName = "CurrencyInput" 