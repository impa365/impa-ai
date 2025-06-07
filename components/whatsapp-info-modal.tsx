import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WhatsAppInfoModalProps {
  children: React.ReactNode
}

export function WhatsAppInfoModal({ children }: WhatsAppInfoModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Informações da Conexão</DialogTitle>
          <DialogDescription className="text-muted-foreground">Detalhes da sua conexão WhatsApp</DialogDescription>
        </DialogHeader>
        {/* rest of the content will go here */}
      </DialogContent>
    </Dialog>
  )
}
