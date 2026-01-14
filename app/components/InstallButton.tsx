'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'
import { toast } from 'sonner'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Detectar si ya está instalada (Standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(isInStandaloneMode)

    // 2. Detectar si es iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    // 3. Capturar el evento de instalación (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault() // Evitar que Chrome muestre su banner automático feo
      setDeferredPrompt(e) // Guardamos el evento para lanzarlo cuando queramos
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Si ya está instalada como App, no mostramos nada
  if (isStandalone) return null

  const handleInstallClick = async () => {
    // CASO A: ANDROID / CHROME DESKTOP
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null) // Ocultamos el botón tras instalar
        toast.success("¡Instalando App!")
      }
    } 
    // CASO B: iOS (iPhone)
    else if (isIos) {
      setShowIosHint(true) // Mostramos las instrucciones
    } else {
        // Fallback raro
        toast.info("Para instalar, busca la opción 'Añadir a inicio' en tu navegador.")
    }
  }

  // Si no es instalable (no hay evento) y no es iOS, no mostramos nada
  if (!deferredPrompt && !isIos) return null

  return (
    <>
      {/* EL BOTÓN FLOTANTE */}
      <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <button 
          onClick={handleInstallClick}
          className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-3 rounded-full shadow-lg shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Download size={20} className="animate-bounce" />
          <span className="font-bold text-sm uppercase tracking-wider">Descargar App</span>
        </button>
      </div>

      {/* MODAL DE INSTRUCCIONES PARA IPHONE (Solo sale si es iOS y le dan al botón) */}
      {showIosHint && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl mb-8 sm:mb-0">
                <button onClick={() => setShowIosHint(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                <div className="text-center">
                    <h3 className="text-lg font-black text-white mb-2">Instalar en iPhone</h3>
                    <p className="text-slate-400 text-sm mb-6">iOS no permite instalación automática. Sigue estos 2 pasos:</p>
                    
                    <div className="space-y-4 text-left bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-2 rounded-lg text-blue-400"><Share size={20} /></div>
                            <span className="text-sm text-white">1. Pulsa el botón <b>Compartir</b> abajo.</span>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-2 rounded-lg text-white"><PlusSquare size={20} /></div>
                            <span className="text-sm text-white">2. Selecciona <b>"Añadir a inicio"</b>.</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <div className="animate-bounce text-slate-500"><ChevronDown size={24} /></div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}

// Icono flecha abajo para el modal
function ChevronDown({ size, className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
}