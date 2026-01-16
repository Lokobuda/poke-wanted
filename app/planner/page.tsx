'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
    Loader2, LayoutTemplate, Library, Grid3X3, ArrowLeft, 
    CheckCircle2, Search, Image as ImageIcon, Box
} from 'lucide-react'
import { toast } from 'sonner'

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<any[]>([])
  
  // Estados de navegación
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null) 
  
  // Estados del Editor (Fase 3)
  const [albumCards, setAlbumCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Cargar álbumes iniciales
  useEffect(() => {
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
  }, [])

  // Cargar cartas cuando se selecciona un álbum
  const fetchAlbumCards = async (albumId: string) => {
      setLoadingCards(true)
      try {
          // Consulta compleja para obtener la imagen y datos de la carta
          const { data, error } = await supabase
            .from('album_cards')
            .select(`
                id, 
                card_variants (
                    id, 
                    image_url, 
                    cards (
                        name, 
                        collector_number, 
                        rarity
                    )
                )
            `)
            .eq('album_id', albumId)
          
          if (error) throw error

          // Aplanamos los datos para facilitar el uso
          const formattedCards = data.map((item: any) => ({
              id: item.id, // ID único de la carta en el álbum
              variantId: item.card_variants?.id,
              name: item.card_variants?.cards?.name || 'Desconocido',
              number: item.card_variants?.cards?.collector_number || '---',
              image: item.card_variants?.image_url,
              rarity: item.card_variants?.cards?.rarity
          }))

          setAlbumCards(formattedCards)
      } catch (error) {
          console.error(error)
          toast.error('Error cargando las cartas del álbum')
      } finally {
          setLoadingCards(false)
      }
  }

  const handleSelectAlbum = (album: any) => {
      setSelectedAlbum(album)
      setSelectedLayout(null)
      fetchAlbumCards(album.id)
  }

  const handleConfirmLayout = async (layout: string) => {
      setSelectedLayout(layout)
  }

  // --- COMPONENTES VISUALES DEL EDITOR ---

  // Cálculo de columnas CSS según el formato
  const getGridCols = () => {
      switch(selectedLayout) {
          case '2x2': return 'grid-cols-2'
          case '3x3': return 'grid-cols-3'
          case '3x4': return 'grid-cols-3' // Playset vertical
          default: return 'grid-cols-3'
      }
  }

  // Cálculo de huecos por página
  const getSlotsPerPage = () => {
      switch(selectedLayout) {
          case '2x2': return 4
          case '3x3': return 9
          case '3x4': return 12
          default: return 9
      }
  }

  // Filtrado de cartas en el Dock
  const filteredCards = albumCards.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.number.includes(searchQuery)
  )

  // --- RENDERIZADO ---

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col h-screen overflow-hidden">
        
        {/* --- BARRA SUPERIOR (HEADER) --- */}
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
                     {/* Aquí irán botones de Guardar / Exportar */}
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden md:inline-block">Autoguardado activado</span>
                </div>
            )}
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="flex-1 relative overflow-hidden flex">
            
            {/* VISTA 1 & 2: SELECTORES (Si no estamos en modo diseño) */}
            {!selectedLayout && (
                <div className="w-full h-full overflow-y-auto p-6 md:p-12">
                     <div className="max-w-6xl mx-auto pt-10">
                        {/* HEADER EXPLICATIVO */}
                        <header className="mb-12 text-center md:text-left animate-in slide-in-from-top-4 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-4">
                                <LayoutTemplate size={12} />
                                <span>Binder Lab Beta</span>
                            </div>
                            
                            {!selectedAlbum ? (
                                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                                    Organiza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Álbum</span>
                                </h1>
                            ) : (
                                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                                    Elige tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Carpeta</span>
                                </h1>
                            )}

                            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
                                {!selectedAlbum 
                                    ? "Planifica la distribución física de tus cartas antes de meterlas en la carpeta real. Diseña la estética perfecta sin mover una sola carta."
                                    : `Vamos a organizar "${selectedAlbum.name}". ¿Qué tipo de hojas utiliza tu carpeta física?`
                                }
                            </p>
                        </header>

                        {/* SELECCIÓN DE ÁLBUM */}
                        {!selectedAlbum && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {albums.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-white/10">
                                        <p className="text-slate-500 mb-4">No tienes álbumes creados todavía.</p>
                                        <button onClick={() => router.push('/create')} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-violet-500 transition-colors">Crear mi primer álbum</button>
                                    </div>
                                ) : (
                                    albums.map((album) => {
                                        const setLogo = album.set_id ? `https://images.pokemontcg.io/${album.set_id}/logo.png` : null
                                        return (
                                            <div key={album.id} onClick={() => handleSelectAlbum(album)} className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                    {setLogo ? <img src={setLogo} className="w-full h-full object-contain drop-shadow-md" alt={album.name} /> : <Library size={24} className="text-slate-500" />}
                                                </div>
                                                <div><h3 className="font-bold text-white group-hover:text-violet-300 transition-colors truncate w-full max-w-[200px]">{album.name}</h3><p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold group-hover:text-white transition-colors">Click para organizar</p></div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* SELECCIÓN DE FORMATO */}
                        {selectedAlbum && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
                                <div onClick={() => handleConfirmLayout('2x2')} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                                    <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-2 gap-2 content-center group-hover:border-blue-500/30 transition-colors">{[...Array(4)].map((_, i) => <div key={i} className="bg-white/5 rounded-md border border-white/5 aspect-[3/4]" />)}</div>
                                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Portafolio</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">4 Bolsillos (2x2)</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">Ideal para colecciones pequeñas, intercambios o carpetas de viaje compactas.</p>
                                </div>
                                <div onClick={() => handleConfirmLayout('3x3')} className="group cursor-pointer relative bg-gradient-to-b from-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-8 hover:border-blue-400 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center text-center ring-1 ring-blue-500/10">
                                    <div className="absolute top-4 right-4 bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popular</div>
                                    <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-3 gap-1.5 content-center group-hover:border-blue-500/30 transition-colors">{[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 rounded-sm border border-white/5 aspect-[3/4]" />)}</div>
                                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Estándar</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">9 Bolsillos (3x3)</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">El formato clásico A4. Perfecto para completar sets y ver evoluciones de 3 en 3.</p>
                                </div>
                                <div onClick={() => handleConfirmLayout('3x4')} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                                    <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-3 gap-1 content-center group-hover:border-blue-500/30 transition-colors">{[...Array(12)].map((_, i) => <div key={i} className="bg-white/5 rounded-[2px] border border-white/5 aspect-[3/4]" />)}</div>
                                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Playset</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">12 Bolsillos (3x4)</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">Para colecciones masivas o jugadores que guardan 4 copias (playset) por fila.</p>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            )}

            {/* --- VISTA 3: EL EDITOR (WORKBENCH) --- */}
            {selectedLayout && (
                <div className="w-full h-full flex flex-col md:flex-row animate-in fade-in zoom-in-[0.99] duration-500">
                    
                    {/* IZQUIERDA: EL LIENZO (CANVAS) */}
                    <div className="flex-1 bg-slate-900/50 relative overflow-y-auto overflow-x-hidden p-4 md:p-8 flex justify-center">
                        <div className="w-full max-w-4xl min-h-full">
                            
                            {/* PAGINA DE EJEMPLO (VACÍA) */}
                            <div className="bg-slate-950 rounded-lg border border-white/10 shadow-2xl p-4 md:p-8 mb-8 relative">
                                <div className="absolute -top-3 left-4 bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                                    Página 1
                                </div>
                                
                                {/* LA CUADRÍCULA REAL */}
                                <div className={`grid ${getGridCols()} gap-3 md:gap-4 aspect-[210/297] w-full max-w-[600px] mx-auto`}>
                                    {[...Array(getSlotsPerPage())].map((_, i) => (
                                        <div key={i} className="relative aspect-[63/88] rounded border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center group cursor-pointer">
                                            <span className="text-slate-600 text-xs font-mono group-hover:text-slate-400">
                                                {i + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* DERECHA: EL DOCK DE CARTAS (POOL) */}
                    <div className="w-full md:w-80 h-1/3 md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-2xl z-20">
                        <div className="p-4 border-b border-white/10 bg-slate-900/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tus Cartas ({albumCards.length})</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar carta..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {loadingCards ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" /></div>
                            ) : filteredCards.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-xs">No hay cartas.</div>
                            ) : (
                                filteredCards.map((card) => (
                                    <div key={card.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10 transition-all">
                                        <div className="w-10 h-14 bg-slate-900 rounded overflow-hidden relative shadow-sm shrink-0">
                                            {card.image ? (
                                                <img src={card.image} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-slate-600"/></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{card.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">#{card.number}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-3 border-t border-white/10 bg-slate-900/50">
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 text-slate-400 flex items-center justify-center gap-2">
                                    <Box size={14} /> Hueco Vacío
                                </button>
                                {/* Futuros botones de herramientas */}
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    </div>
  )
}