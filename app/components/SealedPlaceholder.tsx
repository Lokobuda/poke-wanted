'use client'

interface SealedPlaceholderProps {
  type: string
}

export default function SealedPlaceholder({ type }: SealedPlaceholderProps) {
  
  const getPlaceholderImage = () => {
    const t = type.toLowerCase().trim()
    
    // 1. ELITE TRAINER BOX (ETB)
    if (t.includes('elite') || t.includes('etb')) {
        return '/placeholders/placeholder-etb.png' // .png
    }
    
    // 2. LATAS (TINS)
    if (t.includes('tin') || t.includes('lata')) {
        return '/placeholders/placeholder-tin.png' // .png
    }
    
    // 3. PREMIUM / UPC
    if (t.includes('premium') || t.includes('upc') || t.includes('collection')) {
        return '/placeholders/placeholder-upc.png' // .png
    }

    // 4. BUNDLES
    if (t.includes('bundle')) {
        return '/placeholders/placeholder-bundle.png' // .png
    }

    // 5. SOBRES Y BLISTERS
    if (t.includes('booster') || t.includes('sobre') || t.includes('blister') || t.includes('pack')) {
        return '/placeholders/placeholder-booster.png' // .png
    }

    // 6. DISPLAY / BOOSTER BOX
    if (t.includes('display') || t.includes('box')) {
        return '/placeholders/placeholder-display.png' // .png
    }

    // 7. OTROS (Default)
    return '/placeholders/placeholder-other.png' // .png
  }

  const imageSrc = getPlaceholderImage()

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#050510] relative overflow-hidden group">
        
        {/* Fondo sutil */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#1a1a3a 1px, transparent 1px), linear-gradient(90deg, #1a1a3a 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />
        
        {/* Imagen Holográfica */}
        <div className="relative w-[90%] h-[90%] flex items-center justify-center animate-[float_6s_ease-in-out_infinite]">
            <img 
                src={imageSrc} 
                alt={type}
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-transform duration-500 group-hover:scale-110 mix-blend-screen"
                onError={(e) => {
                    e.currentTarget.style.display = 'none'
                }}
            />
        </div>
    </div>
  )
}