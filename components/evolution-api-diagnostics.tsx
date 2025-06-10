"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from "lucide-react"

export function EvolutionApiDiagnostics() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/diagnostics/evolution-api")
      const data = await response.json()

      setDiagnosticResult(data)
    } catch (err: any) {
      setError(err.message || "Erro ao executar diagnóstico")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Diagnóstico da Evolution API</CardTitle>
        <CardDescription>Verifique a configuração e conectividade com a Evolution API</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagnosticResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {diagnosticResult.success ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-4 h-4 mr-1" /> Configuração Válida
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XCircle className="w-4 h-4 mr-1" /> Problema Detectado
                </Badge>
              )}
            </div>

            <Alert variant={diagnosticResult.success ? "default" : "destructive"}>
              <AlertTitle>Resultado</AlertTitle>
              <AlertDescription>{diagnosticResult.message}</AlertDescription>
            </Alert>

            {diagnosticResult.details && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-medium">Detalhes do Diagnóstico</h3>

                {/* Integração */}
                {diagnosticResult.details.integration && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium mb-2">Configuração da Integração</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>ID:</div>
                      <div>{diagnosticResult.details.integration.id}</div>

                      <div>Status:</div>
                      <div>
                        {diagnosticResult.details.integration.is_active ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </div>

                      <div>URL da API:</div>
                      <div>
                        {diagnosticResult.details.integration.config?.apiUrl ? (
                          diagnosticResult.details.integration.config.apiUrl
                        ) : (
                          <span className="text-red-600">Não configurada</span>
                        )}
                      </div>

                      <div>Chave API:</div>
                      <div>
                        {diagnosticResult.details.integration.config?.hasApiKey ? (
                          <span className="text-green-600">Configurada</span>
                        ) : (
                          <span className="text-yellow-600">Não configurada</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* n8n */}
                {diagnosticResult.details.n8n && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium mb-2">Configuração do n8n</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Configurado:</div>
                      <div>
                        {diagnosticResult.details.n8n.configured ? (
                          <span className="text-green-600">Sim</span>
                        ) : (
                          <span className="text-red-600">Não</span>
                        )}
                      </div>

                      <div>Status:</div>
                      <div>
                        {diagnosticResult.details.n8n.is_active ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </div>

                      <div>URL do Flow:</div>
                      <div>
                        {diagnosticResult.details.n8n.hasFlowUrl ? (
                          <span className="text-green-600">Configurada</span>
                        ) : (
                          <span className="text-red-600">Não configurada</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Teste de Conexão */}
                {diagnosticResult.details.connectionTest && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium mb-2">Teste de Conexão</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Resultado:</div>
                      <div>
                        {diagnosticResult.details.connectionTest.success ? (
                          <span className="text-green-600">Sucesso</span>
                        ) : (
                          <span className="text-red-600">Falha</span>
                        )}
                      </div>

                      <div>Status HTTP:</div>
                      <div>
                        {diagnosticResult.details.connectionTest.statusCode}{" "}
                        {diagnosticResult.details.connectionTest.statusText}
                      </div>

                      {diagnosticResult.details.connectionTest.responseBody && (
                        <>
                          <div>Resposta:</div>
                          <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                            {diagnosticResult.details.connectionTest.responseBody}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Erro de Conexão */}
                {diagnosticResult.details.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Conexão</AlertTitle>
                    <AlertDescription>{diagnosticResult.details.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {!diagnosticResult && !loading && (
          <div className="text-center py-8 text-gray-500">
            Clique no botão abaixo para executar o diagnóstico da Evolution API
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Executando diagnóstico...</p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={runDiagnostic} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {diagnosticResult ? "Executar Novamente" : "Executar Diagnóstico"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
