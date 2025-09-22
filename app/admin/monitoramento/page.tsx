import { Metadata } from 'next'
import ErrorLogs from '@/components/admin/error-monitor/error-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cookies } from 'next/headers'
import { verifyAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Monitoramento de Erros | Admin',
  description: 'Painel de monitoramento de erros do sistema',
}

export default async function MonitoramentoPage() {
  // Verificar autenticação no servidor
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) {
    redirect('/admin/login')
  }
  
  const admin = await verifyAdmin(token)
  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monitoramento do Sistema</h1>
        <p className="text-muted-foreground">
          Monitore erros e desempenho do sistema
        </p>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Logs de Erros</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        
        <TabsContent value="errors" className="space-y-4">
          <ErrorLogs />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Desempenho</CardTitle>
              <CardDescription>
                Análise de desempenho do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidade em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Segurança</CardTitle>
              <CardDescription>
                Análise de eventos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidade em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}