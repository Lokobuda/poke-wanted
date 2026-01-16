'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
    Loader2, LayoutTemplate, Library, Grid3X3, ArrowLeft, 
    CheckCircle2, Search, Image as ImageIcon, Box, MonitorSmartphone
} from 'lucide-react'
import { toast } from 'sonner'

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [checkingMobile, setCheckingMobile] = useState(true) // Nuevo estado para evitar parpadeos
  
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null) 
  
  const [albumCards, setAlbumCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Detectar móvil al inicio
  useEffect(() => {
      const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024)
          setCheckingMobile(false)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cargar álbumes (Solo si no es móvil, para ahorrar recursos)
  useEffect(() => {
    if (isMobile) return // No cargamos datos si es móvil

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
              rarity: item.card_variants?.cards?.rarity
          }))

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
  }

  const handleConfirmLayout = async (layout: string) => {
      setSelectedLayout(layout)
  }

  const getGridCols = () => {
      switch(selectedLayout) {
          case '2x2': return 'grid-cols-2'
          case '3x3': return 'grid-cols-3'
          case '3x4': return 'grid-cols-3' 
          default: return 'grid-cols-3'
      }
  }

  const getSlotsPerPage = () => {
      switch(selectedLayout) {
          case '2x2': return 4
          case '3x3': return 9
          case '3x4': return 12
          default: return 9
      }
  }

  const filteredCards = albumCards.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.number.includes(searchQuery)
  )

  // --- VISTA DE BLOQUEO PARA MÓVIL (INMEDIATA Y ABAJO) ---
  // Si estamos comprobando, mostramos loader o nada. Si es móvil, bloqueamos YA.
  if (checkingMobile) return <div className="min-h-screen bg-slate-950" />
  
  if (isMobile) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden">
            
            {/* Fondo decorativo animado para que no sea negro plano */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950 to-slate-950 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-1/4 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            {/* Contenido alineado AL FINAL (bottom) */}
            <div className="flex-1 flex flex-col justify-end p-8 pb-16 relative z-10">
                
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                    <MonitorSmartphone size={36} className="text-violet-400" />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-6 uppercase italic tracking-tighter leading-[0.9]">
                    ¿Quieres<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">organizar</span><br/>
                    tu álbum?
                </h2>
                
                <div className="space-y-4 mb-10">
                    <p className="text-slate-300 text-base leading-relaxed font-medium">
                        El diseño de un binder requiere espacio, perspectiva y mucha calma.
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed border-l-2 border-violet-500/30 pl-4">
                        Hemos creado el <strong>Binder Lab</strong> para disfrutarse en pantalla grande, donde puedes cuidar cada detalle sin limitaciones.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">
                            Te esperamos en el ordenador
                        </p>
                    </div>

                    <button 
                        onClick={() => router.back()} 
                        className="w-full py-4 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Volver al Perfil
                    </button>
                </div>
            </div>
        </div>
      )
  }

  // --- RENDERIZADO DE ESCRITORIO ---
  
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col h-screen overflow-hidden">
        
        {/* --- HEADER --- */}
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

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="flex-1 relative overflow-hidden flex">
            
            {/* VISTA 1 & 2: SELECTORES */}
            {!selectedLayout && (
                <div className="w-full h-full overflow-y-auto p-6 md:p-12">
                     <div className="max-w-6xl mx-auto pt-10">
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
                                <h1 className="text-4xl md:text-5xl font-black text-white uppercase mb-4">
                                    Modo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Diseño</span>
                                </h1>
                            )}

                            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
                                {!selectedAlbum 
                                    ? "Planifica la distribución física de tus cartas antes de meterlas en la carpeta real. Diseña la estética perfecta sin mover una sola carta."
                                    : `Vamos a organizar "${selectedAlbum.name}". ¿Qué tipo de hojas utiliza tu carpeta física?`
                                }
                            </p>
                        </header>

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

            {/* --- VISTA 3: EL EDITOR (PC ONLY) --- */}
            {selectedLayout && !isMobile && (
                <div className="w-full h-full flex flex-row animate-in fade-in zoom-in-[0.99] duration-500">
                    
                    {/* IZQUIERDA: EL LIENZO (CANVAS) */}
                    <div className="flex-1 bg-slate-900/50 p-8 flex items-center justify-center relative overflow-hidden">
                        <div className="relative h-full max-h-full aspect-[210/297] bg-slate-950 rounded-lg border border-white/10 shadow-2xl p-4 md:p-6 flex flex-col">
                            {/* Header de la Hoja */}
                            <div className="absolute -top-3 left-4 bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/5 shadow-sm">
                                Página 1
                            </div>
                            
                            {/* LA CUADRÍCULA REAL (AUTO-ESCALABLE) */}
                            <div className={`grid ${getGridCols()} gap-2 w-full h-full`}>
                                {[...Array(getSlotsPerPage())].map((_, i) => (
                                    <div key={i} className="relative w-full h-full rounded border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center group cursor-pointer overflow-hidden">
                                        <span className="text-slate-600 text-xs font-mono group-hover:text-slate-400">
                                            {i + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DERECHA: EL DOCK DE CARTAS */}
                    <div className="w-80 h-full bg-slate-950 border-l border-white/10 flex flex-col shadow-2xl z-20">
                        <div className="p-4 border-b border-white/10 bg-slate-900/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tus Cartas ({albumCards.length})</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
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
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    </div>
  )
}