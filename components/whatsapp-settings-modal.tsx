import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function WhatsappSettingsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Configurar WhatsApp</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configurações da Conexão</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure as opções da sua conexão WhatsApp
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="connectionName" className="text-foreground">
              Nome da Conexão
            </Label>
            <Input id="connectionName" value="NomeConexao" className="col-span-3" />
            <p className="text-xs text-muted-foreground mt-1 col-span-4">Nome para identificar esta conexão</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-foreground">
              Número de Telefone
            </Label>
            <Input id="phoneNumber" value="+5511999999999" className="col-span-3" />
            <p className="text-xs text-muted-foreground mt-1 col-span-4">Número do WhatsApp com o código do país</p>
          </div>
        </div>
        {/* <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}
