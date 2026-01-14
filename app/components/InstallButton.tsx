'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Detectar si ya está instalada (Modo Standalone)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 2. Capturar el evento de instalación
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Solo mostramos si NO está instalada ya
      if (!isStandalone) {
        setShowInstall(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  // Si ya es una App, no renderizamos nada
  if (isStandalone || !showInstall) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-violet-600 text-white p-1 rounded-2xl shadow-2xl shadow-violet-900/50 flex items-center gap-2 pr-4 border border-white/10">
        <button 
          onClick={handleInstallClick}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl transition-colors"
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <Download size={20} className="animate-bounce" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Instalar App</p>
            <p className="text-sm font-black leading-none">PokéBinders</p>
          </div>
        </button>
        <button 
          onClick={() => setShowInstall(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}