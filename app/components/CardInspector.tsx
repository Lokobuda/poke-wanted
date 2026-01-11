'use client'

import { useEffect, useState } from 'react'
import { X, Trophy, Layers, CheckCircle2, Save, Trash2, ShieldCheck, Loader2, Sparkles, User, Award, Box, Hash } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import Slab from './Slab'

interface CardInspectorProps {
  card: any
  isOpen: boolean
  onClose: () => void
  onSetCover: (card: any) => void
  isCover: boolean
}

const GRADERS = ['PSA', 'BGS', 'CGC', 'TAG', 'ACE', 'PCA', 'AP', 'Otro']

export default function CardInspector({ card, isOpen, onClose, onSetCover, isCover }: CardInspectorProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'GRADED'>('DETAILS')
  const [gradedCards, setGradedCards] = useState<any[]>([])
  const [loadingGraded, setLoadingGraded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({
    grader: 'PSA',
    grade: '10',
    cert_number: '' // Recuperamos el Certificado
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && card) {
        fetchGradedCopies()
        setFormData({ grader: 'PSA', grade: '10', cert_number: '' })
        setActiveTab('DETAILS')
    }
  }, [isOpen, card])

  const fetchGradedCopies = async () => {
      setLoadingGraded(true)
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) return

      const apiId = card.card_id || card.card_variants?.[0]?.card_id || card.card_variants?.card_id || card.id
      let query = supabase.from('graded_cards').select('*').eq('user_id', session.user.id)
      
      if (apiId) {
           query = query.eq('card_id', apiId) 
      } else {
          const name = card.name || card.card_variants?.[0]?.cards?.name
          if(name) query = query.eq('pokemon_name', name)
      }

      const { data } = await query
      setGradedCards(data || [])
      setLoadingGraded(false)
  }

  const handleSaveSlab = async () => {
      setIsSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) return

      const apiId = card.card_id || card.card_variants?.[0]?.card_id || card.card_variants?.card_id || card.id
      const variant = Array.isArray(card.card_variants) ? card.card_variants[0] : card.card_variants
      const cardName = variant?.cards?.name || card.name 
      const setName = variant?.cards?.set_id || card.set_name

      const { error } = await supabase.from('graded_cards').insert({
          user_id: session.user.id,
          card_id: apiId,
          pokemon_name: cardName,
          set_name: setName,
          grading_company: formData.grader,
          grade: parseFloat(formData.grade),
          cert_number: formData.cert_number // Guardamos el certificado
      })

      if (!error) {
          fetchGradedCopies() 
          setFormData(prev => ({ ...prev, cert_number: '' })) // Limpiamos el cert para la siguiente
      } else {
          alert("Error al guardar slab")
      }
      setIsSaving(false)
  }

  const handleDeleteSlab = async (id: string) => {
      if(!confirm("¿Borrar este slab?")) return
      await supabase.from('graded_cards').delete().eq('id', id)
      fetchGradedCopies()
  }

  if (!mounted || !card) return null

  const variant = Array.isArray(card.card_variants) ? card.card_variants[0] : card.card_variants
  const image = variant?.image_url || card.image_url || '/placeholder.png'
  const cardName = variant?.cards?.name || card.name || 'Carta Desconocida'
  const setName = variant?.cards?.set_id || 'Set Desconocido'
  const rarity = variant?.cards?.rarity || 'Common'
  const flavorText = variant?.cards?.flavor_text || "No hay descripción disponible."
  const artist = variant?.cards?.artist || "Unknown"
  const number = variant?.cards?.collector_number || "000"

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200 font-sans text-slate-200">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl border border-white/10 flex overflow-hidden shadow-2xl flex-col md:flex-row">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="w-full md:w-1/2 bg-slate-950/50 p-8 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${activeTab === 'GRADED' ? 'from-amber-900/10' : 'from-violet-900/20'} to-transparent transition-all duration-500`} />
            
            <div className="relative z-10 w-full h-full flex items-center justify-center perspective-1000">
                {activeTab === 'GRADED' ? (
                    <div className="w-[300px] animate-in zoom-in slide-in-from-bottom-4 duration-500">
                        <Slab 
                            slab={{
                                pokemon_name: cardName,
                                set_name: setName,
                                image_url: image,
                                grader: formData.grader,
                                grade: formData.grade,
                                cert_number: formData.cert_number // Pasamos el cert al Slab
                            }}
                            className="drop-shadow-2xl shadow-black/50"
                        />
                        <p className="text-center text-[10px] text-amber-500/50 mt-8 font-mono uppercase tracking-widest animate-pulse">
                            Vista Previa en Vivo
                        </p>
                    </div>
                ) : (
                    <img src={image} className="max-h-[80%] max-w-full object-contain drop-shadow-[0_0_40px_rgba(139,92,246,0.3)] animate-in zoom-in duration-300 hover:scale-105 transition-transform" />
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-900 border-l border-white/5 relative z-20">
            <div className="p-8 border-b border-white/5 flex justify-between items-start bg-slate-900">
                <div>
                    <h2 className="text-3xl font-black text-white leading-none mb-2 tracking-tight">{cardName}</h2>
                    <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{rarity}</span>
                        <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{setName} #{number}</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-slate-400" /></button>
            </div>

            <div className="flex border-b border-white/5 bg-slate-900/50">
                <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'DETAILS' ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5' : 'text-slate-500 hover:text-white'}`}>
                    <Layers size={16} /> Detalles
                </button>
                <button onClick={() => setActiveTab('GRADED')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'GRADED' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-amber-200'}`}>
                    <ShieldCheck size={16} /> Gradeadas ({gradedCards.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {activeTab === 'DETAILS' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {flavorText && (
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 italic text-slate-300 text-sm leading-relaxed relative"><span className="absolute top-2 left-2 text-4xl text-white/5 font-serif">“</span>{flavorText}</div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 p-4 rounded-xl border border-white/5"><div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><User size={12}/> Ilustrador</div><div className="text-white font-medium">{artist}</div></div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-white/5"><div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Sparkles size={12}/> Acabado</div><div className="text-white font-medium">Normal / Holo</div></div>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <button onClick={() => onSetCover(card)} disabled={isCover} className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isCover ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'}`}>
                                {isCover ? <CheckCircle2 size={18} /> : <Trophy size={18} />}{isCover ? 'Portada del Álbum' : 'Usar como Portada'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'GRADED' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {gradedCards.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tus Copias Registradas</h3>
                                {gradedCards.map(slab => (
                                    <div key={slab.id} className="bg-slate-950 p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shadow-lg border ${slab.grading_company === 'PSA' ? 'bg-white text-red-600 border-red-600' : 'bg-black text-[#e6c15c] border-[#e6c15c]'}`}>
                                                {slab.grade}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">{slab.grading_company}</span>
                                                </div>
                                                {/* MOSTRAMOS EL CERTIFICADO EN LA LISTA TAMBIÉN */}
                                                <p className="text-[10px] text-slate-500 font-mono tracking-wide">#{slab.cert_number || '---'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteSlab(slab.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <div className="h-px w-full bg-white/5 my-6"></div>
                            </div>
                        )}

                        <div className="bg-slate-950/30 p-1 rounded-3xl">
                            <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Box size={14} /> Añadir Nueva Copia
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Empresa</label>
                                        <select value={formData.grader} onChange={(e) => setFormData({...formData, grader: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none appearance-none font-bold">
                                            {GRADERS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Nota</label>
                                        <div className="relative">
                                            <input type="number" placeholder="10" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 pl-8 text-xs text-white focus:border-amber-500 focus:outline-none font-mono font-bold" />
                                            <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500" size={12} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* AÑADIMOS EL INPUT DE CERTIFICADO DE VUELTA */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Certificado #</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Ej: 12345678" value={formData.cert_number} onChange={(e) => setFormData({...formData, cert_number: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 pl-8 text-xs text-white focus:border-amber-500 focus:outline-none font-mono" />
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                                    </div>
                                </div>

                                <button onClick={handleSaveSlab} disabled={isSaving} className="w-full mt-2 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    Registrar en Colección
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>

      </div>
    </div>
  )

  if (!isOpen) return null
  return createPortal(content, document.body)
}