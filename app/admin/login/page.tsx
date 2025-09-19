"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminRegisterModal } from "@/components/admin/auth/admin-register-modal"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password, true) // true indica login administrativo
      
      if (result.success) {
        // Pequeno delay para garantir que o estado seja atualizado
        setTimeout(() => {
          router.push("/admin")
        }, 100)
      } else {
        setError(result.error || "Email ou senha inválidos")
      }
    } catch (error: any) {
      setError(error.message || "Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false)
    setError("")
    // Optionally show success message
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Área Administrativa</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRegisterModal(true)}
              disabled={loading}
            >
              Criar Conta de Administrador
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  )
}
