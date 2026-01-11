'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <div className="p-8 text-center bg-gradient-to-b from-violet-900/20 to-transparent">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Elige tu Compañero</h2>
          <p className="text-slate-400 text-sm">Este Pokémon evolucionará contigo a medida que crezca tu colección.</p>
        </div>

        {/* GEN SELECTOR */}
        <div className="flex items-center justify-between px-4 mb-4">
          <button onClick={prevGen} className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronLeft /></button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">{currentGen.name}</h3>
            <span className="text-xs font-mono text-slate-500">{currentGen.year}</span>
          </div>
          <button onClick={nextGen} className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronRight /></button>
        </div>

        {/* POKEMON GRID */}
        <div className="flex-1 p-8 grid grid-cols-3 gap-6">
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
                  relative cursor-pointer rounded-2xl border-2 transition-all duration-300 group flex flex-col items-center justify-center py-6 gap-4
                  ${isSelected ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-105' : `border-white/5 ${typeColor} opacity-70 hover:opacity-100`}
                `}
              >
                <div className="relative w-24 h-24">
                   <img src={sprite} className="w-full h-full object-contain drop-shadow-xl pixelated rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
                </div>
                
                <div className={`p-2 rounded-full ${isSelected ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-500'}`}>
                   {isSelected ? <Check size={16} strokeWidth={4} /> : <Icon size={16} />}
                </div>
              </div>
            )
          })}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-center">
          <button 
            disabled={!selectedType}
            onClick={handleConfirm}
            className={`
              px-12 py-4 rounded-xl font-black uppercase tracking-widest transition-all
              ${selectedType 
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-900/20 hover:scale-105' 
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