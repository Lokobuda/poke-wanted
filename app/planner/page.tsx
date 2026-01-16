'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
    Loader2, LayoutTemplate, Library, Grid3X3, ArrowLeft, 
    CheckCircle2 
} from 'lucide-react'
import { toast } from 'sonner'

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<any[]>([])
  
  // Estados de navegación del planificador
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null) 

  // Cargar los álbumes del usuario
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

  // Función al seleccionar álbum
  const handleSelectAlbum = (album: any) => {
      setSelectedAlbum(album)
      setSelectedLayout(null)
  }

  // Función para guardar el formato
  const handleConfirmLayout = async (layout: string) => {
      setSelectedLayout(layout)
  }

  // --- RENDERIZADO ---

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 md:p-12 relative overflow-hidden font-sans">
        
        {/* Botón Volver */}
        <button 
            onClick={() => {
                if (selectedLayout) setSelectedLayout(null)
                else if (selectedAlbum) setSelectedAlbum(null)
                else router.back()
            }} 
            className="absolute top-6 left-6 z-50 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 pr-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
        >
            <ArrowLeft size={18} />
            <span>Atrás</span>
        </button>

        {/* Fondo decorativo sutil */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-900/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 pt-10">
            
            {/* --- CABECERA DINÁMICA --- */}
            <header className="mb-12 text-center md:text-left animate-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <LayoutTemplate size={12} />
                    <span>Binder Lab Beta</span>
                </div>
                
                {!selectedAlbum ? (
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                        Organiza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Álbum</span>
                    </h1>
                ) : !selectedLayout ? (
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                        Elige tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Carpeta</span>
                    </h1>
                ) : (
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase mb-4">
                        Modo <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Diseño</span>
                    </h1>
                )}

                <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
                    {!selectedAlbum 
                        ? "Planifica la distribución física de tus cartas antes de meterlas en la carpeta real. Diseña la estética perfecta sin mover una sola carta."
                        : !selectedLayout
                            ? `Vamos a organizar "${selectedAlbum.name}". ¿Qué tipo de hojas utiliza tu carpeta física?`
                            : "Arrastra y organiza tus cartas. Recuerda que esto es solo una simulación visual."
                    }
                </p>
            </header>

            {/* --- PASO 1: SELECCIONAR ÁLBUM --- */}
            {!selectedAlbum && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Library size={20} className="text-violet-500" />
                        1. Selecciona una colección
                    </h2>

                    {albums.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-white/10">
                            <p className="text-slate-500 mb-4">No tienes álbumes creados todavía.</p>
                            <button onClick={() => router.push('/create')} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-violet-500 transition-colors">Crear mi primer álbum</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {albums.map((album) => {
                                const setLogo = album.set_id ? `https://images.pokemontcg.io/${album.set_id}/logo.png` : null
                                return (
                                    <div 
                                        key={album.id}
                                        onClick={() => handleSelectAlbum(album)}
                                        className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-4 text-center"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                            {setLogo ? (
                                                <img src={setLogo} className="w-full h-full object-contain drop-shadow-md" alt={album.name} />
                                            ) : (
                                                <Library size={24} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors truncate w-full max-w-[200px]">{album.name}</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold group-hover:text-white transition-colors">Click para organizar</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- PASO 2: SELECCIONAR FORMATO DE CARPETA --- */}
            {selectedAlbum && !selectedLayout && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Grid3X3 size={20} className="text-blue-400" />
                        2. Elige el formato de hoja
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* OPCIÓN 1: 4 POCKET (2x2) */}
                        <div onClick={() => handleConfirmLayout('2x2')} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                            {/* CAMBIO: h-40 para igualar alturas */}
                            <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-2 gap-2 content-center group-hover:border-blue-500/30 transition-colors">
                                {[...Array(4)].map((_, i) => <div key={i} className="bg-white/5 rounded-md border border-white/5 aspect-[3/4]" />)}
                            </div>
                            <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Portafolio</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">4 Bolsillos (2x2)</p>
                            <p className="text-slate-400 text-sm leading-relaxed">Ideal para colecciones pequeñas, intercambios o carpetas de viaje compactas.</p>
                        </div>

                        {/* OPCIÓN 2: 9 POCKET (3x3) - ESTÁNDAR */}
                        <div onClick={() => handleConfirmLayout('3x3')} className="group cursor-pointer relative bg-gradient-to-b from-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-8 hover:border-blue-400 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center text-center ring-1 ring-blue-500/10">
                            <div className="absolute top-4 right-4 bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popular</div>
                            {/* CAMBIO: h-40 para igualar alturas */}
                            <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-3 gap-1.5 content-center group-hover:border-blue-500/30 transition-colors">
                                {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 rounded-sm border border-white/5 aspect-[3/4]" />)}
                            </div>
                            <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Estándar</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">9 Bolsillos (3x3)</p>
                            <p className="text-slate-400 text-sm leading-relaxed">El formato clásico A4. Perfecto para completar sets y ver evoluciones de 3 en 3.</p>
                        </div>

                        {/* OPCIÓN 3: 12 POCKET (3x4) - VERTICAL */}
                        <div onClick={() => handleConfirmLayout('3x4')} className="group cursor-pointer relative bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center">
                            {/* CAMBIO: h-40 para que quepa el playset */}
                            <div className="w-24 h-40 mb-6 bg-slate-950 rounded-xl border border-white/5 p-2 grid grid-cols-3 gap-1 content-center group-hover:border-blue-500/30 transition-colors">
                                {[...Array(12)].map((_, i) => <div key={i} className="bg-white/5 rounded-[2px] border border-white/5 aspect-[3/4]" />)}
                            </div>
                            <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">Playset</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">12 Bolsillos (3x4)</p>
                            <p className="text-slate-400 text-sm leading-relaxed">Para colecciones masivas o jugadores que guardan 4 copias (playset) por fila.</p>
                        </div>

                    </div>
                </div>
            )}

            {/* --- PASO 3: EL LIENZO (FUTURO) --- */}
            {selectedAlbum && selectedLayout && (
                <div className="animate-in fade-in zoom-in-95 duration-500 bg-slate-900/50 border border-dashed border-emerald-500/30 rounded-3xl p-12 text-center mt-8">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Todo listo para empezar</h2>
                    <p className="text-slate-400 mb-6">
                        Has configurado el álbum <strong>{selectedAlbum.name}</strong> con formato <strong>{selectedLayout}</strong>.
                    </p>
                    <p className="text-sm text-slate-500 bg-slate-950 inline-block px-4 py-2 rounded-full border border-white/10">
                        🚧 Lienzo de Drag & Drop en construcción...
                    </p>
                </div>
            )}

        </div>
    </div>
  )
}