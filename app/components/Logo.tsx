import Image from 'next/image'

export const Logo = ({ 
  width = 50, 
  height = 50, 
  className = "" 
}: { 
  width?: number, 
  height?: number, 
  className?: string 
}) => {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
       <Image
        // CAMBIO: Usamos el nuevo nombre del archivo. 
        // ALERTA: Asegúrate de haber renombrado la imagen en la carpeta 'public' a 'logo-header.png'
        src="/logo-header.png" 
        alt="Pokébinders Logo"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
        className="object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
      />
    </div>
  )
}

export default Logo