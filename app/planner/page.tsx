'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
    Loader2, LayoutTemplate, Library, Grid3X3, ArrowLeft, 
    CheckCircle2, Search, Image as ImageIcon, Box, MonitorSmartphone,
    ChevronLeft, ChevronRight, Trash2, RotateCcw, X // <--- Aseguramos que X está importada
} from 'lucide-react'
import { toast } from 'sonner'

// URL de la trasera oficial de Pokémon
const CARD_BACK_URL = "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg"

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [checkingMobile, setCheckingMobile] = useState(true) 
  
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null) 
  
  const [albumCards, setAlbumCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Estados de interacción
  const [currentPage, setCurrentPage] = useState(0)
  const [binderPages, setBinderPages] = useState<Record<number, any[]>>({})
  const [draggedItem, setDraggedItem] = useState<any | null>(null)

  useEffect(() => {
      const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024)
          setCheckingMobile(false)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) return 

    const fetchAlbums = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        const { data, error } = await supabase
            .from('albums')
            .select('id, name, set_id, created_at, binder_data')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        setAlbums(data || [])
      } catch (error) {
        toast.error('Error cargando álbumes')
      } finally {
        setLoading(false)
      }
    }
    fetchAlbums()
  }, [isMobile])

  const fetchAlbumCards = async (albumId: string) => {
      setLoadingCards(true)
      try {
          const { data, error } = await supabase
            .from('album_cards')
            .select(`id, card_variants (id, image_url, cards (name, collector_number, rarity))`)
            .eq('album_id', albumId)
          
          if (error) throw error

          const formattedCards = data.map((item: any) => ({
              id: item.id, 
              variantId: item.card_variants?.id,
              name: item.card_variants?.cards?.name || 'Desconocido',
              number: item.card_variants?.cards?.collector_number || '---',
              image: item.card_variants?.image_url,
              rarity: item.card_variants?.cards?.rarity,
              type: 'CARD'
          }))

          formattedCards.sort((a: any, b: any) => {
              const numA = parseInt(a.number) || 9999
              const numB = parseInt(b.number) || 9999
              return numA - numB
          })

          setAlbumCards(formattedCards)
      } catch (error) {
          toast.error('Error cargando cartas')
      } finally {
          setLoadingCards(false)
      }
  }

  const handleSelectAlbum = (album: any) => {
      setSelectedAlbum(album)
      setSelectedLayout(null)
      fetchAlbumCards(album.id)
      setBinderPages({})
      setCurrentPage(0)
  }

  const handleConfirmLayout = async (layout: string) => {
      setSelectedLayout(layout)
      setCurrentPage(0)
      setBinderPages({})
  }

  // --- DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, item: any) => {
      setDraggedItem(item)
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
  }

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault()
      if (!draggedItem) return

      const slotsPerPage = getSlotsPerPage()
      
      setBinderPages(prev => {
          const newPages = { ...prev }
          if (!newPages[currentPage]) {
              newPages[currentPage] = Array(slotsPerPage).fill(null)
          }
          
          const updatedPage = [...(newPages[currentPage] || Array(slotsPerPage).fill(null))]
          updatedPage[slotIndex] = { ...draggedItem, uid: Math.random() }
          
          newPages[currentPage] = updatedPage
          return newPages
      })
      setDraggedItem(null)
  }

  const clearSlot = (slotIndex: number) => {
      setBinderPages(prev => {
          const newPages = { ...prev }
          if (!newPages[currentPage]) return prev
          
          const updatedPage = [...newPages[currentPage]]
          updatedPage[slotIndex] = null
          newPages[currentPage] = updatedPage
          return newPages
      })
  }

  const clearPage = () => {
      if(confirm('¿Vaciar esta página?')) {
          setBinderPages(prev => {
              const newPages = { ...prev }
              newPages[currentPage] = Array(getSlotsPerPage()).fill(null)
              return newPages
          })
      }
  }

  // --- UTILS ---
  const getGridCols = () => {
      switch(selectedLayout) {
          case '2x2': return 'grid-cols-2'
          case '3x3': return 'grid-cols-3'
          case '4x3': return 'grid-cols-4'
          case '4x4': return 'grid-cols-4'
          case '5x5': return 'grid-cols-5'
          default: return 'grid-cols-3'
      }
  }

  const getSlotsPerPage = () => {
      switch(selectedLayout) {
          case '2x2': return 4
          case '3x3': return 9
          case '4x3': return 12
          case '4x4': return 16
          case '5x5': return 25
          default: return 9
      }
  }

  const filteredCards = albumCards.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.number.toString().includes(searchQuery)
  )

  const currentSlots = binderPages[currentPage] || Array(getSlotsPerPage()).fill(null)

  if (checkingMobile) return <div className="min-h-screen bg-slate-950" />
  
  if (isMobile) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-white/5 animate-pulse">
                <MonitorSmartphone size={40} className="text-violet-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tight">¿Quieres organizar tu álbum?</h2>
            <div className="max-w-xs mx-auto space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed font-medium">El diseño de un binder requiere espacio, perspectiva y mucha calma.</p>
                <p className="text-slate-500 text-xs leading-relaxed">Hemos creado el <strong>Binder Lab</strong> para disfrutarse en pantalla grande, donde puedes cuidar cada detalle sin limitaciones.</p>
            </div>
            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">Te esperamos en el ordenador</p>
            </div>
            <button onClick={() => router.back()} className="mt-8 text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4 text-xs transition-colors">Volver atrás</button>
        </div>
      )
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <div className="h-16 border-b border-white/10 bg-slate-950 flex items-center px-6 justify-between z-50 shrink-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => {
                        if (selectedLayout) setSelectedLayout(null)
                        else if (selectedAlbum) setSelectedAlbum(null)
                        else router.back()
                    }} 
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                        {selectedAlbum ? selectedAlbum.name : 'Binder Lab'}
                    </h1>
                    {selectedLayout && (
                        <p className="text-[10px] text-violet-400 font-mono">
                            FORMATO {selectedLayout} • {albumCards.length} CARTAS
                        </p>
                    )}
                </div>
            </div>
            {selectedLayout && (
                <div className="flex items-center gap-3">
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden md:inline-block">Autoguardado activado</span>
                </div>
            )}
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 relative overflow-hidden flex">
            
            {/* SELECTORES */}
            {!selectedLayout && (
                <div className="w-full h-full overflow-y-auto p-6 md:p-12">
                     <div className="max-w-7xl mx-auto pt-10">
                        <header className="mb-12 text-center md:text-left animate-in slide-in-from-top-4 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-4">
                                <LayoutTemplate size={12} />
                                <span>Binder Lab Beta</span>
                            </div>
                            {!selectedAlbum ? (<h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">Organiza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Álbum</span></h1>) : (<h1 className="text-4xl md:text-5xl font-black text-white uppercase mb-4">Modo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Diseño</span></h1>)}
                            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">{!selectedAlbum ? "Planifica la distribución física de tus cartas antes de meterlas en la carpeta real." : `Vamos a organizar "${selectedAlbum.name}".`}</p>
                        </header>

                        {!selectedAlbum && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {albums.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-white/10"><p className="text-slate-500 mb-4">No tienes álbumes.</p><button onClick={() => router.push('/create')} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Crear álbum</button></div>
                                ) : (
                                    albums.map((album) => {
                                        const setLogo = album.set_id ? `https://images.pokemontcg.io/${album.set_id}/logo.png` : null
                                        return (
                                            <div key={album.id} onClick={() => handleSelectAlbum(album)} className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                    {setLogo ? <img src={setLogo} className="w-full h-full object-contain drop-shadow-md" /> : <Library size={24} className="text-slate-500" />}
                                                </div>
                                                <div><h3 className="font-bold text-white group-hover:text-violet-300 transition-colors truncate w-full max-w-[200px]">{album.name}</h3></div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {selectedAlbum && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
                                {[
                                    { id: '2x2', name: 'Portafolio', text: '2x2 (4 huecos)', grid: 2, count: 4 },
                                    { id: '3x3', name: 'Estándar', text: '3x3 (9 huecos)', grid: 3, count: 9 },
                                    { id: '4x3', name: 'Playset', text: '4x3 (12 huecos)', grid: 4, count: 12 },
                                    { id: '4x4', name: 'Jumbo', text: '4x4 (16 huecos)', grid: 4, count: 16 },
                                    { id: '5x5', name: 'Coloso', text: '5x5 (25 huecos)', grid: 5, count: 25 },
                                ].map((fmt) => (
                                    <div key={fmt.id} onClick={() => handleConfirmLayout(fmt.id)} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-6 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                                        <div className={`w-full aspect-square mb-4 bg-slate-950 rounded-xl border border-white/5 p-3 grid grid-cols-${fmt.grid} gap-1 content-center`}>{[...Array(fmt.count)].map((_, i) => <div key={i} className="bg-white/5 rounded-[1px] border border-white/5 aspect-square" />)}</div>
                                        <h3 className="text-lg font-black text-white mb-1 group-hover:text-blue-400">{fmt.name}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{fmt.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            )}

            {/* EDITOR */}
            {selectedLayout && !isMobile && (
                <div className="w-full h-full flex flex-row animate-in fade-in zoom-in-[0.99] duration-500">
                    
                    {/* LIENZO */}
                    <div className="flex-1 bg-slate-900/50 p-8 flex items-center justify-center relative overflow-hidden">
                        <div className="relative h-full max-h-full aspect-[210/297] bg-slate-950 rounded-lg border border-white/10 shadow-2xl p-4 md:p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/5 shadow-sm">
                                    Página {currentPage + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={clearPage} className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors" title="Vaciar página"><RotateCcw size={14}/></button>
                                    <div className="h-4 w-[1px] bg-white/10 mx-1"/>
                                    <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-white/5"><ChevronLeft size={16}/></button>
                                    <button onClick={() => setCurrentPage(currentPage + 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                            
                            <div className={`grid ${getGridCols()} gap-2 w-full h-full`}>
                                {currentSlots.map((slotItem: any, index: number) => {
                                    const isEmptySlot = slotItem?.type === 'EMPTY'
                                    const isCard = slotItem?.type === 'CARD'

                                    return (
                                        <div 
                                            key={`${currentPage}-${index}`} 
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`relative w-full h-full rounded border transition-all flex items-center justify-center group overflow-hidden ${
                                                slotItem ? 'border-white/20 bg-slate-900' : 'border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50'
                                            }`}
                                        >
                                            {/* RENDERIZADO DEL HUECO */}
                                            {isCard && (
                                                <div className="w-full h-full relative group/card">
                                                    <img src={slotItem.image} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                        <button onClick={() => clearSlot(index)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AQUÍ ESTÁ EL CAMBIO: TRASERA DE CARTA EN LUGAR DE CAJA GRIS */}
                                            {isEmptySlot && (
                                                <div className="w-full h-full relative group/empty">
                                                    <img src={CARD_BACK_URL} className="w-full h-full object-cover opacity-60 grayscale-[30%]" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/empty:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                        <button onClick={() => clearSlot(index)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {!slotItem && (<span className="text-slate-600 text-xs font-mono group-hover:text-violet-400 pointer-events-none">{(currentPage * getSlotsPerPage()) + index + 1}</span>)}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* DOCK */}
                    <div className="w-80 h-full bg-slate-950 border-l border-white/10 flex flex-col shadow-2xl z-20">
                        <div className="p-4 border-b border-white/10 bg-slate-900/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tus Cartas ({albumCards.length})</h3>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} /><input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {loadingCards ? (<div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" /></div>) : filteredCards.length === 0 ? (<div className="text-center py-10 text-slate-500 text-xs">No hay cartas.</div>) : (
                                filteredCards.map((card) => (
                                    <div key={card.id} draggable onDragStart={(e) => handleDragStart(e, card)} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10 transition-all select-none">
                                        <div className="w-10 h-14 bg-slate-900 rounded overflow-hidden relative shadow-sm shrink-0">
                                            {card.image ? <img src={card.image} className="w-full h-full object-cover pointer-events-none" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-slate-600"/></div>}
                                        </div>
                                        <div className="min-w-0 pointer-events-none"><p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{card.name}</p><p className="text-[10px] text-slate-500 font-mono">#{card.number}</p></div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 border-t border-white/10 bg-slate-900/50">
                            <div draggable onDragStart={(e) => handleDragStart(e, { type: 'EMPTY', image: CARD_BACK_URL })} className="w-full py-3 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 text-slate-400 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing border border-dashed border-white/10 hover:border-violet-500/50 transition-all">
                                <Box size={14} /> Arrastrar Hueco Vacío
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}