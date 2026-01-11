'use client'

import Link from 'next/link'
import { Play, Plus, Map, Gamepad2, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import AuthModal from './components/AuthModal'

export default function LandingPage() {
  const [glitch, setGlitch] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Efecto de glitch aleatorio para el título
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex flex-col items-center justify-center selection:bg-violet-500/30">
      
      {/* --- FONDO --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 z-0"
            style={{ backgroundImage: "url('/images/holo-map-bg.png')" }} 
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/90 z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] overflow-hidden perspective-grid-container opacity-40 z-20">
             <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000_100%)] z-30"></div>
             <div className="grid-floor animate-grid-move"></div>
        </div>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="relative z-30 flex flex-col items-center w-full max-w-4xl px-6">
        
        {/* TÍTULO GIGANTE */}
        <div className="mb-16 relative group cursor-default text-center">
            <h1 className={`text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_30px_rgba(139,92,246,0.8)] transition-transform duration-100 ${glitch ? 'translate-x-1 skew-x-12' : ''}`}>
                POKÉ <span className="text-violet-500">BINDERS</span>
            </h1>
            <div className="flex justify-center items-center gap-4 mt-4">
                <span className="h-px w-12 bg-white/50"></span>
                <span className="text-[10px] font-mono text-violet-300 tracking-[0.5em] uppercase blink-text shadow-black drop-shadow-md">System Ready</span>
                <span className="h-px w-12 bg-white/50"></span>
            </div>
        </div>

        {/* MENÚ DE JUEGO */}
        <div className="flex flex-col gap-6 w-full max-w-sm">
            
            {/* OPCIÓN 1: CONTINUAR -> Abre Login */}
            <div className="group relative cursor-pointer" onClick={() => setIsAuthOpen(true)}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl opacity-75 group-hover:opacity-100 blur transition duration-200 animate-pulse-slow"></div>
                <button className="relative w-full bg-slate-950/90 backdrop-blur-md hover:bg-slate-900 text-white py-6 px-8 rounded-xl flex items-center justify-between border border-white/10 group-hover:border-white/20 transition-all transform group-hover:-translate-y-1">
                    <div className="flex flex-col items-start">
                        <span className="text-xl font-black uppercase tracking-wider italic flex items-center gap-2 group-hover:text-violet-300 transition-colors">
                            <Play size={20} fill="currentColor" /> Continuar
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-400">ACCEDER A MI PERFIL</span>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-ping-slow"></div>
                </button>
            </div>

            {/* OPCIÓN 2: NUEVA PARTIDA -> Va a /new-game */}
            <Link href="/new-game" className="group">
                <button className="w-full bg-black/60 hover:bg-white/10 text-slate-400 hover:text-white py-5 px-8 rounded-xl flex items-center justify-between border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                    <div className="flex flex-col items-start">
                        <span className="text-lg font-bold uppercase tracking-wider flex items-center gap-3">
                            <Plus size={18} /> Nueva Partida
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-400">CREAR CUENTA NUEVA</span>
                    </div>
                </button>
            </Link>
        </div>

        {/* HUD FOOTER */}
        <div className="mt-24 w-full flex justify-between items-end text-[10px] font-mono text-slate-500/80 uppercase tracking-widest pointer-events-none select-none">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2"><Map size={12} /> region: kanto_01</div>
                <div className="flex items-center gap-2"><Zap size={12} /> connection: secure</div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div>v.2.0.4 [beta]</div>
                <div className="flex items-center gap-2">powered by <Gamepad2 size={12}/></div>
            </div>
        </div>
      </div>

      {/* MODAL DE LOGIN (Solo Login por defecto) */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        defaultView="login" 
      />

      <style jsx>{`
        .perspective-grid-container { perspective: 600px; }
        .grid-floor {
            position: absolute; top: 0; left: -50%; right: -50%; bottom: 0;
            background-image: 
                linear-gradient(to right, rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(139, 92, 246, 0.3) 1px, transparent 1px);
            background-size: 60px 60px;
            transform-origin: 50% 0; transform: rotateX(60deg);
            animation: gridMove 20s linear infinite;
            mask-image: linear-gradient(to bottom, transparent 0%, black 50%, black 100%);
        }
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
        .blink-text { animation: blink 2s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-ping-slow { animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  )
}