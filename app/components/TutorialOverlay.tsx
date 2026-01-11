'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Check } from 'lucide-react'

// Definimos el tipo para un paso del tutorial
export type TutorialStep = {
  targetId: string
  title: string
  text: string
  action: string
  skip?: string
  position: 'top' | 'bottom' | 'center'
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  // Eliminada la prop buddyImage para limpiar la interfaz
  onComplete: () => void
  onClose: () => void
}

export default function TutorialOverlay({ steps, onComplete, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState({ top: -1000, left: -1000, width: 0, height: 0 })
  const stepRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
      const step = steps[currentStep]
      if (!step) return

      if (step.targetId === 'tour-start') {
         setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 })
         return
      }

      const element = document.getElementById(step.targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        const rect = element.getBoundingClientRect()
        
        if (rect.width > 0 && rect.height > 0) {
            setCoords({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            })
        }
      } else {
          setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 })
      }
  }

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })
    const interval = setInterval(updatePosition, 100) 
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      clearInterval(interval)
    }
  }, [currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const stepData = steps[currentStep]
  if (!stepData) return null
  const isStart = stepData.targetId === 'tour-start'
  const hasValidCoords = coords.top > -500 && coords.width > 0

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
      <div 
        className={`absolute inset-0 bg-slate-950/90 transition-all duration-300 ease-out ${isStart || hasValidCoords ? 'opacity-100' : 'opacity-0'}`}
        style={!isStart && hasValidCoords ? {
           clipPath: `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
        } : {}}
      />

      {!isStart && hasValidCoords && (
         <div 
           className="absolute border-2 border-violet-500 rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all duration-300 ease-out pointer-events-none"
           style={{ top: coords.top - 4, left: coords.left - 4, width: coords.width + 8, height: coords.height + 8 }}
         />
      )}

      <div 
        ref={stepRef}
        className={`absolute w-full max-w-[90vw] md:max-w-md p-4 transition-all duration-500 ease-out flex flex-col items-center justify-center
          ${isStart || !hasValidCoords ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${!isStart && !hasValidCoords ? 'opacity-0' : 'opacity-100'}
        `}
        style={!isStart && hasValidCoords ? {
           top: stepData.position === 'top' 
                ? Math.max(20, coords.top - (stepRef.current?.offsetHeight || 250) - 20) 
                : Math.min(window.innerHeight - (stepRef.current?.offsetHeight || 250) - 20, coords.top + coords.height + 30),
           left: window.innerWidth < 768 ? '50%' : Math.min(Math.max(320, coords.left + coords.width/2), window.innerWidth - 320),
           transform: 'translateX(-50%)',
           zIndex: 10000
        } : { zIndex: 10000 }}
      >
         <div className="relative bg-slate-900/95 border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-md overflow-hidden">
            
            {/* CABECERA (Sin Buddy, diseño simplificado) */}
            <div className="mb-4 border-b border-white/5 pb-4">
               <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight text-center md:text-left">
                 {stepData.title}
               </h3>
            </div>

            <div className="pl-1">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{stepData.text}</p>
            </div>
            
            <div className="mt-6 flex gap-3 justify-end items-center">
               {isStart && (
                  <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-500 text-xs font-bold hover:text-white hover:bg-white/5 transition-colors">
                     {stepData.skip}
                  </button>
               )}
               <button onClick={handleNext} className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-900/30 active:scale-95 transition-all flex items-center gap-2">
                  {stepData.action} {currentStep === steps.length - 1 ? <Check size={16}/> : <ChevronRight size={16}/>}
               </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
               <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
            </div>
         </div>
      </div>
    </div>
  )
}