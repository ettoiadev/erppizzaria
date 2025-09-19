"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Key, AlertTriangle } from "lucide-react"

export default function EmergencyAdminPage() {
  const [email, setEmail] = useState("admin@williamdiskpizza.com")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("AdminPizza2024!")
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testLogin = async () => {
    setIsLoading(true)
    setStatus("🔄 Testando login...")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("✅ Login OK! Redirecionando...")
        
        setTimeout(() => {
          window.location.href = "/admin/configuracoes"
        }, 1000)
      } else {
        setStatus(`❌ Login falhou: ${data.error}`)
      }
    } catch (error) {
      setStatus(`💥 Erro: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const promoteToAdmin = async () => {
    setStatus("🔧 Promovendo para admin...")
    
    // Usar o console do PostgreSQL para esta operação
    setStatus("⚠️ Use o console do PostgreSQL: UPDATE profiles SET role = 'admin' WHERE email = '" + email + "';")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <Shield className="w-6 h-6" />
            Emergência Admin
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Página para resolver problemas de acesso admin
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email Admin:</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@williamdiskpizza.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha para Testar:</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="AdminPizza2024!"
              />
            </div>

            <Button 
              onClick={testLogin} 
              disabled={isLoading}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {isLoading ? "Testando..." : "Testar Login"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>Ou tente estas senhas comuns:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword("admin123")}
                >
                  admin123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword("123456")}
                >
                  123456
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword("pizza123")}
                >
                  pizza123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword("william123")}
                >
                  william123
                </Button>
              </div>
            </div>
          </div>

          {status && (
            <Alert className={status.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">💡 Soluções Definitivas:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
                              <li>Reset senha via console do PostgreSQL</li>
              <li>Criar novo admin via Authentication &gt; Users</li>
              <li>Se login OK aqui, vá para /admin/configuracoes</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}