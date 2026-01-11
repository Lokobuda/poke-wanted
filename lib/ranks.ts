export const RANKS = [
  { min: 0, title: "Huevo Pokémon", id: "egg" },
  { min: 500, title: "Novato Prometedor", id: "basic" },
  { min: 2500, title: "Coleccionista Avanzado", id: "stage1" },
  { min: 10000, title: "Maestro de la Bóveda", id: "stage2" },
  { min: 50000, title: "LEYENDA VIVIENTE", id: "special" } // Versión Shiny
]

// --- CONFIGURACIÓN DE IMÁGENES ---
// Usamos "Showdown" porque son animados (GIF) y cubren todas las generaciones.
const BASE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown"
const SHINY_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny"
// Huevo oficial de PokeAPI (más seguro que pokemondb)
const EGG_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/egg.png"

export const STARTER_PATHS: any = {
  // GEN 1: KANTO
  gen1: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/1.gif`, stage1: `${BASE_URL}/2.gif`, stage2: `${BASE_URL}/3.gif`, special: `${SHINY_URL}/3.gif` }, // Bulbasaur
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/4.gif`, stage1: `${BASE_URL}/5.gif`, stage2: `${BASE_URL}/6.gif`, special: `${SHINY_URL}/6.gif` }, // Charmander
      water: { egg: EGG_URL, basic: `${BASE_URL}/7.gif`, stage1: `${BASE_URL}/8.gif`, stage2: `${BASE_URL}/9.gif`, special: `${SHINY_URL}/9.gif` }  // Squirtle
  },
  // GEN 2: JOHTO
  gen2: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/152.gif`, stage1: `${BASE_URL}/153.gif`, stage2: `${BASE_URL}/154.gif`, special: `${SHINY_URL}/154.gif` }, // Chikorita
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/155.gif`, stage1: `${BASE_URL}/156.gif`, stage2: `${BASE_URL}/157.gif`, special: `${SHINY_URL}/157.gif` }, // Cyndaquil
      water: { egg: EGG_URL, basic: `${BASE_URL}/158.gif`, stage1: `${BASE_URL}/159.gif`, stage2: `${BASE_URL}/160.gif`, special: `${SHINY_URL}/160.gif` }  // Totodile
  },
  // GEN 3: HOENN
  gen3: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/252.gif`, stage1: `${BASE_URL}/253.gif`, stage2: `${BASE_URL}/254.gif`, special: `${SHINY_URL}/254.gif` }, // Treecko
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/255.gif`, stage1: `${BASE_URL}/256.gif`, stage2: `${BASE_URL}/257.gif`, special: `${SHINY_URL}/257.gif` }, // Torchic
      water: { egg: EGG_URL, basic: `${BASE_URL}/258.gif`, stage1: `${BASE_URL}/259.gif`, stage2: `${BASE_URL}/260.gif`, special: `${SHINY_URL}/260.gif` }  // Mudkip
  },
  // GEN 4: SINNOH
  gen4: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/387.gif`, stage1: `${BASE_URL}/388.gif`, stage2: `${BASE_URL}/389.gif`, special: `${SHINY_URL}/389.gif` }, // Turtwig
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/390.gif`, stage1: `${BASE_URL}/391.gif`, stage2: `${BASE_URL}/392.gif`, special: `${SHINY_URL}/392.gif` }, // Chimchar
      water: { egg: EGG_URL, basic: `${BASE_URL}/393.gif`, stage1: `${BASE_URL}/394.gif`, stage2: `${BASE_URL}/395.gif`, special: `${SHINY_URL}/395.gif` }  // Piplup
  },
  // GEN 5: UNOVA
  gen5: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/495.gif`, stage1: `${BASE_URL}/496.gif`, stage2: `${BASE_URL}/497.gif`, special: `${SHINY_URL}/497.gif` }, // Snivy
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/498.gif`, stage1: `${BASE_URL}/499.gif`, stage2: `${BASE_URL}/500.gif`, special: `${SHINY_URL}/500.gif` }, // Tepig
      water: { egg: EGG_URL, basic: `${BASE_URL}/501.gif`, stage1: `${BASE_URL}/502.gif`, stage2: `${BASE_URL}/503.gif`, special: `${SHINY_URL}/503.gif` }  // Oshawott
  },
  // GEN 6: KALOS
  gen6: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/650.gif`, stage1: `${BASE_URL}/651.gif`, stage2: `${BASE_URL}/652.gif`, special: `${SHINY_URL}/652.gif` }, // Chespin
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/653.gif`, stage1: `${BASE_URL}/654.gif`, stage2: `${BASE_URL}/655.gif`, special: `${SHINY_URL}/655.gif` }, // Fennekin
      water: { egg: EGG_URL, basic: `${BASE_URL}/656.gif`, stage1: `${BASE_URL}/657.gif`, stage2: `${BASE_URL}/658.gif`, special: `${SHINY_URL}/658.gif` }  // Froakie
  },
  // GEN 7: ALOLA
  gen7: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/722.gif`, stage1: `${BASE_URL}/723.gif`, stage2: `${BASE_URL}/724.gif`, special: `${SHINY_URL}/724.gif` }, // Rowlet
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/725.gif`, stage1: `${BASE_URL}/726.gif`, stage2: `${BASE_URL}/727.gif`, special: `${SHINY_URL}/727.gif` }, // Litten
      water: { egg: EGG_URL, basic: `${BASE_URL}/728.gif`, stage1: `${BASE_URL}/729.gif`, stage2: `${BASE_URL}/730.gif`, special: `${SHINY_URL}/730.gif` }  // Popplio
  },
  // GEN 8: GALAR
  gen8: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/810.gif`, stage1: `${BASE_URL}/811.gif`, stage2: `${BASE_URL}/812.gif`, special: `${SHINY_URL}/812.gif` }, // Grookey
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/813.gif`, stage1: `${BASE_URL}/814.gif`, stage2: `${BASE_URL}/815.gif`, special: `${SHINY_URL}/815.gif` }, // Scorbunny
      water: { egg: EGG_URL, basic: `${BASE_URL}/816.gif`, stage1: `${BASE_URL}/817.gif`, stage2: `${BASE_URL}/818.gif`, special: `${SHINY_URL}/818.gif` }  // Sobble
  },
  // GEN 9: PALDEA
  gen9: {
      grass: { egg: EGG_URL, basic: `${BASE_URL}/906.gif`, stage1: `${BASE_URL}/907.gif`, stage2: `${BASE_URL}/908.gif`, special: `${SHINY_URL}/908.gif` }, // Sprigatito
      fire:  { egg: EGG_URL, basic: `${BASE_URL}/909.gif`, stage1: `${BASE_URL}/910.gif`, stage2: `${BASE_URL}/911.gif`, special: `${SHINY_URL}/911.gif` }, // Fuecoco
      water: { egg: EGG_URL, basic: `${BASE_URL}/912.gif`, stage1: `${BASE_URL}/913.gif`, stage2: `${BASE_URL}/914.gif`, special: `${SHINY_URL}/914.gif` }  // Quaxly
  }
}