'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X, Smartphone, Compass } from 'lucide-react' // Añadido Compass para Safari
import { toast } from 'sonner'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    if (typeof window !== 'undefined') {
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
        setIsStandalone(isInStandaloneMode)
        
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIos(isIosDevice)
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log("¡Evento de instalación capturado!")
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (!isMounted) return null

  // Si ya es una App, no mostramos el botón
  if (isStandalone) return null

  const handleInstallClick = async () => {
    // CASO A: Instalación Real (Android/Chrome PC)
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        toast.success("¡Instalando App!")
      }
    } 
    // CASO B: iOS (iPhone/iPad)
    else if (isIos) {
      setShowIosHint(true)
    } 
    // CASO C: PC o Navegador no compatible
    else {
        toast.info("Instalar Web App", {
            description: "Busca la opción 'Instalar aplicación' o 'Añadir a inicio' en el menú de tu navegador.",
            icon: <Smartphone size={18} />
        })
    }
  }

  return (
    <>
      {/* EL BOTÓN FLOTANTE */}
      {/* Ajustado bottom-24 a bottom-28 para dar más aire en móviles */}
      <div className="fixed bottom-28 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <button 
          onClick={handleInstallClick}
          className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-3 rounded-full shadow-lg shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Download size={20} className="animate-bounce" />
          <span className="font-bold text-sm uppercase tracking-wider">Descargar App</span>
        </button>
      </div>

      {/* MODAL DE INSTRUCCIONES PARA IPHONE */}
      {showIosHint && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl mb-10 sm:mb-0">
                <button onClick={() => setShowIosHint(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-1 rounded-full"><X size={20}/></button>
                
                <div className="text-center">
                    <div className="mx-auto bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-blue-400">
                        <Compass size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Instalar en iPhone</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Para la mejor experiencia, abre esta web en <span className="text-blue-400 font-bold">Safari</span> y sigue estos pasos:
                    </p>
                    
                    <div className="space-y-3 text-left bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-2 rounded-lg text-blue-400 shrink-0"><Share size={20} /></div>
                            <span className="text-sm text-slate-200">1. Pulsa el botón <b>Compartir</b> en la barra inferior.</span>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-2 rounded-lg text-white shrink-0"><PlusSquare size={20} /></div>
                            <span className="text-sm text-slate-200">2. Busca y selecciona <b>"Añadir a inicio"</b>.</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 flex justify-center opacity-50">
                    <div className="animate-bounce text-slate-500"><ChevronDown size={24} /></div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}

function ChevronDown({ size, className }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
}