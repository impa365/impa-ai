import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WhatsAppQrModalProps {
  qrCodeUrl: string | null
  isOpen: boolean
  onClose: () => void
}

export function WhatsAppQrModal({ qrCodeUrl, isOpen, onClose }: WhatsAppQrModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Conectar WhatsApp</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>
        {qrCodeUrl ? (
          <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="mx-auto" />
        ) : (
          <p>Carregando QR Code...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
