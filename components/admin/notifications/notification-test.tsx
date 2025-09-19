"use client"

import { useEffect, useState } from "react"

export function NotificationTest() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // no-op placeholder
  }, [])

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Componente de Teste de Notificações</p>
          <p className="text-sm text-gray-600">Componente de teste para funcionalidades de notificação.</p>
        </div>
        <button
          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
          onClick={() => setCount((c) => c + 1)}
        >
          Cliquei {count}
        </button>
      </div>
    </div>
  )
}


