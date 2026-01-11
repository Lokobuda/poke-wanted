'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation' 
import { supabase } from '../../../lib/supabase' 
import PokemonCard from '../../components/PokemonCard' 
import CardInspector from '../../components/CardInspector' 
import { ArrowLeft, Loader2, Trophy, Pencil, Check, Plus, Grid, Layers, Zap, X, ChartNoAxesCombined } from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

// Helpers globales
const triggerConfetti = () => {
    const end = Date.now() + 3000
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#a78bfa', '#ec4899', '#fbbf24'] })
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#a78bfa', '#ec4899', '#fbbf24'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
}

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info' | 'party', onClose: () => void }) => {
    useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer) }, [])
    const bg = type === 'party' ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-white/20' : type === 'success' ? 'bg-green-600' : 'bg-slate-800 border border-white/10'
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl shadow-black/50 text-white font-bold animate-in slide-in-from-bottom-5 fade-in duration-300 ${bg}`}>
            {type === 'party' && <Trophy size={24} className="animate-bounce text-yellow-200" />}
            {type === 'success' && <Check size={18} />}
            {type === 'info' && <ChartNoAxesCombined size={18} className="text-violet-300" />}
            <span className="text-sm md:text-base">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14}/></button>
        </div>
    )
}

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [cards, setCards] = useState<any[]>([])
  const [album, setAlbum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [setTotal, setSetTotal] = useState(0)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'party' } | null>(null)

  useEffect(() => { if (id) fetchAlbumDetails(id) }, [id])

  const getVariantData = (card: any) => {
    if (!card) return null;
    const v = card.card_variants;
    return Array.isArray(v) ? v[0] : v;
  }

  const getCoverId = (card: any) => {
      if (!card) return null;
      return getVariantData(card)?.id || card.id;
  }

  // --- CÁLCULO DE PROGRESO (Basado en la BBDD) ---
  const getStatsForCards = (currentCards: any[]) => {
    if (!album || currentCards.length === 0) return { percent: 0, acquired: 0, total: 0 }
    let totalSlots = 0, acquiredSlots = 0

    currentCards.forEach(card => {
        // Extraer configuración de la BBDD
        const variantData = Array.isArray(card.card_variants) ? card.card_variants[0] : card.card_variants
        const uiConfig = variantData?.cards?.ui_config || { show_reverse: true, badge: null }
        
        if (!album.is_master_set) {
            // Modo Set Simple: 1 carta = 1 slot
            totalSlots++
            if (card.acquired) acquiredSlots++
        } else {
            // Modo Master: Depende de la configuración
            const hasBadge = !!uiConfig.badge
            
            // Slot Normal: Si NO es especial (badge), contamos normal
            if (!hasBadge) {
                totalSlots++; 
                if (card.acquired_normal) acquiredSlots++
            }

            // Slot Holo: Si es especial O si es holo, cuenta
            const isHoloRarity = variantData?.rarity?.toLowerCase().includes('holo')
            if (hasBadge || isHoloRarity) {
                totalSlots++;
                if (card.acquired_holo) acquiredSlots++
            }

            // Slot Reverse: Solo si la BBDD dice que existe
            if (uiConfig.show_reverse) {
                totalSlots++;
                if (card.acquired_reverse) acquiredSlots++
            }
        }
    })
    const percent = totalSlots > 0 ? (acquiredSlots / totalSlots) * 100 : 0
    return { percent, acquired: acquiredSlots, total: totalSlots }
  }

  const fetchAlbumDetails = async (albumId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: albumData, error: albumError } = await supabase.from('albums').select('*').eq('id', albumId).single()
      if (albumError) throw albumError
      setAlbum(albumData)

      if (albumData.set_id) {
          const { data: setInfo } = await supabase.from('sets').select('printed_total').eq('id', albumData.set_id).single()
          if (setInfo) setSetTotal(setInfo.printed_total)
      }

      // IMPORTANTE: Pedimos ui_config en la consulta
      const { data: cardsData, error: cardsError } = await supabase.from('album_cards')
        .select(`*, card_variants (*, cards (*, ui_config))`)
        .eq('album_id', albumId)
      
      if (cardsError) throw cardsError
      
      const rawSyncIds = cardsData.map((c: any) => c.card_id || getVariantData(c)?.card_id).filter(Boolean)
      const { data: inventoryData } = await supabase.from('inventory').select('*').eq('user_id', session.user.id).in('card_id', rawSyncIds)

      const invMap = new Map()
      inventoryData?.forEach((item: any) => { if(item.card_id) invMap.set(String(item.card_id).trim().toLowerCase(), item) })

      let finalCards = cardsData.map((c: any) => {
          const rawId = c.card_id || getVariantData(c)?.card_id
          const syncId = rawId ? String(rawId).trim().toLowerCase() : null
          const invItem = syncId ? invMap.get(syncId) : null
          
          if (invItem) {
              const qN = Number(invItem.quantity_normal || 0); const qH = Number(invItem.quantity_holo || 0); const qR = Number(invItem.quantity_reverse || 0)
              const totalQ = qN + qH + qR
              return { ...c, acquired: totalQ > 0, acquired_normal: qN > 0, acquired_holo: qH > 0, acquired_reverse: qR > 0, quantity_normal: qN, quantity_holo: qH, quantity_reverse: qR, quantity_total: totalQ }
          } 
          return c
      })

      finalCards.sort((a, b) => {
        const getNum = (item: any) => { const v = getVariantData(item); if (!v || !v.card_id) return 999999; return parseFloat(v.card_id.split('-').pop().replace(/[^0-9.]/g, '')) || 0 }
        return getNum(a) - getNum(b)
      })

      setCards(finalCards)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const toggleAlbumMode = async (mode: 'SET' | 'MASTER') => {
    const isMaster = mode === 'MASTER'
    setAlbum({ ...album, is_master_set: isMaster })
    await supabase.from('albums').update({ is_master_set: isMaster }).eq('id', album.id)
    router.refresh()
    setToast({ msg: `Modo cambiado a ${mode}`, type: 'info' })
  }

  const checkCrossAlbumCompletion = async (cardIdToCheck: string, userId: string, isCurrentComplete: boolean) => {
      const { data: relatedAlbums } = await supabase.from('album_cards').select('album_id, albums!inner(id, name, is_master_set)').eq('card_id', cardIdToCheck).neq('album_id', album.id) 
      if (!relatedAlbums || relatedAlbums.length === 0) return
      const uniqueAlbums = new Map(); relatedAlbums.forEach((item: any) => uniqueAlbums.set(item.album_id, item.albums))

      for (const targetAlbum of Array.from(uniqueAlbums.values()) as any[]) {
          // Lógica simplificada de chequeo cruzado
          setToast({ msg: `Progreso actualizado en "${targetAlbum.name}"`, type: 'info' })
      }
  }

  const toggleCardStatus = async (card: any, variant: 'normal' | 'reverse' | 'holo' = 'normal') => {
    if (isEditing) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let updates: any = {}
    
    if (album.is_master_set) {
        const targetKey = variant === 'normal' ? 'acquired_normal' : variant === 'holo' ? 'acquired_holo' : 'acquired_reverse'
        const quantityKey = variant === 'normal' ? 'quantity_normal' : variant === 'holo' ? 'quantity_holo' : 'quantity_reverse'
        const newState = !card[targetKey] 
        updates[targetKey] = newState
        updates[quantityKey] = newState ? 1 : 0 
        
        const qN = variant === 'normal' ? (newState ? 1 : 0) : (card.quantity_normal || 0)
        const qH = variant === 'holo' ? (newState ? 1 : 0) : (card.quantity_holo || 0)
        const qR = variant === 'reverse' ? (newState ? 1 : 0) : (card.quantity_reverse || 0)
        updates.quantity_total = qN + qH + qR
        updates.acquired = updates.quantity_total > 0
    } else {
        const currentTotal = card.quantity_total || (card.acquired ? 1 : 0)
        const isAdding = currentTotal === 0 
        
        // Obtenemos config para saber qué activar por defecto
        const variantData = getVariantData(card)
        const uiConfig = variantData?.cards?.ui_config || { show_reverse: true, badge: null }
        
        if (!isAdding) {
            updates = { acquired: false, acquired_normal: false, acquired_holo: false, acquired_reverse: false, quantity_normal: 0, quantity_holo: 0, quantity_reverse: 0, quantity_total: 0 }
        } else {
            if (uiConfig.badge) { // Es especial (EX, M, etc) -> Holo
                updates = { acquired: true, acquired_normal: false, acquired_holo: true, acquired_reverse: false, quantity_normal: 0, quantity_holo: 1, quantity_reverse: 0, quantity_total: 1 }
            } else { // Normal
                updates = { acquired: true, acquired_normal: true, acquired_holo: false, acquired_reverse: false, quantity_normal: 1, quantity_holo: 0, quantity_reverse: 0, quantity_total: 1 }
            }
        }
    }

    const newCards = cards.map(c => c.id === card.id ? { ...c, ...updates } : c)
    setCards(newCards)
    
    const { percent: newPercent } = getStatsForCards(newCards)
    const { percent: oldPercent } = getStatsForCards(cards)

    const isCurrentComplete = newPercent >= 100
    if (isCurrentComplete && oldPercent < 100) { 
        triggerConfetti() 
        setToast({ msg: '¡ÁLBUM ACTUAL COMPLETADO!', type: 'party' }) 
    }

    const rawIdToWrite = card.card_id || getVariantData(card)?.card_id;
    const finalState = { ...card, ...updates }
    
    if (rawIdToWrite) {
        await supabase.from('inventory').upsert({ user_id: session.user.id, card_id: rawIdToWrite, quantity_normal: finalState.quantity_normal, quantity_holo: finalState.quantity_holo, quantity_reverse: finalState.quantity_reverse, updated_at: new Date().toISOString() }, { onConflict: 'user_id, card_id' })
        if (updates.quantity_total > 0) checkCrossAlbumCompletion(rawIdToWrite, session.user.id, isCurrentComplete)
    } 
    
    const dbUpdates: any = { acquired: updates.acquired }
    if (typeof updates.acquired_normal !== 'undefined') dbUpdates.acquired_normal = updates.acquired_normal
    if (typeof updates.acquired_holo !== 'undefined') dbUpdates.acquired_holo = updates.acquired_holo
    if (typeof updates.acquired_reverse !== 'undefined') dbUpdates.acquired_reverse = updates.acquired_reverse
    await supabase.from('album_cards').update(dbUpdates).eq('id', card.id)
    router.refresh()
  }

  const deleteCard = async (cardToDelete: any) => {
    if (!window.confirm("¿Eliminar carta?")) return
    setCards(prev => prev.filter(c => c.id !== cardToDelete.id))
    await supabase.from('album_cards').delete().eq('id', cardToDelete.id)
    router.refresh()
  }

  const setCoverImage = async (card: any) => {
    const coverId = getCoverId(card); if (!coverId) return 
    setAlbum((prev: any) => ({ ...prev, cover_card_id: coverId }))
    await supabase.from('albums').update({ cover_card_id: coverId }).eq('id', album.id)
    setToast({ msg: 'Portada actualizada', type: 'success' })
    router.refresh()
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" size={40} /></div>
  if (!album) return null

  const { percent: percentage, acquired: acquiredCountDisplay, total: totalCountDisplay } = getStatsForCards(cards)
  const displayPercent = Math.round(percentage)
  const barGradient = album.is_master_set ? 'from-amber-500 via-yellow-500 to-orange-500 shadow-[0_0_20px_#f59e0b]' : 'from-violet-600 via-fuchsia-500 to-violet-600'

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-20 font-sans">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <CardInspector card={selectedCard} isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} onSetCover={setCoverImage} isCover={album.cover_card_id === getCoverId(selectedCard)}/>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-slate-900/90 border-b border-white/5 shadow-2xl transition-all">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
               {/* AQUÍ ESTÁ EL CAMBIO: Apunta a /profile en vez de / */}
               <Link href="/profile"><button className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button></Link>
               <div><div className="flex items-center gap-2 mb-1"><div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/10"><button onClick={() => toggleAlbumMode('SET')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black tracking-wider transition-all ${!album.is_master_set ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><Grid size={10} /> SET</button><button onClick={() => toggleAlbumMode('MASTER')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black tracking-wider transition-all ${album.is_master_set ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><Layers size={10} /> MASTER</button></div></div><h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-none drop-shadow-lg">{album.name}</h1></div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-lg ${isEditing ? 'bg-white text-black hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>{isEditing ? <Check size={14} /> : <Pencil size={14} />} {isEditing ? 'LISTO' : 'EDITAR'}</button>
              {!isEditing && <div className="flex items-center gap-3 text-right bg-black/40 px-4 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">{displayPercent >= 100 ? <Trophy size={24} className="text-yellow-400 animate-bounce" /> : <Zap size={20} className="text-slate-600" />}<div><div className={`text-xl font-black leading-none ${displayPercent >= 100 ? 'text-green-400' : 'text-white'}`}>{displayPercent}%</div><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider opacity-60">{acquiredCountDisplay}/{totalCountDisplay} Puntos</div></div></div>}
            </div>
          </div>
          <div className="h-3 w-full relative bg-slate-800/50 rounded-full overflow-hidden border border-white/5"><div className={`h-full transition-all duration-1000 ease-out relative bg-gradient-to-r ${barGradient}`} style={{ width: `${displayPercent}%` }}><div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" /></div></div>
          {isEditing && <div className="w-full animate-in fade-in slide-in-from-top-2"><Link href={`/search?albumId=${album.id}`} className="block"><button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-violet-900/20 active:scale-[0.99] transition-all"><Plus size={18} strokeWidth={3} /> AÑADIR CARTAS NUEVAS</button></Link></div>}
        </div>
      </div>
      <div className="relative z-10 px-6 py-8 max-w-[1600px] mx-auto">
        {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4"><div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-white/5"><Grid size={32} /></div><p>Este álbum está vacío.</p></div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {cards.map((card) => <PokemonCard key={card.id} card={card} onToggleStatus={toggleCardStatus} onSetCover={setCoverImage} onDelete={deleteCard} onInspect={setSelectedCard} isCover={album.cover_card_id === getCoverId(card)} isEditing={isEditing} isMasterSet={album.is_master_set} setTotal={setTotal} />)}
            </div>
        )}
      </div>
    </div>
  )
}