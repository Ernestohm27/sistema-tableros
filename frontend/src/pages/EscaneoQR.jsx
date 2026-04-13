import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

export default function EscaneoQR() {
  const scannerRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const navigate = useNavigate()

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
        const { data } = await api.post('/qr/escanear', { qr_data: decodedText })
        toast.success('QR escaneado correctamente')
        setTimeout(() => navigate(`/tableros/${data.tablero.id}`), 1000)
      } catch {
        toast.error('QR no reconocido')
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => navigate('/tableros')}
          className="text-blue-600 hover:underline text-sm mb-4 block"
        >
          ← Volver a tableros
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Escanear código QR</h1>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div id="reader" style={{ width: '100%' }}></div>
          {!scanning && (
            <button
              onClick={() => setScanning(true)}
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