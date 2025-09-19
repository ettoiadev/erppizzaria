'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GeolocationPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a aba de geolocalização nas configurações
    router.replace('/admin/configuracoes?tab=geolocation')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecionando para configurações...</p>
      </div>
    </div>
  )
}