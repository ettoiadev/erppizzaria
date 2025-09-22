"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertTriangle, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ErrorLog {
  id: number
  message: string
  stack?: string
  context: string
  user_id?: string
  created_at: string
}

export default function ErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/error-logs')
      
      if (!res.ok) {
        throw new Error('Falha ao carregar logs de erros')
      }
      
      const data = await res.json()
      setLogs(data.errors || [])
      setError(null)
    } catch (err) {
      setError('Erro ao carregar logs: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
      console.error('Erro ao buscar logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrorLogs()
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchErrorLogs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Filtrar logs por contexto
  const filteredLogs = activeTab === 'all' 
    ? logs 
    : logs.filter(log => log.context.toLowerCase().includes(activeTab))

  // Agrupar por contexto para as abas
  const contexts = ['api', 'frontend', 'database', 'auth']
  
  // Formatar data relativa
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ptBR
      })
    } catch (e) {
      return 'Data inválida'
    }
  }

  // Determinar severidade baseada no contexto
  const getSeverity = (context: string) => {
    if (context.includes('auth') || context.includes('security')) return 'high'
    if (context.includes('database')) return 'medium'
    return 'low'
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Monitor de Erros</CardTitle>
          <CardDescription>
            Visualize e analise erros do sistema
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchErrorLogs}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        ) : null}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              Todos
              <Badge variant="outline" className="ml-2">{logs.length}</Badge>
            </TabsTrigger>
            {contexts.map(context => (
              <TabsTrigger key={context} value={context}>
                {context.charAt(0).toUpperCase() + context.slice(1)}
                <Badge variant="outline" className="ml-2">
                  {logs.filter(log => log.context.toLowerCase().includes(context)).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum log de erro encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium break-all">{log.message}</div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            getSeverity(log.context) === 'high' 
                              ? 'destructive' 
                              : getSeverity(log.context) === 'medium' 
                                ? 'default' 
                                : 'outline'
                          }
                        >
                          {log.context}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                          Detalhes do erro
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-[200px]">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                    
                    {log.user_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Usuário: {log.user_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}