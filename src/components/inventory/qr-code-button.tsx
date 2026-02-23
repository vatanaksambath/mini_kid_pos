'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { QrCode, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'

interface QRCodeButtonProps {
  sku: string
  productName: string
  variantInfo: string
}

export default function QRCodeButton({ sku, productName, variantInfo }: QRCodeButtonProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${sku}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              font-family: sans-serif;
            }
            .label-container {
              border: 1px solid #000;
              padding: 20px;
              text-align: center;
              width: 200px;
            }
            .sku { font-weight: bold; margin-top: 10px; }
            .info { font-size: 12px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${printContent.innerHTML}
            <div class="sku">${sku}</div>
            <div class="info">${productName}</div>
            <div class="info">${variantInfo}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for ${sku}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <div ref={printRef} className="bg-white p-4">
            <QRCodeSVG value={sku} size={200} level="H" includeMargin />
          </div>
          <div className="text-center">
            <p className="font-bold">{sku}</p>
            <p className="text-sm text-muted-foreground">{productName}</p>
            <p className="text-sm text-muted-foreground">{variantInfo}</p>
          </div>
          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" /> Print Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
