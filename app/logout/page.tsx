'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, Save, CheckCircle2 } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  useEffect(() => {
    // Paso 1: "Guardando datos..." (1 segundo)
    const timer1 = setTimeout(() => setStep(2), 1500)
    
    // Paso 2: "Desconectando..." (1 segundo más)
    const timer2 = setTimeout(() => setStep(3), 3000)

    // Paso 3: Redirigir a la home
    const timer3 = setTimeout(() => {
        router.push('/')
        router.refresh()
    }, 4000)

    return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-violet-500/30">
      
      {/* FONDO (Reutilizamos el de la portada pero más oscuro) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] overflow-hidden perspective-grid-container opacity-20 z-10">
             <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000_100%)] z-20"></div>
             <div className="grid-floor animate-grid-move"></div>
        </div>
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-700">
        
        {/* ICONO ANIMADO */}
        <div className="relative">
            <div className="absolute -inset-4 bg-violet-600/20 blur-xl rounded-full animate-pulse"></div>
            <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                {step === 1 && <Save className="text-violet-400 animate-bounce" size={32} />}
                {step === 2 && <Power className="text-red-400 animate-pulse" size={32} />}
                {step === 3 && <CheckCircle2 className="text-emerald-400" size={32} />}
            </div>
        </div>

        {/* TEXTOS CAMBIANTES */}
        <div className="space-y-2 h-20">
            {step === 1 && (
                <>
                    <h2 className="text-2xl font-black uppercase italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-slate-400">
                        Guardando Progreso...
                    </h2>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                        No apagues la consola
                    </p>
                </>
            )}
            
            {step === 2 && (
                <>
                    <h2 className="text-2xl font-black uppercase italic tracking-wider text-slate-400">
                        Cerrando Conexión
                    </h2>
                    <p className="text-xs font-mono text-red-500/80 uppercase tracking-[0.2em]">
                        Desconectando del servidor...
                    </p>
                </>
            )}

             {step === 3 && (
                <>
                    <h2 className="text-2xl font-black uppercase italic tracking-wider text-white">
                        ¡Hasta pronto!
                    </h2>
                    <p className="text-xs font-mono text-emerald-500 uppercase tracking-[0.2em]">
                        Sesión finalizada correctamente
                    </p>
                </>
            )}
        </div>

        {/* BARRA DE CARGA DECORATIVA */}
        <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
                className="h-full bg-violet-600 transition-all duration-[1000ms] ease-out"
                style={{ width: step === 1 ? '40%' : step === 2 ? '80%' : '100%' }}
            ></div>
        </div>

      </div>

      <style jsx>{`
        .perspective-grid-container { perspective: 600px; }
        .grid-floor {
            position: absolute; top: 0; left: -50%; right: -50%; bottom: 0;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 40px 40px;
            transform-origin: 50% 0; transform: rotateX(60deg);
            animation: gridMove 20s linear infinite;
        }
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
      `}</style>
    </div>
  )
}