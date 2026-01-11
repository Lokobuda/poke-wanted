'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Loader2, Package, Image as ImageIcon, Link as LinkIcon, DollarSign, Layers, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import ImageHelperModal from './ImageHelperModal'

interface AddSealedModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const PRODUCT_TYPES = [
  'Elite Trainer Box (ETB)',
  'Booster Box (Display)',     // <--- Mapeará a placeholder-display.jpg
  'Booster Bundle',            // <--- Mapeará a placeholder-bundle.jpg
  'Sobre (Booster Pack)',      // <--- Mapeará a placeholder-booster.jpg
  'Ultra Premium Coll. (UPC)', // <--- Mapeará a placeholder-upc.jpg
  'Special Collection',        // <--- Mapeará a placeholder-other.jpg (por default)
  'Tin (Lata)',                // <--- Mapeará a placeholder-tin.jpg
  'Mini Tin',                  // <--- Mapeará a placeholder-tin.jpg
  'Blister',                   // <--- Mapeará a placeholder-booster.jpg
  'Otro'                       // <--- Mapeará a placeholder-other.jpg
]

export default function AddSealedModal({ isOpen, onClose, onSuccess }: AddSealedModalProps) {
  const [loading, setLoading] = useState(false)
  const [sets, setSets] = useState<any[]>([])
  const [showImageHelper, setShowImageHelper] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Elite Trainer Box (ETB)',
    set_id: '',
    image_url: '',
    price: '',
    quantity: '1'
  })

  useEffect(() => {
    if (isOpen) {
      const fetchSets = async () => {
        const { data } = await supabase.from('sets').select('id, name').order('release_date', { ascending: false })
        setSets(data || [])
      }
      fetchSets()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No sesión')

      let finalPrice = null
      if (formData.price) {
          finalPrice = parseFloat(formData.price.replace(',', '.'))
          if (isNaN(finalPrice)) throw new Error('Precio inválido')
      }

      const { error } = await supabase.from('sealed_products').insert({
        user_id: session.user.id,
        name: formData.name,
        type: formData.type,
        set_id: formData.set_id || null,
        image_url: formData.image_url || null,
        purchase_price: finalPrice,
        quantity: parseInt(formData.quantity) || 1
      })

      if (error) throw error

      toast.success('Producto añadido a la estantería')
      onSuccess()
      onClose()
      setFormData({ name: '', type: 'Elite Trainer Box (ETB)', set_id: '', image_url: '', price: '', quantity: '1' })

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Package className="text-indigo-500" /> Añadir Producto Sellado
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tipos y Sets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Producto</label>
                      <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none">
                          {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Set (Opcional)</label>
                      <div className="relative">
                          <select value={formData.set_id} onChange={(e) => setFormData({...formData, set_id: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none appearance-none">
                              <option value="">-- Ninguno / Genérico --</option>
                              {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                      </div>
                  </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre del Producto</label>
                  <input type="text" placeholder="Ej: Elite Trainer Box 151 (Snorlax)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"/>
              </div>

              {/* Imagen (CORREGIDO) */}
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Imagen (URL)</label>
                      <button onClick={() => setShowImageHelper(true)} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"><HelpCircle size={12} /> Ayuda con imágenes</button>
                  </div>
                  <div className="flex gap-4 items-start h-24">
                      <div className="flex-1 relative h-full">
                          <input type="text" placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full h-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600 text-sm resize-none"/>
                          <LinkIcon className="absolute left-3 top-4 text-slate-600" size={16} />
                      </div>
                      {/* PREVIEW CORREGIDA: Fondo blanco limpio, sin mix-blend */}
                      <div className="w-24 h-full bg-white rounded-xl border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative p-1 shadow-sm">
                          {formData.image_url ? (
                              <img src={formData.image_url} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                              <ImageIcon className="text-slate-300" size={24} />
                          )}
                      </div>
                  </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Compra ($)</label>
                      <div className="relative"><input type="text" inputMode="decimal" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:border-indigo-500 focus:outline-none"/><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} /></div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad</label>
                      <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-center text-white focus:border-indigo-500 focus:outline-none font-mono"/>
                  </div>
              </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-950/50 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={handleSubmit} disabled={loading || !formData.name} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">{loading ? <Loader2 className="animate-spin" /> : 'Guardar'}</button>
          </div>
        </div>
      </div>
      <ImageHelperModal isOpen={showImageHelper} onClose={() => setShowImageHelper(false)} />
    </>
  )
}