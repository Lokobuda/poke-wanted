'use client'

import { useState, useEffect } from 'react'
import { Crown, Map, Store, Pencil, Star } from 'lucide-react'

interface GymData {
  name: string
  logo_url?: string | null
}

interface ProfileHeaderProps {
  username?: string
  xp?: number
  nextLevelXp?: number
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
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)

  useEffect(() => { 
      setCurrentAvatar(avatarUrl)
      setImgError(false) 
  }, [avatarUrl])

  const safeNextXp = nextLevelXp || 1
  const progress = Math.min((xp / safeNextXp) * 100, 100)
  const isPremium = subscriptionType === 'GYM' || subscriptionType === 'PRO'

  return (
    <div className="w-full flex flex-row items-center gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* 1. AVATAR / BUDDY */}
      <button 
        onClick={onEditAvatar}
        className={`relative group shrink-0 cursor-pointer transition-transform active:scale-95 ${isPremium ? 'text-amber-500' : 'text-cyan-400'}`}
        title="Cambiar Compañero"
      >
        <div className="absolute -inset-1 bg-current blur opacity-30 group-hover:opacity-50 transition-opacity rounded-3xl"></div>
        
        {/* Tamaño forzado para móvil: w-20 h-20 */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-slate-900 border-2 border-current/20 rounded-3xl flex items-center justify-center overflow-hidden relative z-10 shadow-2xl bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
           
           <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <Pencil className="text-white" size={24} />
           </div>

           {/* LÓGICA SIMPLIFICADA: Intenta mostrar imagen. Si falla, muestra huevo. */}
           {currentAvatar && !imgError ? (
               <img 
                   src={currentAvatar} 
                   alt="Buddy" 
                   onError={() => setImgError(true)}
                   className="w-full h-full object-contain p-2 drop-shadow-xl pixelated rendering-pixelated group-hover:scale-110 transition-transform duration-500"
                   style={{ imageRendering: 'pixelated' }} 
               />
           ) : (
             <div className="flex flex-col items-center justify-center animate-bounce-slow w-full h-full">
                <span className="text-3xl sm:text-5xl filter drop-shadow-lg leading-none">🥚</span>
             </div>
           )}
        </div>
        
        <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-white/10 p-1.5 rounded-xl text-current shadow-lg z-20">
            {subscriptionType === 'GYM' ? <Store size={14} className="sm:w-4 sm:h-4" /> : (isPremium ? <Star size={14} className="sm:w-4 sm:h-4" /> : <Map size={14} className="sm:w-4 sm:h-4" />)}
        </div>
      </button>

      {/* 2. DATOS DEL JUGADOR */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-y-1 gap-x-4 mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none truncate pr-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {username}
            </h1>
            {isPremium && (
               <div className="flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-left-4 duration-700 lg:pl-4 lg:border-l-2 lg:border-white/10 mt-1 lg:mt-0">
                  {gymData?.logo_url ? (
                     <img src={gymData.logo_url} alt="Gym" className="w-8 h-8 object-contain bg-slate-900/50 rounded-lg border border-white/10 shrink-0" />
                  ) : (
                     <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 shrink-0">
                        {subscriptionType === 'GYM' ? <Store size={14} className="text-amber-500" /> : <Crown size={14} className="text-amber-500" />}
                     </div>
                  )}
                  <div className="flex flex-col justify-center leading-tight min-w-0">
                      <span className="text-amber-500 font-black uppercase tracking-widest text-[10px] sm:text-xs whitespace-nowrap drop-shadow-sm">PRO</span>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px] truncate block max-w-[150px]">
                         {subscriptionType === 'GYM' && gymData?.name ? gymData.name : 'PREMIUM'}
                      </span>
                  </div>
               </div>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <div className="px-2 sm:px-3 py-1 rounded-lg bg-violet-600/10 border border-violet-500/30 text-violet-300 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow-lg shadow-violet-900/20 backdrop-blur-md">
                <Crown size={12} /> {rankTitle}
            </div>
        </div>

        <div className="w-full max-w-xl">
            <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                <span>XP: {xp}</span>
                <span>/ {nextLevelXp || 'MAX'}</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className={`h-full relative overflow-hidden transition-all duration-1000 ${isPremium ? 'bg-amber-500' : 'bg-gradient-to-r from-violet-600 to-fuchsia-500'}`} style={{ width: `${progress}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] skew-x-12"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}