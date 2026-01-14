'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Loader2, Search, ShieldCheck, Trash2, Gem } from 'lucide-react'
import AddSlabModal from '@/app/components/AddSlabModal' 
import ConfirmModal from '../components/ConfirmModal'
import Slab from '@/app/components/Slab' 

export default function GradedPage() {
  const [loading, setLoading] = useState(true)
  const [slabs, setSlabs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrader, setFilterGrader] = useState<string>('TODAS')
  const [filterGradeNum, setFilterGradeNum] = useState<string>('CUALQUIER NOTA')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [slabToDelete, setSlabToDelete] = useState<string | null>(null)

  useEffect(() => { fetchSlabs() }, [])

  const fetchSlabs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rawSlabs, error } = await supabase.from('graded_cards').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      if (error) throw error
      if (!rawSlabs) { setSlabs([]); return }
      
      const variantIds = rawSlabs.map(s => s.card_id).filter(Boolean)
      let variantsMap: Record<string, any> = {}
      if (variantIds.length) {
          const { data } = await supabase.from('card_variants').select('id, card_id, image_url').in('id', variantIds)
          data?.forEach(v => variantsMap[v.id] = v)
      }
      
      const cardIds = Object.values(variantsMap).map((v: any) => v.card_id).filter(Boolean)
      let cardsMap: Record<string, any> = {}
      if (cardIds.length) {
          const { data } = await supabase.from('cards').select('id, name, set_id').in('id', cardIds)
          data?.forEach(c => cardsMap[c.id] = c)
      }

      setSlabs(rawSlabs.map(item => {
          const v = item.card_id ? variantsMap[item.card_id] : null
          const c = v?.card_id ? cardsMap[v.card_id] : null
          return {
              id: item.id,
              pokemon_name: item.pokemon_name || c?.name,
              set_name: item.set_name || 'Set Unknown',
              grader: item.grading_company,
              grade: item.grade,
              cert_number: item.cert_number,
              image_url: item.custom_image_url || v?.image_url,
              purchase_price: item.purchase_price
          }
      }))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleDelete = async () => {
      if(!slabToDelete) return
      const { error } = await supabase.from('graded_cards').delete().eq('id', slabToDelete)
      if(!error) setSlabs(prev => prev.filter(s => s.id !== slabToDelete))
      setSlabToDelete(null)
  }

  const filteredSlabs = useMemo(() => slabs.filter(s => {
      const matchG = filterGrader === 'TODAS' || s.grader === filterGrader
      const matchGradeNum = filterGradeNum === 'CUALQUIER NOTA' || s.grade?.toString() === filterGradeNum
      const q = searchQuery.toLowerCase()
      const name = s.pokemon_name || ''
      const set = s.set_name || ''
      const matchSearch = name.toLowerCase().includes(q) || set.toLowerCase().includes(q)
      return matchG && matchGradeNum && matchSearch
  }), [slabs, filterGrader, filterGradeNum, searchQuery])

  const availableGraders = ['TODAS', 'PSA', 'BGS', 'CGC', 'TAG']
  const availableGrades = ['CUALQUIER NOTA', '10', '9.5', '9', '8.5', '8']

  if (loading) return <div className="min-h-screen bg-[#020205] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>

  return (
    <div className="min-h-screen bg-[#020205] pb-20 font-sans text-white">
      
      {/* HEADER RESPONSIVE */}
      <div className="sticky top-0 z-40 bg-[#020205]/90 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            
            {/* TÍTULO Y BOTÓN ATRÁS */}
            <div className="flex items-center gap-3 w-full xl:w-auto">
                <Link href="/profile"><button className="p-2 rounded-full hover:bg-white/5 transition-colors"><ArrowLeft size={20} className="text-slate-400" /></button></Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-wider text-amber-400 flex items-center gap-2 drop-shadow-sm">
                         <Gem className="text-amber-400 fill-amber-400/20" size={20} strokeWidth={2} /> 
                         CÁMARA ACORAZADA
                    </h1>
                </div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full xl:w-auto xl:justify-end overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <div className="flex bg-[#0f0f13] border border-white/5 rounded-full p-1 shrink-0">
                    {availableGraders.map(grader => (
                        <button 
                            key={grader}
                            onClick={() => setFilterGrader(grader)}
                            className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                filterGrader === grader 
                                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {grader}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        value={filterGradeNum}
                        onChange={(e) => setFilterGradeNum(e.target.value)}
                        className="bg-[#0f0f13] border border-white/5 rounded-full py-1.5 pl-3 pr-8 text-[9px] md:text-[10px] font-bold text-slate-300 uppercase focus:outline-none focus:border-amber-500/50 flex-1 md:flex-none"
                    >
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input 
                            type="text" 
                            placeholder="BUSCAR..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0f0f13] border border-white/5 rounded-full py-1.5 pl-8 pr-4 text-[9px] md:text-[10px] text-white font-bold uppercase focus:outline-none focus:border-amber-500/50 w-full md:w-32 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8">
        {filteredSlabs.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-30"><ShieldCheck size={48} /><p className="mt-4 text-sm font-mono">SIN DATOS</p></div>
        ) : (
            // GRID RESPONSIVE
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                {filteredSlabs.map((slab) => (
                    <div key={slab.id} className="relative group/wrapper z-0 hover:z-10">
                        <Slab slab={slab} />
                        
                        <button 
                            onClick={() => setSlabToDelete(slab.id)}
                            className="absolute top-2 right-2 md:top-4 md:right-4 z-[100] bg-red-500/80 text-white p-1.5 rounded-full md:opacity-0 group-hover/wrapper:opacity-100 transition-all hover:bg-red-600 backdrop-blur-md"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <AddSlabModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchSlabs} />
      <ConfirmModal isOpen={!!slabToDelete} onClose={() => setSlabToDelete(null)} onConfirm={handleDelete} title="Eliminar" description="¿Seguro?" confirmText="Sí" variant="danger" />
    </div>
  )
}