import { AlertTriangle } from "lucide-react"
import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  title = "오류가 발생했습니다",
  message,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle className="text-destructive">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left mt-2">{message}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default ErrorDialog
