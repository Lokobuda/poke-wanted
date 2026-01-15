'use client'

import { Box, Crown } from 'lucide-react'

interface SlabProps {
  slab?: any
  onClick?: () => void
  className?: string
}

export default function Slab({ slab, onClick, className = '' }: SlabProps) {
    const s = slab || {}
    const graderRaw = s.grader || s.grading_company || 'RAW'
    const g = String(graderRaw).toUpperCase()
    const gradeVal = s.grade || '-'
    const certNumber = s.cert_number || '' 
    
    const isTen = String(gradeVal).includes('10') 

    // --- COLOR DE IDENTIDAD ---
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

    const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`
    const imgUrl = s.image_url || s.custom_image_url
    const pokeName = s.pokemon_name || s.name || 'UNKNOWN'

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
            {/* FONDO ANIMADO TRASERO */}
            <div className={`absolute inset-0 rounded-[20px] overflow-hidden transition-opacity duration-500 z-0 ${isTen ? 'opacity-50 group-hover:opacity-70' : 'opacity-30 group-hover:opacity-60'}`}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow"
                     style={{
                         background: `conic-gradient(from 0deg, transparent 0deg, ${companyColor} 20deg, transparent 90deg, ${companyColor} 180deg, transparent 270deg, ${companyColor} 340deg, transparent 360deg)`,
                         filter: 'blur(35px)'
                     }}
                />
            </div>

            {/* MARCO SÓLIDO CENTRAL */}
            <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[18px] z-10 flex flex-col overflow-hidden">
                <div className="absolute inset-0 border rounded-[18px] pointer-events-none z-50 transition-colors duration-500" 
                     style={{ borderColor: isTen ? `${goldColor}60` : 'rgba(255,255,255,0.08)' }}></div>
                
                {/* --- HEADER (ETIQUETA) REESTRUCTURADO --- */}
                <div className="h-[65px] md:h-[75px] w-full relative z-20 bg-gradient-to-b from-[#151515] to-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-2.5 py-2">
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: noiseBg }}></div>
                    
                    {/* IZQUIERDA: Info + Empresa (Apilados para ahorrar espacio) */}
                    <div className="flex flex-col items-start justify-center flex-1 min-w-0 pr-2 z-10">
                        {/* EMPRESA (Ahora arriba pequeño) */}
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1" style={{ color: companyColor }}>
                            {graderRaw}
                        </span>
                        
                        {/* NOMBRE POKEMON */}
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-200 uppercase tracking-tight leading-none truncate w-full">
                            {pokeName}
                        </span>
                        
                        {/* SET / CERT */}
                        <div className="flex items-center gap-1.5 mt-1 opacity-60">
                             <span className="text-[6px] md:text-[7px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[60px]">{s.set_name || 'UNK'}</span>
                             {certNumber && <span className="text-[5px] font-mono text-slate-500">#{certNumber}</span>}
                        </div>
                    </div>

                    {/* DERECHA: NOTA (Bloque Fijo) */}
                    <div className="relative flex items-center justify-center z-10 shrink-0">
                        {isTen && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce-subtle z-20">
                                <Crown size={9} fill="#ffd700" strokeWidth={0} />
                            </div>
                        )}
                        <div className={`flex items-center justify-center w-9 h-8 md:w-12 md:h-10 rounded-lg border backdrop-blur-md transition-all duration-500 ${isTen ? 'border-yellow-500/40' : 'border-white/10'}`}
                             style={{ background: isTen ? `linear-gradient(135deg, ${goldColor}20, rgba(0,0,0,0.8))` : 'rgba(0,0,0,0.4)', boxShadow: isTen ? `inset 0 0 15px ${goldGlowTight}` : `0 0 10px -2px ${companyGlow}` }}>
                            <span className="text-[18px] md:text-[24px] font-black leading-none drop-shadow-lg" 
                                style={{ color: isTen ? goldColor : 'white', textShadow: isTen ? `0 2px 10px ${goldGlowTight}` : `0 0 10px ${companyColor}` }}>
                                {gradeVal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- POZO DE LA CARTA --- */}
                <div className="flex-1 relative w-full bg-[#030303] flex items-center justify-center p-2 overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,1)]">
                    <div className={`absolute inset-0 transition-opacity duration-700 ${isTen ? 'opacity-40 group-hover:opacity-60' : 'opacity-20 group-hover:opacity-40'}`}
                        style={{ background: `radial-gradient(circle at center, ${companyColor}, transparent 70%)`, filter: 'blur(25px)' }}
                    />
                    {imgUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center z-20">
                            <img src={imgUrl} className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105" alt={pokeName} />
                        </div>
                    ) : (<div className="opacity-10 text-white z-20"><Box size={24} /></div>)}
                    
                    {/* BRILLO SUPERIOR */}
                    <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-color-dodge"
                            style={{
                                background: isTen 
                                    ? 'linear-gradient(115deg, transparent 20%, rgba(255,215,0,0.3) 30%, transparent 45%, transparent 55%, rgba(255,255,255,0.4) 65%, transparent 80%)' 
                                    : 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.3) 30%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 70%, transparent 80%)', 
                                backgroundSize: '200% 200%',
                            }}
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes bounce-subtle { 0%, 100% { transform: translate(-50%, -8%); } 50% { transform: translate(-50%, 8%); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-bounce-subtle { animation: bounce-subtle 2.5s infinite ease-in-out; }
            `}</style>
        </div>
    )
}