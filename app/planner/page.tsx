'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
    Loader2, LayoutTemplate, Library, Grid3X3, ArrowLeft, 
    CheckCircle2, Search, Image as ImageIcon, Box, MonitorSmartphone,
    ChevronLeft, ChevronRight, Trash2, RotateCcw, X, Lock, Sparkles, Printer
} from 'lucide-react'
import { toast } from 'sonner'

const CARD_BACK_URL = "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg"

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false) 
  const [albums, setAlbums] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null) 
  
  const [albumCards, setAlbumCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Estados de interacción
  const [currentSpread, setCurrentSpread] = useState(0)
  const [binderPages, setBinderPages] = useState<Record<number, any[]>>({})
  const [draggedItem, setDraggedItem] = useState<any | null>(null)
  
  // Estado de guardado
  const [isSaving, setIsSaving] = useState(false)
  const isFirstLoad = useRef(true)

  // 1. Detectar Móvil
  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 2. Cargar Datos Iniciales
  useEffect(() => {
    if (isMobile) return 

    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', session.user.id).single()
        const hasAccess = profile?.subscription_status === 'PRO' || profile?.subscription_status === 'GYM'
        setIsPro(hasAccess)

        const { data, error } = await supabase
            .from('albums')
            .select('id, name, set_id, created_at, binder_data')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        setAlbums(data || [])
      } catch (error) {
        toast.error('Error cargando datos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isMobile])

  // 3. AUTOGUARDADO
  useEffect(() => {
      if (isFirstLoad.current || !selectedAlbum || !selectedLayout) {
          isFirstLoad.current = false
          return
      }

      const saveToDb = async () => {
          setIsSaving(true)
          try {
              const { error } = await supabase
                  .from('albums')
                  .update({
                      binder_data: {
                          layout: selectedLayout,
                          slots: binderPages,
                          last_edited: new Date().toISOString()
                      }
                  })
                  .eq('id', selectedAlbum.id)

              if (error) throw error
          } catch (err) {
              console.error("Error guardando:", err)
          } finally {
              setTimeout(() => setIsSaving(false), 500)
          }
      }

      const timeoutId = setTimeout(saveToDb, 2000)
      return () => clearTimeout(timeoutId)

  }, [binderPages, selectedLayout, selectedAlbum])


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
      fetchAlbumCards(album.id)
      
      if (album.binder_data && album.binder_data.layout) {
          setSelectedLayout(album.binder_data.layout)
          setBinderPages(album.binder_data.slots || {})
          toast.success('Diseño cargado correctamente')
      } else {
          setSelectedLayout(null)
          setBinderPages({})
      }
      setCurrentSpread(0)
      isFirstLoad.current = true 
  }

  const handleConfirmLayout = async (layout: string) => {
      setSelectedLayout(layout)
      setCurrentSpread(0)
      setBinderPages({}) 
  }

  const handlePrintPDF = () => {
      window.print()
  }

  const getPagesInCurrentSpread = () => {
      if (currentSpread === 0) return [0] 
      const leftPageIndex = (currentSpread * 2) - 1
      const rightPageIndex = (currentSpread * 2)
      return [leftPageIndex, rightPageIndex]
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

  const handleDrop = (e: React.DragEvent, pageIndex: number, slotIndex: number) => {
      e.preventDefault()
      if (!draggedItem) return

      const slotsPerPage = getSlotsPerPage()
      
      setBinderPages(prev => {
          const newPages = { ...prev }
          if (!newPages[pageIndex]) {
              newPages[pageIndex] = Array(slotsPerPage).fill(null)
          }
          const updatedPage = [...(newPages[pageIndex] || Array(slotsPerPage).fill(null))]
          updatedPage[slotIndex] = { ...draggedItem, uid: Math.random() }
          newPages[pageIndex] = updatedPage
          return newPages
      })
      setDraggedItem(null)
  }

  const clearSlot = (pageIndex: number, slotIndex: number) => {
      setBinderPages(prev => {
          const newPages = { ...prev }
          if (!newPages[pageIndex]) return prev
          const updatedPage = [...newPages[pageIndex]]
          updatedPage[slotIndex] = null
          newPages[pageIndex] = updatedPage
          return newPages
      })
  }

  const clearSpread = () => {
      if(confirm('¿Vaciar las páginas visibles?')) {
          const pages = getPagesInCurrentSpread()
          setBinderPages(prev => {
              const newPages = { ...prev }
              pages.forEach(p => { newPages[p] = Array(getSlotsPerPage()).fill(null) })
              return newPages
          })
      }
  }

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

  const getPageAspectRatio = () => {
      switch(selectedLayout) {
          case '4x3': return '252 / 264'
          case '3x4': return '189 / 352'
          default: return '63 / 88' 
      }
  }

  const filteredCards = albumCards.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.number.toString().includes(searchQuery)
  )

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>
  
  if (isMobile) {
      return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-white/5 animate-pulse"><MonitorSmartphone size={40} className="text-violet-400" /></div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tight">¿Quieres organizar tu álbum?</h2>
            <div className="max-w-xs mx-auto space-y-4"><p className="text-slate-300 text-sm leading-relaxed font-medium">El diseño de un binder requiere espacio, perspectiva y mucha calma.</p><p className="text-slate-500 text-xs leading-relaxed">Hemos creado el <strong>Binder Lab</strong> para disfrutarse en pantalla grande.</p></div>
            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10"><p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">Te esperamos en el ordenador</p></div>
            <button onClick={() => router.back()} className="mt-8 text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4 text-xs transition-colors">Volver atrás</button>
        </div>
      )
  }

  if (!isPro && selectedLayout) {
      return (
        <div className="fixed inset-0 top-20 z-[50] bg-slate-950 flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="relative z-10 max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 text-amber-400"><Lock size={32} /></div>
                <h2 className="text-3xl font-black text-white italic uppercase mb-2">Función <span className="text-amber-500">PRO</span></h2>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">El <strong>Binder Lab</strong> es una herramienta avanzada. Desbloquea esta y otras herramientas premium.</p>
                <button onClick={() => router.push('/profile?open_pro=true')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black uppercase tracking-widest py-4 px-8 rounded-xl hover:scale-105 transition-transform shadow-lg flex items-center gap-2"><Sparkles size={18} /> Desbloquear Ahora</button>
                <button onClick={() => setSelectedLayout(null)} className="mt-6 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Volver</button>
            </div>
        </div>
      )
  }

  return (
    // FIX LAYOUT: fixed desde top-20 (navbar aprox 80px) hasta bottom-0.
    // Sin barra intermedia.
    <div className="fixed inset-x-0 bottom-0 top-[64px] bg-slate-950 text-white font-sans flex flex-col z-0">
        
        {/* ESTILOS DE IMPRESIÓN REFORZADOS */}
        <style jsx global>{`
            @media print {
                @page { size: A4; margin: 10mm; }
                body { background-color: white !important; }
                body * { visibility: hidden; }
                #printable-area, #printable-area * { visibility: visible; }
                #printable-area { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100%; 
                    background: white; 
                    color: black; 
                    z-index: 9999;
                }
                .print-page { 
                    break-after: page; 
                    page-break-after: always; 
                    display: block; 
                    height: 100vh; /* Forzar altura completa para asegurar el salto */
                    overflow: hidden; /* Evitar desbordes que creen páginas extra */
                }
                .print-page:last-child { break-after: auto; page-break-after: auto; }
                .no-print { display: none !important; }
            }
        `}</style>

        {/* ÁREA DE IMPRESIÓN (GENERADA) */}
        <div id="printable-area" className="hidden print:block bg-white text-black">
            {Object.entries(binderPages).map(([pageNum, slots]) => {
                let gridClass = 'grid-cols-3'
                if (selectedLayout === '2x2') gridClass = 'grid-cols-2'
                if (selectedLayout === '4x3' || selectedLayout === '4x4') gridClass = 'grid-cols-4'
                if (selectedLayout === '5x5') gridClass = 'grid-cols-5'

                return (
                    <div key={pageNum} className="print-page p-4">
                        <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                            <div>
                                <h1 className="text-xl font-bold uppercase">{selectedAlbum?.name}</h1>
                                <p className="text-[10px] text-gray-500 font-mono uppercase">PokéBinders • {selectedLayout}</p>
                            </div>
                            <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded">PÁGINA {parseInt(pageNum) + 1}</span>
                        </div>
                        
                        <div className={`grid ${gridClass} gap-2 w-full`}>
                            {slots.map((slot: any, idx: number) => (
                                <div key={idx} className="aspect-[63/88] border border-gray-300 rounded flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                                    {slot?.type === 'CARD' ? (
                                        <>
                                            <img src={slot.image} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 inset-x-0 bg-white/90 p-0.5 text-[6px] text-center font-bold border-t border-gray-200 truncate">
                                                {slot.name} #{slot.number}
                                            </div>
                                        </>
                                    ) : slot?.type === 'EMPTY' ? (
                                        <div className="flex flex-col items-center justify-center text-gray-300">
                                            <Box size={20} className="mb-1 opacity-30" />
                                            <span className="text-[6px] font-bold uppercase tracking-widest">Vacío</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-200 text-xs font-black opacity-20">#{idx + 1}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
            
            {/* VISTA 1 & 2: SELECTORES */}
            {!selectedLayout && (
                <div className="w-full h-full overflow-y-auto p-6 md:p-12">
                     <div className="max-w-7xl mx-auto">
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
                                        const hasDesign = album.binder_data?.slots && Object.keys(album.binder_data.slots).length > 0
                                        return (
                                            <div key={album.id} onClick={() => handleSelectAlbum(album)} className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-4 text-center">
                                                {hasDesign && <div className="absolute top-3 right-3 px-2 py-1 bg-violet-500/20 text-violet-300 text-[9px] font-bold uppercase tracking-widest rounded border border-violet-500/30">En Curso</div>}
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
                                {[{ id: '2x2', name: 'Portafolio', text: '2x2 (4 huecos)', grid: 2, count: 4 }, { id: '3x3', name: 'Estándar', text: '3x3 (9 huecos)', grid: 3, count: 9 }, { id: '4x3', name: 'Playset', text: '4x3 (12 huecos)', grid: 4, count: 12 }, { id: '4x4', name: 'Jumbo', text: '4x4 (16 huecos)', grid: 4, count: 16 }, { id: '5x5', name: 'Coloso', text: '5x5 (25 huecos)', grid: 5, count: 25 }].map((fmt) => (
                                    <div key={fmt.id} onClick={() => handleConfirmLayout(fmt.id)} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-6 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                                        <div className={`w-full aspect-square mb-4 bg-slate-950 rounded-xl border border-white/5 p-3 grid grid-cols-${fmt.grid} gap-1 content-center`}>{[...Array(fmt.count)].map((_, i) => <div key={i} className="bg-white/5 rounded-[1px] border border-white/5 aspect-square" />)}</div>
                                        <h3 className="text-lg font-black text-white mb-1 group-hover:text-blue-400">{fmt.name}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{fmt.text}</p>
                                        {!isPro && <div className="absolute top-2 right-2 text-amber-500"><Lock size={16} /></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            )}

            {/* VISTA 3: EDITOR (PC + PRO) */}
            {selectedLayout && !isMobile && (
                <div className="w-full h-full flex flex-row animate-in fade-in zoom-in-[0.99] duration-500 px-6 py-6 overflow-hidden">
                    
                    {/* LIENZO */}
                    <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl p-4 md:p-8 flex items-center justify-center relative overflow-hidden mr-4 shadow-inner">
                        
                        {/* BOTONES FLOTANTES: Izquierda */}
                        <div className="absolute top-6 left-6 z-20 flex gap-2">
                            <button onClick={() => setSelectedLayout(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-950/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors shadow-lg">
                                <ArrowLeft size={14} /> Volver
                            </button>
                        </div>

                        {/* BOTONES FLOTANTES: Derecha */}
                        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur border border-white/5 shadow-lg transition-all ${isSaving ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {isSaving ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                {isSaving ? 'Guardando...' : 'Guardado'}
                            </div>
                            <button onClick={handlePrintPDF} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-violet-900/20">
                                <Printer size={14} /> PDF
                            </button>
                        </div>

                        {/* CONTENEDOR DE PÁGINAS (RESPONSIVE HEIGHT CON MAX-H PARA DEJAR SITIO ABAJO) */}
                        <div className="flex gap-4 w-full justify-center items-center h-full max-h-[calc(100%-60px)] transition-all duration-500">
                            {getPagesInCurrentSpread().map((pageIndex) => {
                                const slots = binderPages[pageIndex] || Array(getSlotsPerPage()).fill(null)
                                return (
                                    <div key={pageIndex} className="relative h-full bg-slate-950 rounded-lg border border-white/10 shadow-2xl p-4 flex flex-col transition-all duration-300 ease-in-out" style={{ aspectRatio: getPageAspectRatio() }}>
                                        <div className="absolute -top-10 left-0 right-0 flex justify-center"><div className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/5 shadow-sm">Página {pageIndex + 1}</div></div>
                                        <div className={`grid ${getGridCols()} gap-2 w-full h-full content-start`}>
                                            {slots.map((slotItem: any, slotIdx: number) => {
                                                const isEmptySlot = slotItem?.type === 'EMPTY'
                                                const isCard = slotItem?.type === 'CARD'
                                                return (
                                                    <div key={`${pageIndex}-${slotIdx}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, pageIndex, slotIdx)} className={`relative w-full aspect-[63/88] rounded border transition-all flex items-center justify-center group overflow-hidden ${slotItem ? 'border-white/20 bg-slate-900' : 'border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50'}`}>
                                                        {isCard && (<div className="w-full h-full relative group/card"><img src={slotItem.image} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-10"><button onClick={() => clearSlot(pageIndex, slotIdx)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={16} /></button></div></div>)}
                                                        {isEmptySlot && (<div className="w-full h-full relative group/empty"><img src={CARD_BACK_URL} className="w-full h-full object-cover opacity-60 grayscale-[30%]" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover/empty:opacity-100 transition-opacity flex items-center justify-center z-10"><button onClick={() => clearSlot(pageIndex, slotIdx)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all"><X size={16} /></button></div></div>)}
                                                        {!slotItem && (<span className="text-slate-600 text-xs font-mono group-hover:text-violet-400 pointer-events-none">{(pageIndex * getSlotsPerPage()) + slotIdx + 1}</span>)}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {/* CONTROLES PAGINACIÓN (STATIC BOTTOM, ABSOLUTE POSITIONED RELATIVE TO CANVAS) */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl z-30">
                            <button onClick={clearSpread} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-full transition-colors" title="Vaciar vista actual"><RotateCcw size={16}/></button>
                            <div className="h-6 w-[1px] bg-white/10" />
                            <button onClick={() => setCurrentSpread(Math.max(0, currentSpread - 1))} disabled={currentSpread === 0} className="p-2 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-30 disabled:hover:bg-white/10"><ChevronLeft size={20}/></button>
                            <span className="text-xs font-bold text-white w-24 text-center">{currentSpread === 0 ? "PORTADA" : `PÁG ${currentSpread * 2} - ${currentSpread * 2 + 1}`}</span>
                            <button onClick={() => setCurrentSpread(currentSpread + 1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full"><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    {/* DOCK */}
                    <div className="w-80 h-full bg-slate-950 border border-white/10 rounded-2xl flex flex-col shadow-2xl z-20 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-slate-900/50"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tus Cartas ({albumCards.length})</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} /><input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"/></div></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {loadingCards ? (<div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" /></div>) : filteredCards.length === 0 ? (<div className="text-center py-10 text-slate-500 text-xs">No hay cartas.</div>) : (
                                filteredCards.map((card) => (
                                    <div key={card.id} draggable onDragStart={(e) => handleDragStart(e, card)} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10 transition-all select-none">
                                        <div className="w-10 h-14 bg-slate-900 rounded overflow-hidden relative shadow-sm shrink-0">{card.image ? <img src={card.image} className="w-full h-full object-cover pointer-events-none" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-slate-600"/></div>}</div>
                                        <div className="min-w-0 pointer-events-none"><p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{card.name}</p><p className="text-[10px] text-slate-500 font-mono">#{card.number}</p></div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 border-t border-white/10 bg-slate-900/50"><div draggable onDragStart={(e) => handleDragStart(e, { type: 'EMPTY', image: CARD_BACK_URL })} className="w-full py-3 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 text-slate-400 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing border border-dashed border-white/10 hover:border-violet-500/50 transition-all"><Box size={14} /> Arrastrar Hueco Vacío</div></div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}