'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, RefreshCw, Database } from 'lucide-react'
import Link from 'next/link'

type SetData = { id: string; name: string; release_date: string }

export default function UpdatePricesPage() {
  const [sets, setSets] = useState<SetData[]>([])
  const [loading, setLoading] = useState(true)
  const [processingSet, setProcessingSet] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    async function loadSets() {
      const { data } = await supabase
        .from('sets')
        .select('id, name, release_date')
        .order('release_date', { ascending: false })
      
      if (data) setSets(data)
      setLoading(false)
    }
    loadSets()
  }, [])

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 100))

  const syncSetPrices = async (setId: string, setName: string) => {
    if (processingSet) return
    setProcessingSet(setId)
    setLogs([])
    addLog(`🚀 Iniciando Sincronización Vía Servidor para: ${setName}...`)

    try {
      let page = 1
      let hasMore = true
      let totalUpdated = 0
      
      // Lote de 5 para máxima seguridad contra Timeouts
      const pageSize = 5

      while (hasMore) {
        addLog(`📡 Pidiendo lote ${page} (5 cartas)...`)
        
        try {
            // Llamamos a NUESTRA API (Backend)
            const response = await fetch(`/api/get-prices?setId=${setId}&page=${page}&pageSize=${pageSize}`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || `Error Servidor ${response.status}`)
            }

            const cardsPage = result.data
            const count = cardsPage ? cardsPage.length : 0

            if (count === 0) {
                addLog(`✅ Fin del set.`)
                hasMore = false
                break;
            }

            const updates = cardsPage.map((apiCard: any) => {
                const trendPrice = apiCard.cardmarket?.prices?.trendPrice || null
                if (!trendPrice) return null

                return {
                    id: apiCard.id,
                    price_trend: trendPrice,
                    price_currency: 'EUR',
                    price_updated_at: new Date().toISOString()
                }
            }).filter(Boolean)

            if (updates.length > 0) {
                // ESCRIBIMOS EN 'card_variants' (La tabla que corregimos en SQL)
                const { error } = await supabase
                    .from('card_variants') 
                    .upsert(updates as any, { onConflict: 'id', ignoreDuplicates: false })

                if (error) {
                    console.error(error)
                    // Si el error es de columnas, paramos porque es crítico
                    if(error.message.includes("column")) throw error;
                    
                    addLog(`❌ Error Supabase: ${error.message}`)
                } else {
                    totalUpdated += updates.length
                    addLog(`💾 Guardadas ${updates.length} cartas.`)
                }
            } else {
                addLog(`ℹ️ Lote recibido sin precios.`)
            }

            if (count < pageSize) {
                hasMore = false
            } else {
                page++
            }
            
            setProgress({ current: page * pageSize, total: (page * pageSize) + 20 })
            
            // Espera de 1 segundo entre llamadas para dejar respirar al servidor
            await new Promise(r => setTimeout(r, 1000));

        } catch (batchError: any) {
            // Si falla el servidor (Timeout), reintentamos la misma página una vez más
            addLog(`⚠️ Fallo en lote ${page}: ${batchError.message}. Reintentando en 3s...`)
            await new Promise(r => setTimeout(r, 3000));
            // No incrementamos 'page', el bucle volverá a intentar la misma
        }
      }

      addLog(`🏁 FINALIZADO. Total Actualizado: ${totalUpdated}.`)

    } catch (err: any) {
      addLog(`🔥 Error Fatal: ${err.message}`)
    } finally {
      setProcessingSet(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <Link href="/" className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black">Sincronización de Precios</h1>
            <p className="text-slate-400 text-sm">Vía Servidor + Tabla Correcta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-bold flex items-center gap-2 text-violet-400"><Database size={18} /> Selecciona un Set</h2>
            <div className="bg-slate-900/50 rounded-xl border border-white/5 h-[600px] overflow-y-auto p-2">
              {loading ? <div className="p-4 text-center">Cargando...</div> : 
                sets.map(set => (
                  <div key={set.id} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg transition">
                    <div className="flex flex-col"><span className="font-bold text-sm">{set.name}</span><span className="text-xs text-slate-500">{set.id}</span></div>
                    <button onClick={() => syncSetPrices(set.id, set.name)} disabled={!!processingSet} className="px-3 py-1 bg-slate-950 border border-white/10 rounded text-xs font-bold hover:bg-violet-600 disabled:opacity-50">{processingSet === set.id ? '...' : 'Sync'}</button>
                  </div>
                ))
              }
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-bold flex items-center gap-2 text-green-400"><RefreshCw size={18} /> Consola</h2>
            <div className="bg-black rounded-xl border border-white/10 p-4 h-[600px] flex flex-col font-mono text-xs relative overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                 {logs.map((log, i) => <div key={i} className={`pb-1 border-b border-white/5 ${log.includes('Error') ? 'text-red-400' : log.includes('Reintentando') ? 'text-yellow-400' : 'text-slate-300'}`}>{log}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}