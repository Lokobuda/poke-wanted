'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Search, Save, Loader2, Check, Plus, ArrowDown, Info, ArrowLeft, Crown, Zap, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import TutorialOverlay, { TutorialStep } from '../components/TutorialOverlay'
import { STARTER_PATHS } from '../../lib/ranks'

// --- PASOS DEL TUTORIAL ---
const CREATE_STEPS: TutorialStep[] = [
  {
    targetId: 'tour-create-input',
    title: 'El Origen 🥚',
    text: 'Todo empieza con un nombre. ¿Cómo vas a bautizar a tu colección? (Ej: "Mis Favoritas", "151 Master Set", "Charizards").',
    action: 'Siguiente',
    position: 'bottom'
  },
  {
    targetId: 'tour-modes',
    title: 'Elige tu Camino 🗺️',
    text: '• OFICIAL: Bases de datos reales (Sets completos).\n• MANUAL: Libertad total, sube lo que quieras.\n• SMART: Colecciones automáticas (Ej: Todo Gengar).',
    action: '¡Mola!',
    position: 'bottom'
  },
  {
    targetId: 'tour-save-btn',
    title: 'Cierra el Trato ✍️',
    text: 'Cuando tengas el nombre y el modo, pulsa aquí. Se creará tu álbum y podrás empezar a marcar cartas inmediatamente.',
    action: 'Casi listo...',
    position: 'top'
  },
  {
    targetId: 'tour-save-btn',
    title: '🤫 Secretos por descubrir',
    text: 'Aún queda algún secreto por descubrir, como la info oculta de las cartas o cómo añadir joyas gradeadas a tu Cámara Acorazada... pero queremos dejarte un poco de misterio para que lo vayas descubriendo tú mismo.',
    action: '¡A coleccionar!',
    position: 'center'
  }
]

const PriceBadge = ({ price }: { price: number | null }) => {
  const hasPrice = price !== null && price !== undefined && price > 0;
  const formattedPrice = hasPrice 
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
    : '---';

  return (
    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5 z-10 shadow-sm">
      <span className={`text-xs font-bold ${hasPrice ? 'text-white' : 'text-slate-400'}`}>
        {formattedPrice}
      </span>
      <div className="group relative">
        <Info size={10} className="text-slate-400 cursor-help hover:text-white transition-colors" />
        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          Precio ref. Cardmarket (Ver. Inglés). Puede variar por idioma/estado.
        </div>
      </div>
    </div>
  )
}

const Toast = ({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer) }, [onClose])
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${type === 'error' ? 'bg-red-950/90 border-red-500' : 'bg-green-950/90 border-green-500'} backdrop-blur-md`}>
        <span className="text-white font-bold text-sm">{message}</span>
      </div>
    </div>
  )
}

type CardVariant = { 
  id: string; 
  image_url: string; 
  cards: { name: string; set_id: string; price_trend: number | null; price_currency: string; } 
}
type SetData = { id: string; name: string; release_date: string }
type CollectionMode = 'OFFICIAL' | 'MANUAL' | 'SMART'

export default function CreateAlbumPage() {
  const router = useRouter()
  
  // ESTADOS
  const [checkingPerms, setCheckingPerms] = useState(true)
  const [canCreate, setCanCreate] = useState(true)
  const [userStatus, setUserStatus] = useState<'INDIE' | 'GYM'>('INDIE')
  const [currentAlbums, setCurrentAlbums] = useState(0)

  // ESTADOS APP
  const [mode, setMode] = useState<CollectionMode>('OFFICIAL')
  const [albumName, setAlbumName] = useState('')
  const [user, setUser] = useState<any>(null)
  
  // TUTORIAL
  const [showTutorial, setShowTutorial] = useState(false)
  const [buddyImage, setBuddyImage] = useState<string | null>(null)
  
  const [searchResults, setSearchResults] = useState<CardVariant[]>([])
  const [setsResults, setSetsResults] = useState<SetData[]>([])
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [selectedSet, setSelectedSet] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toastData, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)

  const [page, setPage] = useState(0)
  const [setsPage, setSetsPage] = useState(0)
  const [hasMoreSets, setHasMoreSets] = useState(false)
  const [hasMoreCards, setHasMoreCards] = useState(false)
  
  const pageSize = 50
  
  // --- LÍMITE REAL DE ÁLBUMES ---
  const FREE_LIMIT = 1

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    if (mode === 'OFFICIAL' && canCreate && !checkingPerms) { 
        fetchSets(true) 
    } else { 
        setSearchResults([])
        setSearchQuery('') 
    }
  }, [mode, canCreate, checkingPerms])

  const checkPermissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const status = profile?.subscription_status === 'GYM' ? 'GYM' : 'INDIE'
      setUserStatus(status)

      if (profile && profile.starter_gen && profile.starter_type) {
         let genKey = profile.starter_gen.startsWith('gen') ? profile.starter_gen : `gen${profile.starter_gen}`
         const pathObj = STARTER_PATHS[genKey]?.[profile.starter_type]
         const img = pathObj?.['novice'] || (pathObj ? Object.values(pathObj)[0] : null)
         setBuddyImage(img)
      }

      // --- CONTEO DIRECTO ---
      const { count } = await supabase
        .from('albums')
        .select('id', { count: 'exact' }) // Sin head:true para evitar errores
        .eq('user_id', session.user.id)
      
      const totalAlbums = count || 0
      setCurrentAlbums(totalAlbums)

      const tutorialPhase = localStorage.getItem('tutorial_phase')
      
      // Permitir si es GYM, Tutorial, o tiene menos de 1 álbum.
      const allowCreate = status === 'GYM' || totalAlbums < FREE_LIMIT || tutorialPhase === 'creating'
      setCanCreate(allowCreate)

      if (tutorialPhase === 'creating') {
          setTimeout(() => setShowTutorial(true), 500)
      }

    } catch (error) {
      console.error(error)
    } finally {
      setCheckingPerms(false)
    }
  }

  const fetchSets = async (reset = false) => {
    setIsSearching(true)
    const currentPage = reset ? 0 : setsPage
    const from = currentPage * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase.from('sets').select('id, name, release_date').order('release_date', { ascending: false }).range(from, to)
    if (!error) {
      const newSets = data as any[]
      if (reset) { setSetsResults(newSets); setSetsPage(1) } 
      else { setSetsResults(prev => [...prev, ...newSets]); setSetsPage(prev => prev + 1) }
      setHasMoreSets(newSets.length === pageSize)
    }
    setIsSearching(false)
  }

  const fetchCards = async (reset = false) => {
    if (searchQuery.length < 2 && !reset) return
    setIsSearching(true)
    const currentPage = reset ? 0 : page
    const from = currentPage * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase.from('card_variants').select(`id, image_url, cards!inner(name, set_id, price_trend, price_currency)`).ilike('cards.name', `%${searchQuery}%`).range(from, to)
    if (!error) {
      const newCards = data as any[]
      if (reset) { setSearchResults(newCards); setPage(1) } 
      else { setSearchResults(prev => [...prev, ...newCards]); setPage(prev => prev + 1) }
      setHasMoreCards(newCards.length === pageSize)
    }
    setIsSearching(false)
  }

  useEffect(() => {
    if(mode !== 'OFFICIAL') {
      const delay = setTimeout(() => { if(searchQuery.length >= 2) fetchCards(true) }, 500)
      return () => clearTimeout(delay)
    }
  }, [searchQuery])

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedCards); newSet.has(id) ? newSet.delete(id) : newSet.add(id); setSelectedCards(newSet)
  }

  const handleSaveAlbum = async () => {
    if (!user) return setToast({ msg: 'Inicia sesión primero', type: 'error' })
    if (!albumName.trim()) return setToast({ msg: 'Ponle nombre al álbum', type: 'error' })

    setIsSaving(true)
    try {
      const { data: albumData, error: albumError } = await supabase.from('albums').insert({ user_id: user.id, name: albumName, is_master_set: mode === 'OFFICIAL', set_id: mode === 'OFFICIAL' ? selectedSet : null }).select().single()
      if (albumError) throw albumError
      if (!albumData) throw new Error("No se pudo crear el álbum")

      let cardsToInsert: any[] = []
      if (mode === 'OFFICIAL') {
        if (!selectedSet) throw new Error("Selecciona un Set")
        const { data: allSetCards } = await supabase.from('card_variants').select('id, cards!inner(set_id)').eq('cards.set_id', selectedSet)
        if (!allSetCards?.length) throw new Error("El set está vacío en la base de datos")
        cardsToInsert = allSetCards.map(c => ({ album_id: albumData.id, card_id: c.id, acquired: false }))
      } else if (mode === 'MANUAL') {
        if (selectedCards.size === 0) throw new Error("Selecciona al menos una carta")
        cardsToInsert = Array.from(selectedCards).map(id => ({ album_id: albumData.id, card_id: id, acquired: false }))
      } else if (mode === 'SMART') {
        if (searchResults.length === 0) throw new Error("Busca cartas primero")
        cardsToInsert = searchResults.map(c => ({ album_id: albumData.id, card_id: c.id, acquired: false }))
      }

      if (cardsToInsert.length > 0) {
        const BATCH_SIZE = 100
        for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
          const chunk = cardsToInsert.slice(i, i + BATCH_SIZE)
          const { error: insertError } = await supabase.from('album_cards').insert(chunk)
          if (insertError) throw new Error("Error guardando cartas")
        }
      }

      if (localStorage.getItem('tutorial_phase') === 'creating') {
          localStorage.removeItem('tutorial_phase')
          localStorage.setItem('tutorial_completed', 'true')
          await supabase.from('profiles').update({ has_completed_tutorial: true }).eq('id', user.id)
          setToast({ msg: '¡Tutorial completado!', type: 'success' })
      } else {
          setToast({ msg: '¡Colección creada con éxito!', type: 'success' })
      }
      
      setTimeout(() => router.push(`/album/${albumData.id}`), 1000)

    } catch (error: any) { console.error(error); setToast({ msg: error.message, type: 'error' }) } 
    finally { setIsSaving(false) }
  }

  if (checkingPerms) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>

  // --- AQUÍ ESTÁ LA PANTALLA DE BLOQUEO CORREGIDA ---
  if (!canCreate) { 
      return ( 
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center text-center font-sans">
            <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* MODIFICACIÓN IMPORTANTE: 
                   1. Quitamos 'overflow-hidden' del contenedor principal para que la corona sobresalga.
                   2. Añadimos un div interno (absolute inset-0) que SÍ tiene 'overflow-hidden' para gestionar el fondo desenfocado.
                */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center relative">
                    
                    {/* FONDO RECORTADO (Para que la mancha de luz no se salga, pero la corona sí) */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full"/>
                    </div>
                    
                    {/* CONTENIDO (La corona ahora flota libremente gracias al z-index y a que el padre no corta) */}
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mx-auto -mt-16 mb-6 flex items-center justify-center shadow-lg shadow-amber-900/40 rotate-3 transform hover:rotate-6 transition-transform">
                            <Crown className="text-white drop-shadow-md" size={40} strokeWidth={2.5} />
                        </div>

                        <h1 className="text-2xl font-black text-white italic tracking-tight mb-2 uppercase">Límite Alcanzado</h1>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Has utilizado tu <span className="text-white font-bold">ranura de creación gratuita</span>. Para añadir más colecciones, necesitas el pase PRO.
                        </p>

                        <div className="bg-slate-950/50 rounded-xl p-5 mb-8 text-left space-y-3 border border-white/5">
                            {/* LISTA DE BENEFICIOS ACTUALIZADA */}
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span className="text-slate-200 text-xs font-medium">Álbumes ilimitados</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span className="text-slate-200 text-xs font-medium">Acceso a la Cámara acorazada</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span className="text-slate-200 text-xs font-medium">Acceso al Almacén sellado</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => router.push('/profile?open_pro=true')} className="w-full group relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-900/20 overflow-hidden flex items-center justify-center gap-2">
                                <Zap size={18} fill="currentColor" /> DESBLOQUEAR PRO
                            </button>
                            <Link href="/profile">
                                <button className="w-full py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                    <ArrowLeft size={14} /> VOLVER A MI COLECCIÓN
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div> 
      ) 
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-40 text-white font-sans">
      {toastData && <Toast message={toastData.msg} type={toastData.type} onClose={() => setToast(null)} />}
      
      {showTutorial && (
          <TutorialOverlay 
             steps={CREATE_STEPS} 
             onComplete={() => setShowTutorial(false)} 
             onClose={() => setShowTutorial(false)} 
          />
      )}

      <div className="sticky top-[60px] z-40 bg-slate-900/90 backdrop-blur border-b border-white/10 p-6">
         <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6 items-center">
            <Link href="/profile">
              <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>

            <div className="flex-1 w-full" id="tour-create-input">
               <input type="text" placeholder="Ponle nombre 😉" className="bg-transparent text-3xl md:text-5xl font-black text-white w-full outline-none placeholder:text-slate-700" value={albumName} onChange={(e)=>setAlbumName(e.target.value)}/>
            </div>
            
            <div id="tour-modes" className="flex bg-slate-950 p-1 rounded-xl border border-white/10">
               <button onClick={()=>setMode('OFFICIAL')} className={`px-4 py-2 rounded-lg text-xs font-bold ${mode==='OFFICIAL'?'bg-violet-600 text-white':'text-slate-500'}`}>OFICIAL</button>
               <button onClick={()=>setMode('MANUAL')} className={`px-4 py-2 rounded-lg text-xs font-bold ${mode==='MANUAL'?'bg-slate-700 text-white':'text-slate-500'}`}>MANUAL</button>
               <button onClick={()=>setMode('SMART')} className={`px-4 py-2 rounded-lg text-xs font-bold ${mode==='SMART'?'bg-indigo-600 text-white':'text-slate-500'}`}>SMART</button>
            </div>
            
            {mode !== 'OFFICIAL' && (
              <div className="relative bg-slate-800 rounded-lg flex items-center px-4 py-2 w-full xl:w-96 border border-white/5 focus-within:border-violet-500/50 transition-colors">
                 <Search size={18} className="text-slate-500 mr-2"/>
                 <input type="text" placeholder="Buscar..." className="bg-transparent text-white w-full outline-none" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
              </div>
            )}
         </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
         {mode === 'OFFICIAL' && (
           <>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {setsResults.map(set => {
                  const logo = `https://images.pokemontcg.io/${set.id}/logo.png`
                  return (
                    <div key={set.id} onClick={()=>{setSelectedSet(set.id); if(!albumName) setAlbumName(set.name)}} className={`h-40 bg-slate-900 border rounded-2xl p-6 cursor-pointer flex items-center justify-center relative transition-all hover:scale-105 ${selectedSet===set.id ? 'border-violet-500 ring-1 ring-violet-500 bg-slate-800' : 'border-white/5 hover:border-white/20'}`}>
                       <img src={logo} className="max-w-full max-h-full object-contain drop-shadow-lg" onError={(e)=>{e.currentTarget.style.display='none'}}/>
                       {selectedSet===set.id && <div className="absolute top-2 right-2 bg-violet-500 text-white p-1 rounded-full shadow-lg"><Check size={12}/></div>}
                    </div>
                  )
               })}
             </div>
             {hasMoreSets && ( <div className="flex justify-center mt-12"><button onClick={() => fetchSets(false)} disabled={isSearching} className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all border border-white/10 hover:scale-105 disabled:opacity-50">{isSearching ? <Loader2 className="animate-spin" /> : <ArrowDown />}<span>Cargar más Sets</span></button></div> )}
           </>
         )}

         {mode !== 'OFFICIAL' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-6">
                 {searchResults.map(card => {
                    const selected = selectedCards.has(card.id); const price = card.cards.price_trend;
                    return (
                      <div key={card.id} onClick={()=>{if(mode==='MANUAL') toggleSelection(card.id)}} className={`aspect-[0.716] bg-slate-900 rounded-xl overflow-hidden relative cursor-pointer transition-all hover:scale-105 ${selected?'ring-4 ring-violet-500 shadow-violet-900/50 shadow-lg':''}`}>
                         <img src={card.image_url} className={`w-full h-full object-cover ${selected?'':'opacity-80 hover:opacity-100'}`} loading="lazy"/>
                         <PriceBadge price={price} />
                         {mode==='MANUAL' && <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${selected?'bg-violet-500 text-white':'bg-black/50 text-white backdrop-blur'}`}>{selected?<Check size={14}/>:<Plus size={14}/>}</div>}
                      </div>
                    )
                 })}
              </div>
              {hasMoreCards && ( <div className="flex justify-center mt-12"><button onClick={() => fetchCards(false)} disabled={isSearching} className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all border border-white/10 hover:scale-105 disabled:opacity-50">{isSearching ? <Loader2 className="animate-spin" /> : <ArrowDown />}<span>Cargar más Cartas</span></button></div> )}
           </>
         )}
         <div className="h-40"></div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
         <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 font-bold uppercase">Selección</span>
               <span className="text-xl font-black text-white">{mode==='OFFICIAL'?(selectedSet?'1 SET':'-'):(mode==='SMART'?'AUTO':selectedCards.size)}</span>
               {userStatus === 'INDIE' && <span className="text-[9px] text-orange-400 font-mono">CAPACIDAD: {currentAlbums}/{FREE_LIMIT}</span>}
            </div>
            
            {/* ID DEL BOTÓN PARA EL TUTORIAL */}
            <button id="tour-save-btn" onClick={handleSaveAlbum} disabled={isSaving} className="bg-white text-black font-bold py-2 px-6 rounded-full flex items-center gap-2 hover:bg-violet-50 hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:scale-100">
               {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>}<span>{isSaving?'Guardando...':'Crear Álbum'}</span>
            </button>
         </div>
      </div>
    </div>
  )
}