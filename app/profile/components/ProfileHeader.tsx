'use client'

import { useState, useEffect } from 'react'
import { Crown, Map, Store, Pencil, Star } from 'lucide-react'

// Estructura de datos del gimnasio
interface GymData {
  name: string
  logo_url?: string | null
}

interface ProfileHeaderProps {
  username?: string
  xp?: number
  nextLevelXp?: number
  // Añado 'PRO' para cubrir el caso de usuarios que pagan cuota sin gimnasio
  subscriptionType?: 'INDIE' | 'GYM' | 'PRO' 
  avatarUrl?: string | null
  rankTitle?: string 
  gymData?: GymData | null 
  onEditAvatar?: () => void 
}

export default function ProfileHeader({ 
  username = 'Coleccionista', 
  xp = 0, 
  nextLevelXp = 1000,
  subscriptionType = 'INDIE', 
  avatarUrl,
  rankTitle = 'Novato',
  gymData, 
  onEditAvatar 
}: ProfileHeaderProps) {

  const [imgError, setImgError] = useState(false)
  useEffect(() => { setImgError(false) }, [avatarUrl])

  const safeNextXp = nextLevelXp || 1
  const progress = Math.min((xp / safeNextXp) * 100, 100)

  // Lógica para determinar si es un usuario premium (Gym o Pro directo)
  const isPremium = subscriptionType === 'GYM' || subscriptionType === 'PRO'

  return (
    <div className="w-full flex items-center gap-5 md:gap-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* 1. AVATAR / BUDDY */}
      <button 
        onClick={onEditAvatar}
        className={`relative group shrink-0 cursor-pointer transition-transform active:scale-95 ${isPremium ? 'text-amber-500' : 'text-cyan-400'}`}
        title="Cambiar Compañero"
      >
        <div className="absolute -inset-1 bg-current blur opacity-30 group-hover:opacity-50 transition-opacity rounded-3xl"></div>
        
        <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-900 border-2 border-current/20 rounded-3xl flex items-center justify-center overflow-hidden relative z-10 shadow-2xl bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
           <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <Pencil className="text-white" size={28} />
           </div>

           {avatarUrl && !imgError ? (
             <img 
               src={avatarUrl} 
               alt="Buddy" 
               onError={() => setImgError(true)}
               className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-xl pixelated rendering-pixelated group-hover:scale-105 transition-transform duration-500"
               style={{ imageRendering: 'pixelated' }} 
             />
           ) : (
             <span className="text-5xl animate-bounce">🥚</span>
           )}
        </div>
        
        <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-white/10 p-1.5 rounded-xl text-current shadow-lg z-20">
            {subscriptionType === 'GYM' ? <Store size={16} /> : (isPremium ? <Star size={16} /> : <Map size={16} />)}
        </div>
      </button>

      {/* 2. DATOS DEL JUGADOR */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        
        {/* BLOQUE SUPERIOR: NOMBRE + ESTADO PRO */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-x-6 gap-y-2 mb-2">
            
            {/* NOMBRE DE USUARIO */}
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none truncate shrink-0 pr-2 pb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {username}
            </h1>

            {/* INFO DE USUARIO PRO (2 LÍNEAS) */}
            {isPremium && (
               <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700 pl-1 xl:pl-0 border-l-2 border-white/10 xl:border-l-0 xl:border-l-transparent">
                  
                  {/* LOGO (Solo si hay URL, si no mostramos icono) */}
                  {gymData?.logo_url ? (
                     <img 
                        src={gymData.logo_url} 
                        alt="Gym Logo" 
                        className="w-10 h-10 object-contain bg-slate-900/50 rounded-lg border border-white/10 shrink-0" 
                     />
                  ) : (
                     <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 shrink-0">
                        {subscriptionType === 'GYM' ? <Store size={20} className="text-amber-500" /> : <Crown size={20} className="text-amber-500" />}
                     </div>
                  )}

                  {/* TEXTO EN DOS LÍNEAS */}
                  <div className="flex flex-col justify-center leading-tight">
                      <span className="text-amber-500 font-black uppercase tracking-widest text-sm md:text-base whitespace-nowrap drop-shadow-sm">
                         USUARIO PRO
                      </span>
                      
                      {/* SEGUNDA LÍNEA DINÁMICA */}
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] md:text-[11px] whitespace-nowrap">
                         {subscriptionType === 'GYM' && gymData?.name 
                            ? `PATROCINADO POR ${gymData.name}` 
                            : 'CUENTA PREMIUM ACTIVA'}
                      </span>
                  </div>
               </div>
            )}
        </div>

        {/* ETIQUETAS DE NIVEL / RANGO */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-lg bg-violet-600/10 border border-violet-500/30 text-violet-300 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-violet-900/20 backdrop-blur-md">
                <Crown size={12} />
                {rankTitle}
            </div>
        </div>

        {/* BARRA DE XP */}
        <div className="w-full max-w-2xl">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                <span>XP: {xp}</span>
                <span>Siguiente: {nextLevelXp || 'MAX'}</span>
            </div>
            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                    className={`h-full relative overflow-hidden transition-all duration-1000 ${isPremium ? 'bg-amber-500' : 'bg-gradient-to-r from-violet-600 to-fuchsia-500'}`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] skew-x-12"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}