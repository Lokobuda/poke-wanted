'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Loader2, LayoutTemplate, ArrowRight, Library, Grid3X3, MousePointerClick } from 'lucide-react'
import { toast } from 'sonner'

export default function PlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)

  // Cargar los álbumes del usuario
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Traemos solo lo necesario: id, nombre, set_id (para la imagen)
        const { data, error } = await supabase
            .from('albums')
            .select('id, name, set_id, created_at')
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

  // --- RENDERIZADO ---

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24 md:p-12 relative overflow-hidden font-sans">
        
        {/* Fondo decorativo sutil */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-900/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
            
            {/* --- CABECERA CON TEXTO EXPLICATIVO --- */}
            <header className="mb-12 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <LayoutTemplate size={12} />
                    <span>Binder Lab Beta</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                    Organiza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Álbum</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
                    Planifica la distribución física de tus cartas antes de meterlas en la carpeta real. 
                    Diseña la estética perfecta, prueba distintas combinaciones, inserta huecos vacíos y visualiza el resultado final sin mover una sola carta.
                </p>
            </header>

            {/* --- PASO 1: SELECCIONAR ÁLBUM --- */}
            {!selectedAlbum ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Library size={20} className="text-violet-500" />
                        1. Selecciona una colección
                    </h2>

                    {albums.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-white/10">
                            <p className="text-slate-500 mb-4">No tienes álbumes creados todavía.</p>
                            <button onClick={() => router.push('/create')} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Crear mi primer álbum</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {albums.map((album) => {
                                const setLogo = album.set_id ? `https://images.pokemontcg.io/${album.set_id}/logo.png` : null
                                
                                return (
                                    <div 
                                        key={album.id}
                                        onClick={() => setSelectedAlbum(album)}
                                        className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-4 text-center"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                            {setLogo ? (
                                                <img src={setLogo} className="w-full h-full object-contain" alt={album.name} />
                                            ) : (
                                                <Library size={24} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors truncate w-full max-w-[200px]">{album.name}</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Click para organizar</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                // --- PASO 2: PRÓXIMAMENTE (CONFIGURACIÓN) ---
                <div className="animate-in fade-in zoom-in-95 duration-300 bg-slate-900 border border-white/10 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-12">
                    <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-violet-400">
                        <Grid3X3 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Has elegido: {selectedAlbum.name}</h2>
                    <p className="text-slate-400 mb-8">
                        Aquí es donde construiremos el lienzo. El siguiente paso será elegir si tu carpeta física es de 4, 9 o 12 bolsillos.
                    </p>
                    <button 
                        onClick={() => setSelectedAlbum(null)}
                        className="text-slate-500 hover:text-white text-sm underline decoration-slate-700 hover:decoration-white underline-offset-4"
                    >
                        Cambiar de álbum
                    </button>
                </div>
            )}
        </div>
    </div>
  )
}