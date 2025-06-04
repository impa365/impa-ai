"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, Play, Copy, RotateCcw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// SQLs pré-definidos para facilitar
const PREDEFINED_SQLS = {
  "Adicionar Integrações Vector Store": `-- Adicionar colunas para integrações de vector store
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS chatnode_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chatnode_api_key TEXT,
ADD COLUMN IF NOT EXISTS chatnode_bot_id TEXT,
ADD COLUMN IF NOT EXISTS orimon_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS orimon_api_key TEXT,
ADD COLUMN IF NOT EXISTS orimon_bot_id TEXT;`,

  "Verificar Estrutura da Tabela ai_agents": `SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agents' 
ORDER BY ordinal_position;`,

  "Verificar Integrações Existentes": `SELECT 
  id, name, 
  chatnode_integration, 
  orimon_integration,
  voice_integration,
  calendar_integration
FROM ai_agents;`,

  "Listar Todas as Tabelas": `SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;`,

  "Verificar Usuários": `SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at DESC;`,
}

export default function SQLExecutorPage() {
  const [sql, setSql] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const executeSql = async () => {
    if (!sql.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um comando SQL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: sql.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        toast({
          title: "Sucesso",
          description: data.message,
        })
      } else {
        setError(data.message || "Erro ao executar SQL")
        toast({
          title: "Erro",
          description: data.message || "Erro ao executar SQL",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro de conexão"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "SQL copiado para a área de transferência",
    })
  }

  const loadPredefinedSql = (sqlText: string) => {
    setSql(sqlText)
    setResult(null)
    setError(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Executor SQL</h1>
        <Badge variant="destructive">Admin Only</Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> Esta ferramenta permite executar comandos SQL diretamente no banco de dados. Use com
          cuidado e sempre faça backup antes de executar comandos que modificam dados.
        </AlertDescription>
      </Alert>

      {/* SQLs Pré-definidos */}
      <Card>
        <CardHeader>
          <CardTitle>SQLs Pré-definidos</CardTitle>
          <CardDescription>Clique em um dos comandos abaixo para carregá-lo no editor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(PREDEFINED_SQLS).map(([name, sqlText]) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => loadPredefinedSql(sqlText)}
                className="justify-start h-auto p-3 text-left"
              >
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{sqlText.split("\n")[0].substring(0, 50)}...</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor SQL */}
      <Card>
        <CardHeader>
          <CardTitle>Editor SQL</CardTitle>
          <CardDescription>Digite ou cole seu comando SQL abaixo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Digite seu comando SQL aqui..."
              className="min-h-[200px] font-mono text-sm"
            />
            {sql && (
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(sql)} className="absolute top-2 right-2">
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={executeSql} disabled={loading || !sql.trim()} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {loading ? "Executando..." : "Executar SQL"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSql("")
                setResult(null)
                setError(null)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {(result || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {error ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Erro
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Resultado
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>✅ {result.message}</span>
                  {result.rowCount !== null && <span>📊 {result.rowCount} linha(s)</span>}
                </div>

                {result.data && (
                  <div className="bg-muted p-4 rounded-lg overflow-auto">
                    <pre className="text-sm">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
