import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function extraerTableroId(qrText) {
  const value = (qrText || '').trim()
  const patterns = [
    /TABLERO:([a-fA-F0-9]{24})/i,
    /tablero_id=([a-fA-F0-9]{24})/i,
    /\/tableros\/([a-fA-F0-9]{24})/i,
    /\b([a-fA-F0-9]{24})\b/,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function EscaneoQR() {
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [pdfUrl, setPdfUrl] = useState('')
  const navigate = useNavigate()

  const abrirPdfDesdeTextoQr = async (decodedText) => {
    let tableroId = extraerTableroId(decodedText)

    // If the QR payload doesn't expose tablero_id directly, fall back to backend resolver.
    if (!tableroId) {
      const { data } = await api.post('/qr/escanear', { qr_data: decodedText })
      tableroId = data?.tablero?.id
    }

    if (!tableroId) {
      throw new Error('No se pudo obtener el tablero desde el QR')
    }

    const pdfResponse = await api.get(`/qr/reporte/${tableroId}`, {
      responseType: 'blob',
    })
    const nextPdfUrl = URL.createObjectURL(pdfResponse.data)
    setPdfUrl(nextPdfUrl)
    const opened = window.open(nextPdfUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      toast.info('Tu navegador bloqueo la apertura automatica. Toca "Abrir PDF".')
    }
    toast.success('QR escaneado. Abriendo reporte PDF...')
  }

  useEffect(() => {
    if (!scanning) return

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    const onScanSuccess = async (decodedText) => {
      setScanning(false)
      try {
        await abrirPdfDesdeTextoQr(decodedText)
      } catch (error) {
        toast.error(error.response?.data?.detail || 'QR no reconocido')
        setScanning(true)
      }
      scanner.clear()
    }

    scanner.render(onScanSuccess, undefined)
    scannerRef.current = scanner

    return () => {
      scanner.clear()
    }
  }, [scanning])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const handleArchivoQr = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setScanning(false)
    try {
      const html5Qr = new Html5Qrcode('reader')
      const decodedText = await html5Qr.scanFile(file, true)
      await abrirPdfDesdeTextoQr(decodedText)
    } catch (error) {
      toast.error(error?.message || 'No se pudo leer el QR desde la imagen')
      setScanning(true)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate('/tableros')}
          className="text-blue-600 hover:underline text-sm mb-4 block"
        >
          ← Volver a tableros
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Escanear código QR</h1>
        
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <div id="reader" style={{ width: '100%' }}></div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleArchivoQr}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mt-4 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Leer QR desde imagen
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full mt-4 inline-flex justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Abrir PDF
            </a>
          )}
          {!scanning && (
            <button
              onClick={() => {
                setPdfUrl('')
                setScanning(true)
              }}
              className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Escanear de nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}