'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isProcessing?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isProcessing = false,
  variant = 'danger'
}: ConfirmModalProps) {
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        
        {/* Backdrop (Fondo oscuro y desenfocado) */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !isProcessing && onClose()}
        />

        {/* Caja del Modal (Estilo Navbar: Glassmorphism) */}
        <div className="relative bg-slate-950/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col gap-4 animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
            
            <div className="flex items-start gap-4">
                {/* Icono dinámico */}
                <div className={`p-3 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <AlertTriangle size={24} />
                </div>
                
                {/* Textos */}
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                        {description}
                    </p>
                </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end mt-2">
                <button 
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {cancelText}
                </button>
                <button 
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                        variant === 'danger' 
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/20'
                    }`}
                >
                    {isProcessing && <Loader2 className="animate-spin" size={16}/>}
                    {confirmText}
                </button>
            </div>

        </div>
    </div>
  )
}