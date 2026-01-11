'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Loader2, Package, Plus, Trash2, Search, X, Layers } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import AddSealedModal from '../components/AddSealedModal'
import SealedPlaceholder from '../components/SealedPlaceholder'
import { toast } from 'sonner'

export default function SealedPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  
  // FILTROS
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  
  // MODALES
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchSealed()
  }, [])

  const fetchSealed = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data, error } = await supabase.from('sealed_products').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (e) { console.error(e); toast.error('Error cargando la estantería') } finally { setLoading(false) }
  }

  const handleDelete = async () => {
      if (!productToDelete) return
      toast.promise(async () => {
          const { error } = await supabase.from('sealed_products').delete().eq('id', productToDelete)
          if (error) throw error
          setProducts(prev => prev.filter(p => p.id !== productToDelete))
      }, { loading: 'Retirando producto...', success: 'Producto eliminado', error: 'Error al eliminar', classNames: { toast: 'bg-slate-950 border border-white/10 text-white font-sans' } })
      setProductToDelete(null)
  }

  // LÓGICA DE FILTRADO
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchType = filterType === 'ALL' || p.type === filterType
          const query = searchQuery.toLowerCase()
          const matchSearch = p.name.toLowerCase().includes(query) || (p.set_id && p.set_id.toLowerCase().includes(query))
          return matchType && matchSearch
      })
  }, [products, filterType, searchQuery])

  const availableTypes = ['ALL', ...new Set(products.map(p => p.type))].sort()
  
  const getShortName = (type: string) => {
      if (type === 'ALL') return 'Todo'
      if (type.includes('Elite')) return 'ETB'
      if (type.includes('Booster Box')) return 'Display'
      if (type.includes('Bundle')) return 'Bundle'
      if (type.includes('Sobre')) return 'Sobre'
      if (type.includes('Premium')) return 'UPC'
      if (type.includes('Tin')) return 'Lata'
      return type.split(' ')[0]
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative font-sans text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black" />

      {/* HEADER + FILTROS */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-6 py-4 shadow-2xl">
        <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row justify-between items-center gap-4">
            
            {/* ZONA IZQUIERDA: Título */}
            <div className="flex items-center gap-4 w-full xl:w-auto">
                <Link href="/profile"><button className="p-2 rounded-full hover:bg-white/10 transition-colors"><ArrowLeft size={20} /></button></Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2"><Package className="text-indigo-500" fill="currentColor" fillOpacity={0.2} /> PRODUCTO SELLADO</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Total: {products.length} Items
                    </p>
                </div>
            </div>

            {/* ZONA DERECHA: Herramientas Agrupadas (Alineadas al final) */}
            <div className="flex flex-col md:flex-row gap-3 items-center w-full xl:w-auto justify-end">
                
                {/* 1. FILTROS */}
                <div className="flex bg-slate-900/50 rounded-full p-1 border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                    {availableTypes.map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filterType === type 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {getShortName(type)}
                        </button>
                    ))}
                </div>

                {/* Contenedor para Buscador y Botón (para que vayan juntos en móvil también) */}
                <div className="flex gap-3 w-full md:w-auto items-center">
                    
                    {/* 2. BUSCADOR */}
                    <div className="relative group flex-1 md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 h-[34px]"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={12} /></button>
                        )}
                    </div>

                    {/* 3. BOTÓN AÑADIR */}
                    <button 
                        onClick={() => setIsAddOpen(true)} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-1.5 rounded-full shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 h-[34px] whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">AÑADIR</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Package size={64} className="mb-4 text-slate-700" />
                <p className="text-xl font-bold">Tu estantería está vacía</p>
                <p className="text-sm text-slate-500 mt-2">Añade ETBs, Sobres o Latas para empezar.</p>
            </div>
        ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Search size={48} className="mb-4 text-slate-700" />
                <p className="text-lg font-bold">No hay coincidencias</p>
                <button onClick={() => {setSearchQuery(''); setFilterType('ALL')}} className="text-indigo-400 text-sm mt-2 hover:underline">Limpiar filtros</button>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 hover:border-indigo-500/30 transition-all group relative hover:bg-slate-900/60 hover:shadow-xl hover:-translate-y-1 flex flex-col animate-in zoom-in duration-300">
                        <button onClick={() => setProductToDelete(product.id)} className="absolute top-2 right-2 bg-slate-950/90 text-slate-400 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-white/10 border border-white/10 backdrop-blur-sm scale-90 group-hover:scale-100 shadow-sm"><Trash2 size={14} /></button>

                        <div className="aspect-square w-full rounded-xl mb-3 flex items-center justify-center relative overflow-hidden bg-white group-hover:scale-[1.02] transition-transform duration-300 shadow-sm p-1">
                            {product.image_url ? (
                                <img src={product.image_url} className="w-full h-full object-contain relative z-10" />
                            ) : (
                                <div className="absolute inset-0 bg-[#050510]">
                                   <SealedPlaceholder type={product.type} />
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-0.5 flex-1">
                             <h3 className="font-bold text-sm leading-tight text-white line-clamp-2" title={product.name}>{product.name}</h3>
                             {product.set_id && <p className="text-[10px] text-slate-500 truncate flex items-center gap-1"><Layers size={10}/> {product.set_id}</p>}
                        </div>
                       
                        <div className="flex justify-between items-end mt-3 pt-2 border-t border-white/5">
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold truncate max-w-[60%]">
                                {product.type.split(' ')[0]}
                            </span>
                            <div className="text-right leading-none">
                                <span className="text-[9px] text-slate-500 block">Cant.</span>
                                <span className="text-sm font-mono text-white font-black">x{product.quantity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <AddSealedModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchSealed} />
      <ConfirmModal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} onConfirm={handleDelete} title="¿Eliminar producto?" description="Se eliminará de tu inventario sellado y perderás el registro de su precio de compra." confirmText="Eliminar" variant="danger" />
    </div>
  )
}