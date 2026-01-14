'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Flame, Droplets, Leaf } from 'lucide-react'
import { STARTER_PATHS } from '../../lib/ranks'

interface StarterSelectorProps {
  isOpen: boolean
  onSelect: (gen: string, type: string) => void
}

const GENERATIONS = [
  { id: 'gen1', name: 'Kanto (Gen 1)', year: '1996' },
  { id: 'gen2', name: 'Johto (Gen 2)', year: '1999' },
  { id: 'gen3', name: 'Hoenn (Gen 3)', year: '2002' },
  { id: 'gen4', name: 'Sinnoh (Gen 4)', year: '2006' },
  { id: 'gen5', name: 'Unova (Gen 5)', year: '2010' },
  { id: 'gen6', name: 'Kalos (Gen 6)', year: '2013' },
  { id: 'gen7', name: 'Alola (Gen 7)', year: '2016' },
  { id: 'gen8', name: 'Galar (Gen 8)', year: '2019' },
  { id: 'gen9', name: 'Paldea (Gen 9)', year: '2022' },
]

export default function StarterSelector({ isOpen, onSelect }: StarterSelectorProps) {
  const [currentGenIndex, setCurrentGenIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  if (!isOpen) return null

  const currentGen = GENERATIONS[currentGenIndex]
  const starters = STARTER_PATHS[currentGen.id]

  const nextGen = () => setCurrentGenIndex(prev => (prev + 1) % GENERATIONS.length)
  const prevGen = () => setCurrentGenIndex(prev => (prev - 1 + GENERATIONS.length) % GENERATIONS.length)

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(currentGen.id, selectedType)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="p-6 text-center bg-gradient-to-b from-violet-900/20 to-transparent shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-1">Elige tu Compañero</h2>
          <p className="text-slate-400 text-xs md:text-sm">Este Pokémon evolucionará contigo.</p>
        </div>

        {/* GEN SELECTOR */}
        <div className="flex items-center justify-between px-4 mb-2 shrink-0">
          <button onClick={prevGen} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronLeft /></button>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">{currentGen.name}</h3>
            <span className="text-[10px] font-mono text-slate-500">{currentGen.year}</span>
          </div>
          <button onClick={nextGen} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronRight /></button>
        </div>

        {/* POKEMON GRID - CON SCROLL SI ES NECESARIO */}
        <div className="flex-1 p-4 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-y-auto">
          {['grass', 'fire', 'water'].map((type) => {
            const isSelected = selectedType === type
            const sprite = starters[type].basic
            
            let typeColor = 'bg-slate-800'
            let Icon = Leaf
            if (type === 'fire') { typeColor = 'hover:bg-orange-900/30 hover:border-orange-500/50'; Icon = Flame }
            if (type === 'water') { typeColor = 'hover:bg-blue-900/30 hover:border-blue-500/50'; Icon = Droplets }
            if (type === 'grass') { typeColor = 'hover:bg-emerald-900/30 hover:border-emerald-500/50'; Icon = Leaf }

            return (
              <div 
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  relative cursor-pointer rounded-2xl border-2 transition-all duration-300 group flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4 sm:py-6 gap-4
                  ${isSelected ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-[1.02]' : `border-white/5 ${typeColor} opacity-70 hover:opacity-100`}
                `}
              >
                <div className="relative w-16 h-16 sm:w-24 sm:h-24">
                   <img src={sprite} className="w-full h-full object-contain drop-shadow-xl pixelated rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
                </div>
                
                <div className={`p-2 rounded-full ${isSelected ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-500'}`}>
                   {isSelected ? <Check size={16} strokeWidth={4} /> : <Icon size={16} />}
                </div>
              </div>
            )
          })}
        </div>

        {/* FOOTER SIEMPRE VISIBLE */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex justify-center shrink-0 safe-bottom">
          <button 
            disabled={!selectedType}
            onClick={handleConfirm}
            className={`
              w-full md:w-auto px-12 py-4 rounded-xl font-black uppercase tracking-widest transition-all text-xs md:text-sm
              ${selectedType 
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-900/20 hover:scale-105 active:scale-95' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            Confirmar Elección
          </button>
        </div>

      </div>
    </div>
  )
}