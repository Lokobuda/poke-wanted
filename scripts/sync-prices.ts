import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) { console.error('❌ Error: Faltan claves.'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('📦 IMPORTADOR INTELIGENTE (EUR + USD Fallback)...')
  
  const { data: sets } = await supabase.from('sets').select('id, name').order('release_date', { ascending: false })
  if (!sets) return

  let totalUpdated = 0

  for (const set of sets) {
    const cleanId = set.id.trim()
    const rawUrl = `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${cleanId}.json`

    try {
        process.stdout.write(`\n📂 ${set.name}: `)
        const response = await fetch(rawUrl)

        if (!response.ok) {
            process.stdout.write('❌ Archivo no encontrado.')
            continue
        }

        const cards: any[] = await response.json()
        
        // 1. Mapeamos (puede generar nulos)
        const rawUpdates = cards.map((c: any) => {
            let price = null
            let currency = 'EUR'

            // A. Cardmarket (EUR)
            if (c.cardmarket?.prices?.trendPrice) {
                price = c.cardmarket.prices.trendPrice
            } 
            // B. TCGPlayer (USD)
            else if (c.tcgplayer?.prices) {
                const p = c.tcgplayer.prices
                price = p.holofoil?.market || 
                        p.normal?.market || 
                        p.reverseHolofoil?.market || 
                        p['1stEditionHolofoil']?.market
                
                currency = 'USD'
            }

            if (!price) return null

            return {
                id: c.id,
                price_trend: price,
                price_currency: currency,
                price_updated_at: new Date().toISOString()
            }
        })

        // 2. Filtramos nulos y FORZAMOS el tipo 'any[]' para evitar quejas de TypeScript
        const updates: any[] = rawUpdates.filter((u: any) => u !== null)

        if (updates.length > 0) {
            const { error } = await supabase
                .from('card_variants')
                .upsert(updates, { onConflict: 'id', ignoreDuplicates: false })
            
            if (error) {
                process.stdout.write(`❌ Error DB`)
            } else {
                // Ahora usamos acceso seguro con '?.' por si acaso, aunque 'any' ya lo permite todo
                const symbol = updates[0]?.price_currency === 'EUR' ? '€' : '$'
                process.stdout.write(`✅ ${updates.length} precios guardados (${symbol}).`)
                totalUpdated += updates.length
            }
        } else {
            process.stdout.write('⚠️ Sin datos de mercado.')
        }

    } catch (err) { 
        process.stdout.write(`🔥 Error`) 
    }
  }
  console.log(`\n\n🎉 TOTAL ACTUALIZADO: ${totalUpdated}`)
}

main()