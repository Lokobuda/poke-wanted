'use client'

import { Box, Crown, Trash2 } from 'lucide-react'

interface SlabProps {
  slab?: any
  onClick?: () => void
  onDelete?: (e: any) => void
  className?: string
  showDelete?: boolean
}

export default function Slab({ slab, onClick, onDelete, className = '', showDelete = false }: SlabProps) {
    const s = slab || {}
    const graderRaw = s.grader || s.grading_company || 'RAW'
    const g = String(graderRaw).toUpperCase()
    const gradeVal = s.grade || '-'
    const certNumber = s.cert_number || '' 
    
    const isTen = String(gradeVal).includes('10') 

    // --- COLORES ---
    let companyColor = "#94a3b8" 
    if (g.includes('PSA')) companyColor = "#ff2a2a"
    else if (g.includes('BGS') || g.includes('BECKETT')) companyColor = "#fbbf24"
    else if (g.includes('CGC')) companyColor = "#0088ff"
    else if (g.includes('TAG')) companyColor = "#00fff2"

    const companyGlow = `rgba(${parseInt(companyColor.slice(1,3),16)}, ${parseInt(companyColor.slice(3,5),16)}, ${parseInt(companyColor.slice(5,7),16)}, 0.6)`

    // --- ORO (AURA) ---
    const goldColor = "#ffd700" 
    const goldGlowTight = "rgba(255, 215, 0, 0.8)" 
    const goldGlowSoft = "rgba(255, 215, 0, 0.4)"

    const imgUrl = s.image_url || s.custom_image_url
    const pokeName = s.pokemon_name || s.name || 'UNKNOWN'

    // --- ESTILOS COMPLEJOS EXTRAÍDOS (PARA EVITAR ERROR DE SINTAXIS) ---
    const gradeBoxStyle = {
        background: isTen 
            ? `linear-gradient(135deg, ${goldColor}20, rgba(0,0,0,0.8))` 
            : 'rgba(0,0,0,0.4)',
        boxShadow: isTen 
            ? `inset 0 0 15px ${goldGlowTight}` 
            : `0 0 10px -2px ${companyGlow}`
    }

    const gradeTextStyle = {
        color: isTen ? goldColor : 'white',
        textShadow: isTen 
            ? `0 2px 10px ${goldGlowTight}` 
            : `0 0 10px ${companyColor}`
    }

    return (
        <div 
            onClick={onClick}
            className={`group relative w-full aspect-[3/4.2] rounded-[20px] md:rounded-[24px] cursor-pointer select-none transition-transform duration-500 hover:-translate-y-2 hover:scale-[1.02] ${className}`}
            style={{
                background: '#050505',
                boxShadow: isTen 
                    ? `0 0 15px -5px ${goldGlowTight}, 0 0 40px -10px ${goldGlowSoft}, 0 0 10px -5px ${companyColor}` 
                    : `0 20px 40px -10px rgba(0,0,0,0.9)`
            }}
        >
            {/* FONDO ANIMADO */}
            <div className={`absolute inset-0 rounded-[20px] overflow-hidden transition-opacity duration-500 z-0 ${isTen ? 'opacity-50 group-hover:opacity-70' : 'opacity-30 group-hover:opacity-60'}`}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow"
                     style={{
                         background: `conic-gradient(from 0deg, transparent 0deg, ${companyColor} 20deg, transparent 90deg, ${companyColor} 180deg, transparent 270deg, ${companyColor} 340deg, transparent 360deg)`,
                         filter: 'blur(35px)'
                     }}
                />
            </div>

            {/* MARCO CENTRAL */}
            <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[18px] z-10 flex flex-col overflow-hidden isolate">
                
                {/* --- EFECTO BURBUJAS / FOIL --- */}
                {isTen && (
                    <div className="absolute inset-0 z-20 pointer-events-none opacity-50 mix-blend-overlay"
                         style={{ 
                             backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px), radial-gradient(#ffffff 1px, transparent 1px)`,
                             backgroundSize: '24px 24px, 16px 16px',
                             backgroundPosition: '0 0, 12px 12px',
                             maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)'
                         }} 
                    />
                )}

                <div className="absolute inset-0 border rounded-[18px] pointer-events-none z-50 transition-colors duration-500" 
                     style={{ borderColor: isTen ? `${goldColor}60` : 'rgba(255,255,255,0.08)' }}></div>
                
                {/* --- HEADER --- */}
                <div className="h-[72px] w-full relative z-30 bg-gradient-to-b from-[#151515] to-[#0a0a0a] border-b border-white/5 flex flex-row items-center justify-between px-3 py-2 gap-2">
                    
                    {/* IZQUIERDA: Textos */}
                    <div className="flex flex-col justify-center items-start flex-1 min-w-0 h-full">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1" style={{ color: companyColor }}>
                            {graderRaw}
                        </span>
                        
                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-tight leading-tight truncate w-full">
                            {pokeName}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-0.5 opacity-60 w-full overflow-hidden">
                             <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase truncate shrink-0">{s.set_name || 'UNK'}</span>
                             {certNumber && (
                                <span className="text-[7px] font-mono text-slate-500 truncate border-l border-white/20 pl-1.5">
                                    #{certNumber}
                                </span>
                             )}
                        </div>
                    </div>

                    {/* DERECHA: NOTA (USANDO EL ESTILO EXTRAÍDO) */}
                    <div className="relative flex items-center justify-center shrink-0 w-10 h-10">
                        {isTen && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce-subtle z-20">
                                <Crown size={12} fill="#ffd700" strokeWidth={0} />
                            </div>
                        )}
                        <div 
                            className={`flex items-center justify-center w-full h-full rounded-lg border backdrop-blur-md transition-all duration-500 ${isTen ? 'border-yellow-500/40' : 'border-white/10'}`}
                            style={gradeBoxStyle}
                        >
                            <span className="text-[22px] font-black leading-none drop-shadow-lg" style={gradeTextStyle}>
                                {gradeVal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- IMAGEN --- */}
                <div className="flex-1 relative w-full bg-[#030303] flex items-center justify-center p-2 overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,1)]">
                    <div className={`absolute inset-0 transition-opacity duration-700 ${isTen ? 'opacity-40 group-hover:opacity-60' : 'opacity-20 group-hover:opacity-40'}`}
                        style={{ background: `radial-gradient(circle at center, ${companyColor}, transparent 70%)`, filter: 'blur(25px)' }}
                    />
                    {imgUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center z-20">
                            <img src={imgUrl} className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105" alt={pokeName} />
                        </div>
                    ) : (<div className="opacity-10 text-white z-20"><Box size={24} /></div>)}
                </div>
            </div>

            {/* --- BOTÓN PAPELERA SUTIL --- */}
            {showDelete && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(e);
                    }}
                    className="absolute -top-2 -right-2 z-[60] w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-white/10 text-slate-600 shadow-xl opacity-100 hover:text-white hover:bg-red-500 hover:border-red-500 active:bg-red-500 active:text-white active:scale-95 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <style jsx>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes bounce-subtle { 0%, 100% { transform: translate(-50%, -8%); } 50% { transform: translate(-50%, 8%); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-bounce-subtle { animation: bounce-subtle 2.5s infinite ease-in-out; }
            `}</style>
        </div>
    )
}