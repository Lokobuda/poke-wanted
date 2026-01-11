import GOD_TIER_LIST from './godTierList.json'

// DEFINICIÓN DE PUNTOS
export const POINTS = {
    BASE: {
        COMMON: 2,
        UNCOMMON: 5,
        RARE: 10,
        HOLO: 15,
        DOUBLE_RARE: 25, // ex, V
        ULTRA_RARE: 50, // Full Art
        ILLUSTRATION_RARE: 100, // AR, SAR
        HYPER_RARE: 200 // Gold
    },
    BONUS: {
        GOD: 2500,    // El Santo Grial
        VINTAGE: 500, // Clásicos valiosos
        LEGEND: 200   // Modernos icónicos
    }
}

// Interfaz mínima de carta para calcular puntos
interface ScorableCard {
    set_id: string
    card_number: string
    rarity?: string
    name?: string
}

export function getCardScore(card: ScorableCard): number {
    let score = POINTS.BASE.COMMON // Base mínima

    // 1. PUNTOS POR RAREZA (Estimación por nombre/rarity si existe)
    const rarity = card.rarity?.toLowerCase() || ''
    
    if (rarity.includes('hyper') || rarity.includes('gold')) score = POINTS.BASE.HYPER_RARE
    else if (rarity.includes('illustration') || rarity.includes('special') || rarity.includes('art')) score = POINTS.BASE.ILLUSTRATION_RARE
    else if (rarity.includes('ultra') || rarity.includes('full art')) score = POINTS.BASE.ULTRA_RARE
    else if (rarity.includes('double') || rarity.includes('vmax') || rarity.includes('vstar') || rarity.includes('ex')) score = POINTS.BASE.DOUBLE_RARE
    else if (rarity.includes('holo')) score = POINTS.BASE.HOLO
    else if (rarity.includes('rare')) score = POINTS.BASE.RARE

    // 2. BONUS GOD TIER (Buscamos en el JSON)
    // Normalizamos IDs para asegurar match (quitamos ceros a la izquierda en números ej: 004 -> 4)
    const match = GOD_TIER_LIST.find(g => {
        // Coincidencia de Set
        if (g.set_id !== card.set_id) return false
        
        // Coincidencia de Número (limpiamos "001/165" a "1")
        const cardNum = card.card_number.split('/')[0].replace(/^0+/, '')
        const godNum = g.card_number.split('/')[0].replace(/^0+/, '')
        
        return cardNum === godNum
    })

    if (match) {
        if (match.tier === 'GOD') score += POINTS.BONUS.GOD
        else if (match.tier === 'VINTAGE') score += POINTS.BONUS.VINTAGE
        else if (match.tier === 'LEGEND') score += POINTS.BONUS.LEGEND
    }

    return score
}

export function getRankTitle(xp: number) {
    if (xp < 500) return "Huevo Pokémon"
    if (xp < 2500) return "Novato Prometedor"
    if (xp < 10000) return "Coleccionista Avanzado"
    if (xp < 50000) return "Maestro de la Bóveda"
    return "LEYENDA VIVIENTE"
}