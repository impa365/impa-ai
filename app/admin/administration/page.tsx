"use client"

import { Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminAdministrationPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState("")

  const runEvolutionApiDiagnostic = async () => {
    setIsRunning(true)
    setError("")

    try {
      const response = await fetch("/api/admin/diagnostics/evolution-api")

      if (!response.ok) {
        throw new Error(`Erro ao executar diagnóstico: ${response.status}`)
      }

      const data = await response.json()
      setDiagnosticResults(data)
    } catch (err: any) {
      console.error("Erro ao executar diagnóstico:", err)
      setError(err.message || "Erro ao executar diagnóstico")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Administração Avançada</h1>
          <p className="text-gray-600 dark:text-gray-400">Ferramentas de diagnóstico e administração avançada</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Diagnóstico de Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Execute um diagnóstico completo das integrações para identificar problemas de configuração ou
              conectividade.
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={runEvolutionApiDiagnostic}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRunning ? "Executando..." : "Diagnosticar Evolution API"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {diagnosticResults && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">Resultados do Diagnóstico</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {diagnosticResults.configExists ? (
                      <CheckCircle className="text-green-500 w-5 h-5" />
                    ) : (
                      <XCircle className="text-red-500 w-5 h-5" />
                    )}
                    <span>
                      Configuração da Evolution API {diagnosticResults.configExists ? "encontrada" : "não encontrada"}
                    </span>
                  </div>

                  {diagnosticResults.configExists && (
                    <>
                      <div className="flex items-center gap-2">
                        {diagnosticResults.apiUrlValid ? (
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        ) : (
                          <AlertCircle className="text-amber-500 w-5 h-5" />
                        )}
                        <span>URL da API: {diagnosticResults.apiUrlValid ? "Válida" : "Formato inválido"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {diagnosticResults.apiKeyPresent ? (
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        ) : (
                          <XCircle className="text-red-500 w-5 h-5" />
                        )}
                        <span>API Key: {diagnosticResults.apiKeyPresent ? "Presente" : "Ausente"}</span>
                      </div>

                      {diagnosticResults.connectionTest && (
                        <div className="flex items-center gap-2">
                          {diagnosticResults.connectionTest.success ? (
                            <CheckCircle className="text-green-500 w-5 h-5" />
                          ) : (
                            <XCircle className="text-red-500 w-5 h-5" />
                          )}
                          <span>
                            Teste de Conexão: {diagnosticResults.connectionTest.success ? "Sucesso" : "Falha"}
                            {!diagnosticResults.connectionTest.success && diagnosticResults.connectionTest.error && (
                              <span className="block text-xs text-red-500 mt-1">
                                {diagnosticResults.connectionTest.error}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {diagnosticResults.n8nConfig && (
                    <>
                      <div className="mt-4 font-medium">Configuração do n8n:</div>
                      <div className="flex items-center gap-2">
                        {diagnosticResults.n8nConfig.flowUrlValid ? (
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        ) : (
                          <AlertCircle className="text-amber-500 w-5 h-5" />
                        )}
                        <span>
                          URL do Fluxo: {diagnosticResults.n8nConfig.flowUrlValid ? "Válida" : "Formato inválido"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Recomendações:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {diagnosticResults.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Outras Ferramentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mais ferramentas de administração serão adicionadas em breve.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
