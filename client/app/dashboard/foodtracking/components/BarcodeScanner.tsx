"use client"

import { useState, useEffect, useRef } from "react"
import { X, ScanBarcode } from "lucide-react"
import { BarcodeDetector } from "barcode-detector/ponyfill"

type Props = {
  onDetected: (ean: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualEan, setManualEan] = useState("")

  useEffect(() => {
    let stream: MediaStream | null = null
    let interval: ReturnType<typeof setInterval> | null = null
    let detected = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        })
      } catch {
        setCameraError("Kameraåtkomst nekades — kontrollera webbläsarens inställningar eller ange streckkoden manuellt.")
        return
      }
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      try {
        await video.play()
      } catch {}

      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8"] })
      interval = setInterval(async () => {
        if (detected || !videoRef.current || videoRef.current.readyState < 2) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0 && codes[0].rawValue) {
            detected = true
            onDetected(codes[0].rawValue)
          }
        } catch {}
      }, 250)
    }

    start()

    return () => {
      if (interval) clearInterval(interval)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleManualSubmit() {
    const ean = manualEan.trim()
    if (ean.length >= 8) onDetected(ean)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
            <ScanBarcode size={18} className="text-indigo-500" />
            Skanna streckkod
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Stäng"
          >
            <X size={18} />
          </button>
        </div>

        {cameraError ? (
          <p className="text-sm text-red-500 dark:text-red-400 px-5 pt-4">{cameraError}</p>
        ) : (
          <div className="relative bg-black aspect-[4/3]">
            <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-24 border-2 border-white/70 rounded-lg" />
            </div>
          </div>
        )}

        <div className="px-5 py-4 flex flex-col gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {cameraError ? "Ange streckkoden manuellt:" : "Rikta kameran mot streckkoden, eller ange den manuellt:"}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualEan}
              onChange={(e) => setManualEan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              placeholder="T.ex. 7310865004703"
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleManualSubmit}
              disabled={manualEan.trim().length < 8}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sök
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
