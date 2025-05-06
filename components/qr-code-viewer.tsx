"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface QRCodeViewerProps {
  isOpen: boolean
  onClose: () => void
  qrCode: {
    name: string
    url: string
    svg_path: string
    png_path: string
  }
}

export function QRCodeViewer({ isOpen, onClose, qrCode }: QRCodeViewerProps) {
  const [format, setFormat] = useState<"svg" | "png">("svg")

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{qrCode.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <img
              src={format === "svg" ? qrCode.svg_path : qrCode.png_path}
              alt={`QR Code for ${qrCode.url}`}
              className="w-64 h-64"
            />
          </div>
          <div className="text-sm text-center text-gray-500 max-w-[250px] truncate">{qrCode.url}</div>
          <div className="flex gap-2">
            <Button variant={format === "svg" ? "default" : "outline"} size="sm" onClick={() => setFormat("svg")}>
              SVG
            </Button>
            <Button variant={format === "png" ? "default" : "outline"} size="sm" onClick={() => setFormat("png")}>
              PNG
            </Button>
          </div>
          <Button
            onClick={() =>
              handleDownload(format === "svg" ? qrCode.svg_path : qrCode.png_path, `${qrCode.name}.${format}`)
            }
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
