"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const feedbackVariants = cva(
  "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg p-4 shadow-lg transition-all duration-300 transform",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

export interface ActionFeedbackProps extends VariantProps<typeof feedbackVariants> {
  message: string
  duration?: number
  onClose?: () => void
}

// Singleton para gerenciar o estado global do feedback
type FeedbackState = {
  isVisible: boolean
  message: string
  variant: "success" | "error" | "warning" | "info"
  duration: number
  onClose?: () => void
}

let listeners: ((state: FeedbackState) => void)[] = []
let currentState: FeedbackState = {
  isVisible: false,
  message: "",
  variant: "info",
  duration: 3000,
}

export const showFeedback = (
  message: string,
  variant: "success" | "error" | "warning" | "info" = "info",
  duration = 3000,
  onClose?: () => void
) => {
  currentState = {
    isVisible: true,
    message,
    variant,
    duration,
    onClose,
  }
  listeners.forEach(listener => listener(currentState))
}

export function ActionFeedback() {
  const [state, setState] = useState<FeedbackState>(currentState)

  useEffect(() => {
    const listener = (newState: FeedbackState) => {
      setState(newState)
    }
    
    listeners.push(listener)
    
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  useEffect(() => {
    if (state.isVisible) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false }))
        if (state.onClose) {
          state.onClose()
        }
      }, state.duration)
      
      return () => clearTimeout(timer)
    }
  }, [state])

  if (!state.isVisible) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  return (
    <div className={cn(feedbackVariants({ variant: state.variant }))}>
      {icons[state.variant]}
      <span>{state.message}</span>
    </div>
  )
}