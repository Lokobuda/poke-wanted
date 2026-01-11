'use client'

import { useState } from 'react'
import { Image as ImageIcon, X, Maximize2 } from 'lucide-react'

interface PokemonCardProps {
  card: any
  onToggleStatus: (card: any, variant?: 'normal' | 'reverse' | 'holo') => void
  onSetCover?: (card: any) => void
  onDelete?: (card: any) => void
  onInspect?: (card: any) => void 
  isCover?: boolean
  isEditing?: boolean
  isMasterSet?: boolean
  setTotal?: number
}

export default function PokemonCard({ 
  card, 
  onToggleStatus, 
  onSetCover, 
  onDelete,
  onInspect,
  isCover, 
  isEditing,
  isMasterSet
}: PokemonCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Extracción de datos robusta
  const variantData = Array.isArray(card.card_variants) ? card.card_variants[0] : card.card_variants || {}
  const cardData = variantData?.cards || {}
  
  // --- AQUÍ ESTÁ LA MAGIA: LEEMOS LA CONFIGURACIÓN DE LA BBDD ---
  // Si no existe (sets nuevos sin procesar), asumimos valores por defecto seguros (Moderno).
  const uiConfig = cardData.ui_config || { show_reverse: true, badge: null }

  const imageUrl = variantData.image_url || '/placeholder-card.png'
  const cardName = (cardData.name || '').trim()

  const hasNormal = card.acquired_normal
  const hasReverse = card.acquired_reverse
  const hasHolo = card.acquired_holo
  
  // Lógica de "Zombie": La carta está activa si tienes alguna cantidad REAL.
  // Pero ignoramos la cantidad "Reverse" si el set prohíbe reverse (limpieza visual de Chansey).
  const countReverse = uiConfig.show_reverse ? (card.quantity_reverse || 0) : 0
  const totalEffective = (card.quantity_normal || 0) + (card.quantity_holo || 0) + countReverse
  const isActive = totalEffective > 0

  // --- BADGES Y COLORES (Estética intacta) ---
  const badgeLabel = uiConfig.badge
  
  const getLabelColor = (label: string | null) => {
      if (!label) return 'bg-yellow-900/90 text-yellow-300 border-yellow-500/30' // Holo standard
      if (['SAR', 'HR', 'SEC'].includes(label)) return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400/50'
      if (['UR', 'EX', 'ex', 'GX', 'VMAX', 'VSTAR', 'ACE', 'FA', 'M', 'V', 'LV.X'].includes(label)) return 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white border-yellow-400/50'
      if (['AR', '✨'].includes(label)) return 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white border-teal-400/50'
      return 'bg-yellow-900/90 text-yellow-300 border-yellow-500/30'
  }

  // --- RENDERIZADO DE BOTONES/BADGES ---
  const showReverseBadge = uiConfig.show_reverse
  const showHoloBadge = !!badgeLabel || (variantData.rarity && variantData.rarity.toLowerCase().includes('holo'))

  const renderBadges = () => {
    if (!isMasterSet || !isActive) return null
    const holoColorClasses = getLabelColor(badgeLabel || 'H')

    return (
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20 pointer-events-none">
        {/* Normal */}
        {hasNormal && <span className="bg-slate-900/90 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">N</span>}
        
        {/* Reverse: Solo si la BBDD dice que se puede */}
        {hasReverse && showReverseBadge && <span className="bg-cyan-900/90 text-cyan-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-500/30 backdrop-blur-md">R</span>}
        
        {/* Holo / Especial */}
        {hasHolo && showHoloBadge && <span className={`${holoColorClasses} text-[9px] font-black px-2 py-0.5 rounded-full border backdrop-blur-md shadow-lg`}>{badgeLabel || 'H'}</span>}
      </div>
    )
  }

  // --- MANEJO DE CLIC ---
  const handleMainClick = () => {
    if (isEditing) return
    // Si la carta es especial (tiene Badge), el click principal es Holo. Si no, Normal.
    if (badgeLabel) onToggleStatus(card, 'holo')
    else onToggleStatus(card, 'normal')
  }

  // Lógica de visualización de botones inferiores
  // Si tienes la carta marcada (incluso por error), mostramos el botón para poder quitarla.
  const showBtnNormal = !badgeLabel || hasNormal // Mostrar normal si no es especial O si ya la tienes
  const showBtnReverse = showReverseBadge // Solo si la BBDD lo permite
  const showBtnHolo = badgeLabel || (variantData.rarity && variantData.rarity.toLowerCase().includes('holo'))

  return (
    <div 
      className={`relative group transition-all duration-300 ${isHovered && !isEditing ? 'scale-105 z-20' : 'z-0'} ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMainClick}
    >
      <div className={`relative aspect-[0.716] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isActive && !isEditing ? 'grayscale-0 ring-4 ring-green-500 shadow-green-900/40' : 'grayscale opacity-50 hover:opacity-100'} ${isEditing ? 'ring-2 ring-dashed ring-slate-500 opacity-80' : ''}`}>
        <img src={imageUrl} alt={cardName} className="w-full h-full object-cover" loading="lazy" />
        {!isEditing && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
        {renderBadges()}
        {!isEditing && onInspect && <button onClick={(e) => { e.stopPropagation(); onInspect(card) }} className={`absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-sm z-30 transition-all duration-200 border border-white/10 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} title="Ver detalles"><Maximize2 size={14} /></button>}
      </div>

      {isMasterSet && isActive && !isEditing && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-full shadow-xl p-1 flex gap-1">
            {showBtnNormal && (<button onClick={() => onToggleStatus(card, 'normal')} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-colors ${hasNormal ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Normal</button>)}
            {showBtnReverse && (<button onClick={() => onToggleStatus(card, 'reverse')} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-colors ${hasReverse ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50' : 'text-slate-500 hover:text-cyan-400 hover:bg-white/5'}`}>Reverse</button>)}
            {showBtnHolo && (<button onClick={() => onToggleStatus(card, 'holo')} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-colors ${hasHolo ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/50' : 'text-slate-500 hover:text-yellow-400 hover:bg-white/5'}`}>{badgeLabel || 'Holo'}</button>)}
          </div>
        </div>
      )}
      {isEditing && onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(card) }} className="absolute -top-3 -right-3 z-30 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 hover:scale-110 transition-all"><X size={16} strokeWidth={3} /></button>}
      {isCover && !isEditing && !isHovered && <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg z-20"><ImageIcon size={12} strokeWidth={3} /></div>}
    </div>
  )
}