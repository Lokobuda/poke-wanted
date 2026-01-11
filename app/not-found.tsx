'use client'

import Link from 'next/link'
import { Ghost, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      
      {/* FONDO EFECTO 'GLITCH' */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/40 via-slate-950 to-slate-950 animate-pulse"></div>
      
      <div className="relative z-10 max-w-lg">
        {/* ICONO ANIMADO */}
        <div className="relative w-32 h-32 mx-auto mb-8 group">
            <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full animate-ping"></div>
            <Ghost size={128} className="text-slate-700 relative z-10 animate-bounce" strokeWidth={1.5} />
            <div className="absolute top-0 right-0 text-4xl animate-bounce delay-100">?</div>
        </div>

        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 mb-2 tracking-tighter">
            404
        </h1>
        
        <h2 className="text-2xl font-bold text-white mb-4">
            ¡Un Pokémon salvaje ha robado esta página!
        </h2>
        
        <p className="text-slate-400 mb-10 text-lg leading-relaxed">
            Parece que te has adentrado demasiado en la hierba alta. La ruta que buscas no existe o ha huido antes de que pudieras capturarla.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
                href="/profile" 
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
                <ArrowLeft size={20} /> Volver al Perfil
            </Link>
            
            <Link 
                href="/" 
                className="px-8 py-4 bg-slate-800 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 border border-white/10"
            >
                <Home size={20} /> Inicio
            </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-xs font-mono uppercase tracking-widest">
          ERROR_CODE: MISSING_NO
      </div>
    </div>
  )
}