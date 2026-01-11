'use client'

import { X, Search, CheckCircle2, Image as ImageIcon } from 'lucide-react'

interface ImageHelperModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImageHelperModal({ isOpen, onClose }: ImageHelperModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="text-indigo-400" size={20} /> Conseguir imágenes perfectas
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>Queremos que tu estantería se vea increíble. Aquí tienes los trucos rápidos:</p>
            
            <ul className="space-y-3">
                <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg">
                    <ImageIcon className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />
                    <span>Busca el producto en Google Imágenes o tiendas oficiales (ej: Pokémon Center).</span>
                </li>
                 <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg">
                    <CheckCircle2 className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />
                    <span>Haz clic derecho en la imagen y elige <strong>"Copiar dirección de imagen"</strong>. Pégala en el formulario.</span>
                </li>
            </ul>

            <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-500/30 text-xs text-indigo-200 mt-4">
                <strong>Nota sobre fondos:</strong> Las imágenes PNG transparentes quedan genial, pero si la imagen tiene un fondo blanco limpio (foto de estudio), ¡también se verá perfecta! Nuestro sistema la adaptará.
            </div>
        </div>

      </div>
    </div>
  )
}