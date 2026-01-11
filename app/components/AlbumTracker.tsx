'use client'

import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Layers, Grid } from 'lucide-react'
import PokemonCard from './PokemonCard'

export default function AlbumTracker({ initialCards }: { initialCards: any[] }) {
  const [mode, setMode] = useState<'SET' | 'MASTER'>('SET')
  
  // INICIALIZACIÓN
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    initialCards.forEach(card => {
      // Adaptamos la lectura de "acquired" por si viene de distintas tablas
      if (card.isAcquired || card.acquired) ids.add(card.id)
    })
    return ids
  })

  // CÁLCULOS PROGRESO
  // Usamos un Set para contar nombres únicos (evita duplicados si hay variantes)
  const uniqueNamesCount = new Set(initialCards.map(c => c.cards?.name || c.name)).size
  
  const totalCards = mode === 'MASTER' 
    ? initialCards.length 
    : uniqueNamesCount

  const currentCount = mode === 'MASTER'
    ? ownedIds.size
    : new Set(initialCards.filter(c => ownedIds.has(c.id)).map(c => c.cards?.name || c.name)).size

  const progress = totalCards > 0 ? Math.round((currentCount / totalCards) * 100) : 0

  // EFECTO CONFETI
  useEffect(() => {
    if (progress === 100 && totalCards > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa', '#e879f9', '#ffffff'] });
    }
  }, [progress, totalCards])

  // LÓGICA MARCAR/DESMARCAR
  const toggleCard = (id: string) => {
    const newSet = new Set(ownedIds)
    if (newSet.has(id)) {
        newSet.delete(id)
    } else {
        newSet.add(id)
    }
    setOwnedIds(newSet)
    // Aquí iría la lógica de guardar en BD si fuera necesaria en este componente
  }

  return (
    <div className="w-full pb-20">
      {/* BARRA DE CONTROL */}
      <div className="sticky top-[75px] z-30 w-full px-4 mb-8">
        <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-6">
            
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => setMode('SET')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                  mode === 'SET' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Grid size={12} /> SET
              </button>
              <button
                onClick={() => setMode('MASTER')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                  mode === 'MASTER' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Layers size={12} /> MASTER
              </button>
            </div>

            <div className="flex-1 w-full">
              <div className="flex justify-between text-[10px] font-black tracking-[0.2em] mb-2 text-slate-500">
                <span>PROGRESO</span>
                <span className={progress === 100 ? 'text-green-400' : 'text-violet-400'}>
                  {currentCount} / {totalCards} ({progress}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out relative ${
                    progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
                  }`}
                  style={{ width: `${progress}%` }}
                >
                   <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            <div className={`shrink-0 transition-all duration-500 ${progress === 100 ? 'text-yellow-400 scale-125 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-700'}`}>
              <Trophy size={24} />
            </div>
        </div>
      </div>

      {/* GRID DE CARTAS */}
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {initialCards.map((variant) => {
          const isOwned = ownedIds.has(variant.id)
          
          // ADAPTADOR: Creamos un objeto que PokemonCard pueda entender
          // (Mezclamos los datos originales con el estado 'owned' actual)
          const displayCard = {
             ...variant,
             acquired_normal: isOwned, // Simulamos que si la tienes, es la versión normal
             acquired: isOwned,
             // Aseguramos que tenga la estructura de variantes que espera el componente
             card_variants: variant.card_variants || [variant] 
          }

          return (
            <PokemonCard 
              key={variant.id} 
              card={displayCard} 
              // Mapeamos el click a tu función local
              onToggleStatus={() => toggleCard(variant.id)} 
              isMasterSet={mode === 'MASTER'}
              isEditing={false} // En modo tracker no solemos querer borrar cartas
            />
          )
        })}
      </div>
    </div>
  )
}