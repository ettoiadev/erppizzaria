"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useThermalPrinter, PrinterConfig, PrinterStatus } from '@/lib/thermal-printer'
import { Printer, Settings, TestTube, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface PrinterSettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
  onMarkUnsaved: () => void
}

export function PrinterSettings({ settings, onSave, onMarkUnsaved }: PrinterSettingsProps) {
  const [config, setConfig] = useState<PrinterConfig>({
    interface: 'tcp://192.168.1.100:9100',
    type: 'EPSON',
    characterSet: 'PC860_PORTUGUESE',
    timeout: 5000
  })
  
  const [status, setStatus] = useState<PrinterStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
  
  const { toast } = useToast()
  const thermalPrinter = useThermalPrinter()

  // Verificar status ao carregar
  useEffect(() => {
    checkServerStatus()
    if (serverRunning) {
      getStatus()
    }
  }, [serverRunning])

  const checkServerStatus = async () => {
    const running = await thermalPrinter.checkServer()
    setServerRunning(running)
  }

  const getStatus = async () => {
    setLoading(true)
    try {
      const printerStatus = await thermalPrinter.getStatus()
      setStatus(printerStatus)
      
      if (printerStatus?.config) {
        setConfig(printerStatus.config)
      }
    } catch (error) {
      console.error('Erro ao obter status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      const result = await thermalPrinter.configurePrinter(config)
      
      if (result.success) {
        toast({
          title: "Configuração Salva",
          description: "Impressora configurada com sucesso",
        })
        await getStatus()
        onMarkUnsaved()
      } else {
        toast({
          title: "Erro na Configuração",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro na Configuração",
        description: "Falha ao configurar impressora",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestPrint = async () => {
    setTesting(true)
    try {
      const result = await thermalPrinter.testPrint()
      
      if (result.success) {
        toast({
          title: "Teste de Impressão",
          description: "Teste realizado com sucesso! Verifique a impressora.",
        })
      } else {
        toast({
          title: "Erro no Teste",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro no Teste",
        description: "Falha ao executar teste de impressão",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const connectionTypes = [
    { value: 'tcp://192.168.1.100:9100', label: 'TCP/IP (Ethernet)', description: 'Conexão via rede' },
    { value: 'printer:Generic / Text Only', label: 'USB (Windows)', description: 'Conexão USB direta' },
    { value: 'COM3', label: 'Serial (COM3)', description: 'Porta serial COM3' },
    { value: 'COM4', label: 'Serial (COM4)', description: 'Porta serial COM4' },
  ]

  const characterSets = [
    { value: 'PC860_PORTUGUESE', label: 'PC860 (Português)' },
    { value: 'PC850_MULTILINGUAL', label: 'PC850 (Multilingual)' },
    { value: 'PC437_USA', label: 'PC437 (USA)' },
    { value: 'PC852_LATIN2', label: 'PC852 (Latin 2)' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração da Impressora</h2>
          <p className="text-muted-foreground">Configure a impressora térmica Bematech MP-4200 TH</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={serverRunning ? "secondary" : "destructive"} className="flex items-center gap-1">
            {serverRunning ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Servidor Online
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Servidor Offline
              </>
            )}
          </Badge>
          
          <Button variant="outline" size="sm" onClick={checkServerStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {!serverRunning && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              Servidor de Impressão Offline
            </CardTitle>
            <CardDescription className="text-orange-600">
              O servidor de impressão não está rodando. Para usar a impressora térmica:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-orange-700">
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra um terminal na pasta <code className="bg-orange-100 px-1 rounded">print-server</code></li>
              <li>Execute: <code className="bg-orange-100 px-1 rounded">npm install</code></li>
              <li>Execute: <code className="bg-orange-100 px-1 rounded">npm start</code></li>
              <li>Clique em "Atualizar" acima</li>
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração
            </CardTitle>
            <CardDescription>
              Configure a conexão com a impressora Bematech MP-4200 TH
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connection-type">Tipo de Conexão</Label>
              <Select
                value={config.interface || 'tcp://192.168.1.100:9100'}
                onValueChange={(value) => {
                  setConfig({ ...config, interface: value })
                  onMarkUnsaved()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conexão" />
                </SelectTrigger>
                <SelectContent>
                  {connectionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.interface.startsWith('tcp://') && (
              <div className="space-y-2">
                <Label htmlFor="ip-address">Endereço IP</Label>
                <Input
                  id="ip-address"
                  placeholder="192.168.1.100:9100"
                  value={config.interface?.replace('tcp://', '') || ''}
                  onChange={(e) => {
                    setConfig({ ...config, interface: `tcp://${e.target.value}` })
                    onMarkUnsaved()
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="character-set">Conjunto de Caracteres</Label>
              <Select
                value={config.characterSet || 'PC860_PORTUGUESE'}
                onValueChange={(value) => {
                  setConfig({ ...config, characterSet: value })
                  onMarkUnsaved()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o conjunto de caracteres" />
                </SelectTrigger>
                <SelectContent>
                  {characterSets.map((charset) => (
                    <SelectItem key={charset.value} value={charset.value}>
                      {charset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                placeholder="5000"
                value={config.timeout || ''}
                onChange={(e) => {
                  setConfig({ ...config, timeout: parseInt(e.target.value) || 5000 })
                  onMarkUnsaved()
                }}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={handleSaveConfig}
                disabled={loading || !serverRunning}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleTestPrint}
                disabled={testing || !serverRunning}
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Status da Impressora
            </CardTitle>
            <CardDescription>
              Informações sobre a conexão e configuração atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={status.connected ? "secondary" : "destructive"}>
                    {status.connected ? 'Conectada' : 'Desconectada'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tipo</span>
                  <span className="text-sm text-muted-foreground">
                    {status.config.type || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Interface</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {status.config.interface || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Charset</span>
                  <span className="text-sm text-muted-foreground">
                    {status.config.characterSet || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atualização</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(status.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {serverRunning ? (
                  <>
                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Carregando status da impressora...</p>
                    <Button variant="outline" size="sm" onClick={getStatus} className="mt-2">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Carregar Status
                    </Button>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Servidor de impressão offline</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Manual de Configuração - Bematech MP-4200 TH</CardTitle>
          <CardDescription>
            Instruções para configurar a impressora corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">1. Conexão USB</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Conecte o cabo USB</li>
                <li>• Instale o driver oficial</li>
                <li>• Configure como "Generic / Text Only"</li>
                <li>• Use interface: <code>printer:Generic / Text Only</code></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Conexão Serial</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Conecte cabo serial/USB-Serial</li>
                <li>• Configure velocidade: 9600 bps</li>
                <li>• Verificar porta no Gerenciador</li>
                <li>• Use interface: <code>COM3</code> ou <code>COM4</code></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Conexão Ethernet</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Configure IP fixo na impressora</li>
                <li>• Porta padrão: 9100</li>
                <li>• Teste ping: <code>ping 192.168.1.100</code></li>
                <li>• Use interface: <code>tcp://IP:9100</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}