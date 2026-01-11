'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Search, Loader2, Plus, Check, Database, ArrowDown } from 'lucide-react'
import Link from 'next/link'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>}>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const albumId = searchParams.get('albumId')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set())
  
  // --- PAGINACIÓN ---
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 50

  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  // Búsqueda con retardo (debounce)
  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(false) // Nueva búsqueda (reset)
      } else {
        setResults([])
        setHasMore(false)
      }
    }, 500)
    return () => clearTimeout(delay)
  }, [query])

  const performSearch = async (isLoadMore = false) => {
    if (!query) return
    
    // Si es "cargar más", no activamos el loading global para no borrar la lista actual
    // Podrías tener un estado 'isLoadingMore' separado si quisieras hilar fino,
    // pero usando 'loading' en el botón es suficiente.
    setLoading(true) 
    
    try {
      const currentPage = isLoadMore ? page + 1 : 0
      const from = currentPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('card_variants')
        .select(`
          id, 
          image_url, 
          card_id,
          cards!inner (
            name, 
            set_id
          )
        `)
        .ilike('cards.name', `%${query}%`)
        .range(from, to) // Paginación: Del X al Y

      if (error) throw error
      
      const rawData = data || []
      
      const formatted = rawData.map((variant: any) => {
        const parts = (variant.card_id || '').split('-')
        const num = parts[parts.length - 1] || '?'
        
        return {
          uuid: variant.id,
          name: variant.cards?.name,
          set_id: variant.cards?.set_id,
          number: num,
          image_url: variant.image_url
        }
      })

      if (isLoadMore) {
        setResults(prev => [...prev, ...formatted])
        setPage(currentPage)
      } else {
        setResults(formatted)
        setPage(0)
      }

      // Si nos traemos menos cartas que el límite, es que ya no hay más
      setHasMore(rawData.length === PAGE_SIZE)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addCardToAlbum = async (item: any) => {
    if (!albumId) return
    setProcessingId(item.uuid)

    try {
      const { error } = await supabase
        .from('album_cards')
        .insert({ album_id: albumId, card_id: item.uuid, acquired: false })

      if (error) throw error
      setAddedCards(prev => new Set(prev).add(item.uuid))
    } catch (error: any) {
      if (error.code === '23505') setAddedCards(prev => new Set(prev).add(item.uuid))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 p-4 shadow-2xl">
        <div className="max-w-3xl mx-auto flex gap-4">
          <Link href={albumId ? `/album/${albumId}` : '/'}>
            <button className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-white/5">
              <ArrowLeft />
            </button>
          </Link>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Escribe para buscar (ej: Charizard)..." 
              className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {!loading && results.length === 0 && !query && (
          <div className="text-center py-20 opacity-50">
            <Database size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">Buscador Listo.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((item) => {
              const isAdded = addedCards.has(item.uuid)
              const isProcessing = processingId === item.uuid
              return (
                <div key={item.uuid} className="bg-slate-900 rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all group relative shadow-lg">
                  <div className="aspect-[0.716] relative bg-slate-950">
                    <img src={item.image_url || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-3 flex items-center justify-between bg-slate-900 border-t border-white/5">
                    <div className="overflow-hidden pr-2">
                      <h3 className="font-bold text-sm truncate text-white">{item.name}</h3>
                      <div className="flex gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <span className="text-violet-400">{item.set_id}</span>
                        <span>#{item.number}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => !isAdded && addCardToAlbum(item)}
                      disabled={isProcessing || isAdded}
                      className={`p-2 rounded-lg transition-all shadow-lg flex-shrink-0 ${isAdded ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : isAdded ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
        
        {/* BOTÓN CARGAR MÁS */}
        {hasMore && (
           <div className="flex justify-center mt-12 mb-8">
             <button 
               onClick={() => performSearch(true)}
               disabled={loading}
               className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all border border-white/10 hover:scale-105"
             >
               {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowDown size={20} />}
               <span>{loading ? 'Cargando...' : 'Cargar más resultados'}</span>
             </button>
           </div>
        )}

        {loading && !hasMore && results.length === 0 && (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-500" size={40} /></div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-10">
             <p className="text-slate-500 text-lg">No encontramos "{query}"</p>
             <p className="text-slate-600 text-sm mt-1">Prueba a escribir el nombre poco a poco.</p>
          </div>
        )}
      </div>
    </div>
  )
}