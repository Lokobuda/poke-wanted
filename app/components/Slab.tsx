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

    // --- 1. COLOR DE IDENTIDAD ---
    let companyColor = "#94a3b8" 
    if (g.includes('PSA')) companyColor = "#ff2a2a"
    else if (g.includes('BGS') || g.includes('BECKETT')) companyColor = "#fbbf24"
    else if (g.includes('CGC')) companyColor = "#0088ff"
    else if (g.includes('TAG')) companyColor = "#00fff2"

    const companyGlow = `rgba(${parseInt(companyColor.slice(1,3),16)}, ${parseInt(companyColor.slice(3,5),16)}, ${parseInt(companyColor.slice(5,7),16)}, 0.6)`

    // --- 2. EL ORO (AURA) ---
    const goldColor = "#ffd700" 
    const goldGlowTight = "rgba(255, 215, 0, 0.8)" 
    const goldGlowSoft = "rgba(255, 215, 0, 0.4)"

    const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`
    const imgUrl = s.image_url || s.custom_image_url
    const pokeName = s.pokemon_name || s.name || 'UNKNOWN'

    return (
        <div 
            onClick={onClick}
            className={`group relative w-full aspect-[3/4.2] rounded-[24px] cursor-pointer select-none transition-transform duration-500 hover:-translate-y-2 hover:scale-[1.02] ${className}`}
            style={{
                background: '#050505',
                boxShadow: isTen 
                    ? `0 0 25px -8px ${goldGlowTight}, 0 0 60px -20px ${goldGlowSoft}, 0 0 15px -5px ${companyColor}` 
                    : `0 20px 40px -10px rgba(0,0,0,0.9)`
            }}
        >
            {/* FONDO ANIMADO TRASERO */}
            <div className={`absolute inset-0 rounded-[24px] overflow-hidden transition-opacity duration-500 z-0 ${isTen ? 'opacity-50 group-hover:opacity-70' : 'opacity-30 group-hover:opacity-60'}`}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow"
                     style={{
                         background: `conic-gradient(from 0deg, transparent 0deg, ${companyColor} 20deg, transparent 90deg, ${companyColor} 180deg, transparent 270deg, ${companyColor} 340deg, transparent 360deg)`,
                         filter: 'blur(35px)'
                     }}
                />
            </div>

            {/* MARCO SÓLIDO CENTRAL */}
            <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[22px] z-10 flex flex-col overflow-hidden">
                <div className="absolute inset-0 border rounded-[22px] pointer-events-none z-50 transition-colors duration-500" 
                     style={{ borderColor: isTen ? `${goldColor}60` : 'rgba(255,255,255,0.08)' }}></div>
                
                {/* --- HEADER (ETIQUETA) --- */}
                {/* Ajustado: altura flexible con min-h para que en movil no se aplaste */}
                <div className="min-h-[60px] sm:h-[70px] w-full relative z-20 bg-gradient-to-b from-[#151515] to-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-2 sm:px-4 py-1">
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: noiseBg }}></div>
                    
                    {/* IZQUIERDA: Info de la Carta + CERTIFICADO */}
                    <div className="flex flex-col items-start justify-center max-w-[40%] z-10">
                        {/* Ajuste de Texto: xs en movil, sm en desktop, line-clamp para evitar desbordes */}
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 uppercase tracking-tight leading-tight line-clamp-2">{pokeName}</span>
                        <span className="text-[6px] sm:text-[7px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 truncate w-full">{s.set_name || 'UNK'}</span>
                        
                        {certNumber && (
                            <span className="text-[5px] sm:text-[6px] font-mono text-slate-400 mt-1 tracking-widest opacity-70">
                                #{certNumber}
                            </span>
                        )}
                    </div>

                    {/* CENTRO: Empresa */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-0">
                        {/* Reducido texto en movil */}
                        <span className="text-[16px] sm:text-[20px] font-black tracking-[0.1em] uppercase drop-shadow-xl" 
                              style={{ color: isTen ? 'white' : companyColor, textShadow: `0 0 15px ${companyGlow}` }}>
                            {graderRaw}
                        </span>
                        <div className="h-[2px] w-full mt-0.5 rounded-full opacity-80" style={{ background: companyColor }}></div>
                    </div>

                    {/* DERECHA: NOTA */}
                    <div className="relative flex items-center justify-center z-10">
                        {isTen && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce-subtle z-20">
                                <Crown size={12} fill="#ffd700" strokeWidth={0} />
                            </div>
                        )}
                        {/* Caja de nota: w-9 h-7 en movil | w-11 h-9 en PC */}
                        <div className={`flex items-center justify-center w-9 h-7 sm:w-11 sm:h-9 rounded-lg border backdrop-blur-md transition-all duration-500 ${isTen ? 'border-yellow-500/40' : 'border-white/10'}`}
                             style={{ background: isTen ? `linear-gradient(135deg, ${goldColor}20, rgba(0,0,0,0.8))` : 'rgba(0,0,0,0.4)', boxShadow: isTen ? `inset 0 0 15px ${goldGlowTight}` : `0 0 10px -2px ${companyGlow}` }}>
                            {/* Texto de nota: 18px en movil | 22px en PC */}
                            <span className="text-[18px] sm:text-[22px] font-black leading-none drop-shadow-lg" 
                                style={{ color: isTen ? goldColor : 'white', textShadow: isTen ? `0 2px 10px ${goldGlowTight}` : `0 0 10px ${companyColor}` }}>
                                {gradeVal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- POZO DE LA CARTA --- */}
                <div className="flex-1 relative w-full bg-[#030303] flex items-center justify-center p-2 sm:p-3 overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,1)]">
                    <div className={`absolute inset-0 transition-opacity duration-700 ${isTen ? 'opacity-40 group-hover:opacity-60' : 'opacity-20 group-hover:opacity-40'}`}
                        style={{ background: `radial-gradient(circle at center, ${companyColor}, transparent 70%)`, filter: 'blur(25px)' }}
                    />
                    {imgUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center z-20">
                            {/* Ajuste de margen para que la carta no toque los bordes del pozo en movil */}
                            <img src={imgUrl} className="h-[95%] w-auto object-contain transition-transform duration-500 group-hover:scale-105" alt={pokeName} />
                        </div>
                    ) : (<div className="opacity-10 text-white z-20"><Box size={40} /></div>)}
                    
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

            {/* --- EFECTO DE PARTÍCULAS (MANTENIDO) --- */}
            {isTen && (
                <div className="absolute -inset-10 z-[100] pointer-events-none overflow-visible">
                    <div className="absolute bottom-10 left-[10%] w-0.5 h-0.5 bg-yellow-300 rounded-full blur-[0.5px] animate-rise-1 shadow-[0_0_5px_#ffd700]"></div>
                    <div className="absolute bottom-4 left-[20%] w-[1px] h-[1px] bg-white rounded-full animate-rise-4 delay-75"></div>
                    <div className="absolute bottom-0 left-[30%] w-1 h-1 bg-amber-200 rounded-full blur-[0.5px] animate-rise-2 shadow-[0_0_6px_#ffd700]"></div>
                    <div className="absolute bottom-8 left-[35%] w-0.5 h-0.5 bg-yellow-100 rounded-full blur-[0.5px] animate-rise-5 delay-100"></div> 
                    <div className="absolute bottom-2 left-[50%] w-1 h-1 bg-yellow-400 rounded-full animate-rise-4 shadow-[0_0_8px_#ffffff]"></div>
                    <div className="absolute bottom-12 left-[45%] w-[1.5px] h-[1.5px] bg-amber-300 rounded-full blur-[0.5px] animate-rise-1 delay-200"></div> 
                    <div className="absolute bottom-6 left-[65%] w-[1px] h-[1px] bg-yellow-200 rounded-full blur-[0.5px] animate-rise-3"></div> 
                    <div className="absolute bottom-0 left-[70%] w-1 h-1 bg-amber-300 rounded-full blur-[0.5px] animate-rise-3 shadow-[0_0_6px_#ffd700]"></div>
                    <div className="absolute bottom-4 left-[85%] w-[1px] h-[1px] bg-amber-100 rounded-full animate-rise-2 delay-150"></div>
                    <div className="absolute bottom-10 left-[90%] w-0.5 h-0.5 bg-yellow-200 rounded-full blur-[0.5px] animate-rise-5"></div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes bounce-subtle { 0%, 100% { transform: translate(-50%, -8%); } 50% { transform: translate(-50%, 8%); } }
                @keyframes rise {
                    0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; }
                    50% { transform: translateY(-200px) translateX(10px) scale(1); }
                    100% { transform: translateY(-450px) translateX(-10px) scale(0); opacity: 0; }
                }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-bounce-subtle { animation: bounce-subtle 2.5s infinite ease-in-out; }
                .animate-rise-1 { animation: rise 2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                .animate-rise-2 { animation: rise 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.3s; }
                .animate-rise-3 { animation: rise 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.7s; }
                .animate-rise-4 { animation: rise 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.1s; }
                .animate-rise-5 { animation: rise 2.8s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.5s; }
            `}</style>
        </div>
    )
}