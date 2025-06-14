"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SupabaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics/supabase")
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      console.error("Erro ao executar diagnósticos:", error)
    } finally {
      setLoading(false)
    }
  }

  const runTableDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics/tables")
      const data = await response.json()
      console.log("📊 Table Diagnostics:", data)
      alert("Verifique o console para detalhes dos diagnósticos de tabela")
    } catch (error) {
      console.error("Erro ao executar diagnósticos de tabela:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnósticos do Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? "Executando..." : "Executar Diagnósticos"}
          </Button>
          <Button onClick={runTableDiagnostics} disabled={loading} variant="outline">
            Diagnósticos de Tabela
          </Button>
        </div>

        {diagnostics && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={diagnostics.success ? "default" : "destructive"}>
                {diagnostics.success ? "Sucesso" : "Erro"}
              </Badge>
              <span className="text-sm text-gray-500">{diagnostics.timestamp}</span>
            </div>

            {diagnostics.diagnostics.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Erros Encontrados:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {diagnostics.diagnostics.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-700 text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Conexão</h3>
                <Badge variant={diagnostics.diagnostics.connection?.status === "success" ? "default" : "destructive"}>
                  {diagnostics.diagnostics.connection?.status}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Schema 'impaai'</h3>
                <Badge variant={diagnostics.diagnostics.schema?.status === "exists" ? "default" : "destructive"}>
                  {diagnostics.diagnostics.schema?.status}
                </Badge>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Status das Tabelas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(diagnostics.diagnostics.tables).map(([tableName, status]: [string, any]) => (
                  <div key={tableName} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm">{tableName}</span>
                    <Badge variant={status.status === "accessible" ? "default" : "destructive"}>{status.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
