'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' 
import { supabase } from '../../lib/supabase'
import { Library, Loader2, Trash2, Layers, Grid, User, Trophy } from 'lucide-react'

// --- MODAL DE BORRADO ---
const DeleteModal = ({ isOpen, onClose, onConfirm, title }: any) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2 text-center">¿Borrar Colección?</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          Vas a eliminar <span className="text-white">"{title}"</span>. Las cartas seguirán en tu inventario global.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 transition-colors">Eliminar</button>
        </div>
      </div>
    </div>
  )
}

type Album = {
  id: string
  name: string
  is_master_set: boolean
  set_id?: string
  created_at: string
  total_cards: number
  acquired_cards: number
  cover_image?: string     
  cover_card_id?: string   
}

const getVariantData = (card: any) => {
  if (!card) return null;
  const v = card.card_variants;
  if (Array.isArray(v)) return v[0] || null;
  return v || null;
}

const getSyncId = (card: any) => {
  if (!card) return null;
  const rawId = card.card_id || getVariantData(card)?.card_id;
  return rawId ? String(rawId).trim().toLowerCase() : null;
}

export default function Dashboard() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, albumId: '', albumName: '' })
  
  const router = useRouter()

  useEffect(() => {
    router.refresh()
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        fetchAlbumsAndInventory(session.user.id)
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const fetchAlbumsAndInventory = async (userId: string) => {
    try {
      setLoading(true)

      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select(`
          *,
          manual_cover: card_variants!cover_card_id ( image_url ),
          album_cards (
            card_id, 
            card_variants (card_id, image_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (albumsError) throw albumsError

      const { data: inventoryData, error: invError } = await supabase
        .from('inventory')
        .select('card_id, quantity_normal, quantity_holo, quantity_reverse')
        .eq('user_id', userId)

      if (invError) throw invError

      const inventoryMap = new Map()
      inventoryData?.forEach((item: any) => {
          if (item.card_id) {
              inventoryMap.set(String(item.card_id).trim().toLowerCase(), item)
          }
      })

      const formattedAlbums = albumsData.map((album: any) => {
        const cardsInAlbum = album.album_cards || []
        const totalSlots = album.is_master_set ? cardsInAlbum.length * 2 : cardsInAlbum.length
        let acquiredSlots = 0

        cardsInAlbum.forEach((c: any) => {
            const syncId = getSyncId(c)
            const invItem = syncId ? inventoryMap.get(syncId) : null

            if (invItem) {
                const qN = Number(invItem.quantity_normal) || 0
                const qH = Number(invItem.quantity_holo) || 0
                const qR = Number(invItem.quantity_reverse) || 0
                const totalQ = qN + qH + qR

                if (album.is_master_set) {
                    if (qN > 0) acquiredSlots++ 
                    if (qH > 0) acquiredSlots++ 
                    if (qR > 0) acquiredSlots++ 
                } else {
                    if (totalQ > 0) acquiredSlots++
                }
            }
        })

        const manualCoverUrl = album.manual_cover?.image_url
        const firstCardUrl = album.album_cards?.[0]?.card_variants?.image_url
        const finalCover = manualCoverUrl || firstCardUrl || null

        return {
          id: album.id,
          name: album.name,
          is_master_set: album.is_master_set,
          set_id: album.set_id,
          created_at: album.created_at,
          total_cards: totalSlots, 
          acquired_cards: acquiredSlots, 
          cover_image: finalCover,
          cover_card_id: album.cover_card_id
        }
      })

      setAlbums(formattedAlbums)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlbum = (e: React.MouseEvent, album: Album) => {
    e.preventDefault(); e.stopPropagation()
    setDeleteModal({ isOpen: true, albumId: album.id, albumName: album.name })
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('albums').delete().eq('id', deleteModal.albumId)
      if (error) throw error
      setAlbums(prev => prev.filter(a => a.id !== deleteModal.albumId))
      setDeleteModal({ isOpen: false, albumId: '', albumName: '' })
    } catch (error) {
      alert('Error: ' + (error as any).message)
    }
  }

  const getBadgeInfo = (album: Album) => {
    if (album.set_id) {
       if (album.is_master_set) {
          return { text: 'Master Set', style: 'bg-amber-500/20 border-amber-500/30 text-amber-200 shadow-amber-900/20', icon: <Layers size={10} className="mr-1" /> }
       } else {
          return { text: 'Set Oficial', style: 'bg-violet-500/20 border-violet-500/30 text-violet-200 shadow-violet-900/20', icon: <Grid size={10} className="mr-1" /> }
       }
    } else {
       return { text: 'Personal', style: 'bg-blue-500/20 border-blue-500/30 text-blue-200 shadow-blue-900/20', icon: <User size={10} className="mr-1" /> }
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" size={40} /></div>
  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Inicia sesión</div>

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative selection:bg-violet-500/30">
      <DeleteModal 
        isOpen={deleteModal.isOpen} 
        title={deleteModal.albumName}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete} 
      />
      
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />

      {/* HEADER */}
      <div className="relative pt-24 md:pt-32 px-4 md:px-8 max-w-[1600px] mx-auto mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-[10px] md:text-xs font-bold text-violet-400 uppercase tracking-widest mb-1 md:mb-2">Tu Espacio</h2>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Mis Colecciones</h1>
        </div>
      </div>

      {/* GRID */}
      <div className="relative px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
        {albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {albums.map((album) => {
              const percent = album.total_cards > 0 ? Math.round((album.acquired_cards / album.total_cards) * 100) : 0
              const visualPercent = percent > 100 ? 100 : percent
              
              const badge = getBadgeInfo(album)
              const logoUrl = album.set_id ? `https://images.pokemontcg.io/${album.set_id}/logo.png` : null

              return (
                <Link href={`/album/${album.id}`} key={album.id}>
                  {/* AJUSTE ALTURA MOVIL: h-[280px] en movil, h-[400px] en pc */}
                  <div className="group relative h-[280px] md:h-[400px] rounded-[24px] md:rounded-[32px] cursor-pointer transition-all duration-500 hover:-translate-y-2 bg-slate-900 border border-white/5 hover:border-violet-500/50 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
                    
                    {/* PORTADA */}
                    <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 -z-10" />
                       
                       {logoUrl ? (
                         <>
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 to-transparent opacity-50" />
                           <img src={logoUrl} className="relative z-20 w-3/4 max-h-[100px] md:max-h-[140px] object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-110" />
                         </>
                       ) : album.cover_image ? (
                         <>
                           <img src={album.cover_image!} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xl scale-110" />
                           <img src={album.cover_image!} className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: 'top center' }} />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
                         </>
                       ) : (
                         <Layers size={48} className="text-slate-800 relative z-0 md:w-16 md:h-16" />
                       )}

                       {/* ETIQUETA */}
                       <div className="absolute top-3 left-3 md:top-4 md:left-4 z-30 flex gap-2">
                            <span className={`backdrop-blur-md border px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center text-[8px] md:text-[9px] font-bold ${badge.style}`}>
                                {badge.icon} {badge.text}
                            </span>
                       </div>

                       {/* COMPLETADO (Feedback visual) */}
                       {visualPercent === 100 && (
                           <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in">
                               <div className="bg-yellow-500 text-black font-black px-4 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full shadow-[0_0_30px_#eab308] flex items-center gap-2 transform scale-110 animate-bounce">
                                   <Trophy size={16} /> ¡COMPLETADO!
                               </div>
                           </div>
                       )}

                       <button onClick={(e) => handleDeleteAlbum(e, album)} className="absolute top-3 right-3 md:top-4 md:right-4 z-30 p-1.5 md:p-2 bg-black/40 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10">
                          <Trash2 size={16} />
                       </button>
                    </div>

                    {/* DATOS (Pie de tarjeta) */}
                    <div className="h-[90px] md:h-[110px] p-4 md:p-6 relative z-30 bg-slate-900 border-t border-white/5 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2 md:mb-3 gap-2">
                        {/* TÍTULO ARREGLADO: line-clamp-2 y altura fija para alineación */}
                        <h3 className="text-sm md:text-xl font-bold text-white leading-tight line-clamp-2 h-[2.5em] md:h-auto flex items-center w-full">
                            {album.name}
                        </h3>
                        <span className="text-[10px] md:text-xs text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded-md border border-white/5 shrink-0 mt-1 md:mt-0">
                          {album.total_cards}
                        </span>
                      </div>

                      <div className="space-y-1 md:space-y-1.5">
                        <div className="h-1 md:h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                           <div className={`h-full transition-all duration-1000 ${visualPercent === 100 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-violet-500'}`} style={{ width: `${visualPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Progreso</p>
                          <p className={`text-[8px] md:text-[10px] font-bold ${visualPercent === 100 ? 'text-green-400' : 'text-violet-400'}`}>{visualPercent}%</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 md:py-32 bg-slate-900/30 rounded-[32px] border border-white/5 border-dashed animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-white/5">
              <Library size={24} className="text-violet-400 md:w-8 md:h-8" />
            </div>
            <h3 className="text-white font-bold text-xl md:text-2xl mb-2">Tu colección empieza aquí</h3>
            <p className="text-slate-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base px-4">Crea álbumes manuales para tus favoritos o sigue el progreso de los sets oficiales.</p>
            <Link href="/create">
              <button className="bg-violet-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-900/20 border-t border-white/10 text-sm md:text-base">
                Crear primer álbum
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}