"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WhatsAppImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WhatsAppImportModal({
  open,
  onOpenChange,
  onSuccess,
}: WhatsAppImportModalProps) {
  const [formData, setFormData] = useState({
    instanceName: "",
    apiKey: "",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleImport = async () => {
    if (!formData.instanceName || !formData.apiKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);

      const response = await fetch("/api/whatsapp/import-instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Instância importada",
          description: "A instância foi importada com sucesso!",
        });
        
        // Reset form
        setFormData({
          instanceName: "",
          apiKey: "",
        });
        
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Erro ao importar",
          description: result.error || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao importar instância:", error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Importar Instância Existente
          </DialogTitle>
          <DialogDescription>
            Importe uma instância que já existe na Evolution API para o painel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta funcionalidade permite importar instâncias que foram criadas 
              diretamente na Evolution API ou em outros painéis.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Será utilizada a URL da Evolution API já configurada em Integrações.
              Caso não esteja configurada, configure primeiro em Integrações → Evolution API.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância *</Label>
            <Input
              id="instanceName"
              placeholder="minha_instancia_123"
              value={formData.instanceName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, instanceName: e.target.value }))
              }
            />
            <p className="text-xs text-gray-500">
              Nome exato da instância na Evolution API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key da Instância *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sua-api-key-da-instancia"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              API Key específica da instância (não a global da Evolution API)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Importar Instância
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 