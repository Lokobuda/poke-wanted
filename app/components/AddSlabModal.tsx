'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, ShieldCheck, Image as ImageIcon, Link as LinkIcon, DollarSign, Hash, Award, Box } from 'lucide-react'
import { toast } from 'sonner'
import Slab from './Slab' 

// AÑADIMOS 'initialData' A LAS PROPS
interface AddSlabModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: {
    name?: string
    set_name?: string
    image_url?: string
  }
}

const GRADERS = ['PSA', 'BGS', 'CGC', 'TAG', 'ACE', 'PCA', 'AP', 'Otro']

export default function AddSlabModal({ isOpen, onClose, onSuccess, initialData }: AddSlabModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    pokemon_name: '',
    set_name: '',
    grader: 'PSA',
    grade: '10',
    cert_number: '',
    image_url: '',
    purchase_price: ''
  })

  // EFECTO MÁGICO: Cuando se abre el modal, pre-cargamos los datos si existen
  useEffect(() => {
    if (isOpen && initialData) {
        setFormData(prev => ({
            ...prev,
            pokemon_name: initialData.name || '',
            set_name: initialData.set_name || '',
            image_url: initialData.image_url || '',
            // Reseteamos el resto por seguridad
            grader: 'PSA',
            grade: '10',
            cert_number: '',
            purchase_price: ''
        }))
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No sesión')

      let finalPrice = null
      if (formData.purchase_price) {
          finalPrice = parseFloat(formData.purchase_price.replace(',', '.'))
      }

      const { error } = await supabase.from('graded_cards').insert({
        user_id: session.user.id,
        pokemon_name: formData.pokemon_name,
        set_name: formData.set_name,
        purchase_price: finalPrice,
        grading_company: formData.grader,
        grade: parseFloat(formData.grade),
        cert_number: formData.cert_number,
        custom_image_url: formData.image_url || null,
        card_id: null 
      })

      if (error) throw error

      toast.success('Joya añadida a la cámara acorazada')
      onSuccess()
      onClose()
      
      // Limpiamos al cerrar
      setFormData({
        pokemon_name: '', set_name: '', grader: 'PSA', grade: '10', 
        cert_number: '', image_url: '', purchase_price: ''
      })

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-[#09090b] border border-white/10 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[650px]">
        
        {/* --- COLUMNA IZQUIERDA: VISTA PREVIA --- */}
        <div className="w-full md:w-[45%] bg-[#020205] border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            
            <div className="absolute top-6 left-6 flex items-center gap-2 opacity-40 z-20">
                <ShieldCheck size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">VISTA PREVIA EN VIVO</span>
            </div>

            {/* PREVIEW DEL SLAB */}
            <div className="relative z-10 w-[85%] max-w-[340px] perspective-1000">
                <Slab 
                    slab={{
                        pokemon_name: formData.pokemon_name || 'NOMBRE POKÉMON', // Fallback visual
                        set_name: formData.set_name || 'SET NAME',
                        image_url: formData.image_url,
                        grader: formData.grader,
                        grade: formData.grade,
                        cert_number: formData.cert_number
                    }} 
                    className="drop-shadow-2xl"
                />
            </div>
            
            {/* Texto decorativo abajo si falta la imagen (como en tu captura) */}
            {!formData.image_url && (
                <div className="absolute bottom-10 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    Vista Previa Digital
                </div>
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-800/20 blur-[150px] pointer-events-none rounded-full opacity-40"></div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO --- */}
        <div className="flex-1 flex flex-col bg-[#09090b] relative z-20">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#09090b]/50 backdrop-blur-md">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Box className="text-amber-500" size={18} /> 
                    Nueva Entrada Manual
                </h2>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar relative">
                
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Nombre de la Carta <span className="text-amber-500">*</span></label>
                        <input type="text" placeholder="Ej: Charizard 1st Edition" value={formData.pokemon_name} onChange={(e) => setFormData({...formData, pokemon_name: e.target.value})} className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:outline-none transition-all placeholder:text-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Set / Expansión</label>
                        <input type="text" placeholder="Ej: Base Set 1999" value={formData.set_name} onChange={(e) => setFormData({...formData, set_name: e.target.value})} className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:outline-none transition-all placeholder:text-slate-700" />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4 bg-[#121214]/50 p-4 rounded-2xl border border-white/5">
                    <div className="col-span-12 md:col-span-4 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Empresa</label>
                        <select value={formData.grader} onChange={(e) => setFormData({...formData, grader: e.target.value})} className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none appearance-none font-bold">
                            {GRADERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="col-span-6 md:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Nota</label>
                        <div className="relative">
                            <input type="number" placeholder="10" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 pl-9 text-sm text-white focus:border-amber-500 focus:outline-none font-mono font-bold" />
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={14} />
                        </div>
                    </div>
                    <div className="col-span-6 md:col-span-5 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Certificado #</label>
                        <div className="relative">
                            <input type="text" placeholder="Ej: 12345678" value={formData.cert_number} onChange={(e) => setFormData({...formData, cert_number: e.target.value})} className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 pl-9 text-sm text-white focus:border-amber-500 focus:outline-none font-mono" />
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">URL de Imagen (Opcional)</label>
                    <div className="flex gap-3 items-stretch h-[50px]">
                        <div className="flex-1 relative h-full">
                            <input type="text" placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full h-full bg-[#121214] border border-white/10 rounded-xl px-4 pl-10 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-slate-700 text-ellipsis" />
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        </div>
                        <div className="w-[50px] h-full bg-black/50 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0 transition-all relative group">
                            {formData.image_url ? (
                                <img src={formData.image_url} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : <ImageIcon size={18} className="text-slate-700 group-hover:text-slate-500 transition-colors" />}
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 pb-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Precio de Compra</label>
                    <div className="relative">
                        <input type="text" inputMode="decimal" placeholder="0.00" value={formData.purchase_price} onChange={(e) => setFormData({...formData, purchase_price: e.target.value})} className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:border-amber-500 focus:outline-none font-mono" />
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#09090b]/50 backdrop-blur-md flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider">Cancelar</button>
                <button onClick={handleSubmit} disabled={loading || !formData.pokemon_name} className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black px-8 py-3 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2 uppercase tracking-wider">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Joya'}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}