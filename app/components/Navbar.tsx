'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { LogIn, Plus, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import AuthModal from './AuthModal'
import ConfirmModal from './ConfirmModal'
import Logo from './Logo'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isTutorialMode = searchParams.get('step') === 'create'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setShowLogoutModal(false)
        router.push('/logout') 
    } catch (error) {
        toast.error('Error al cerrar sesión')
        console.error(error)
    } finally {
        setIsLoggingOut(false)
    }
  }

  const initial = user?.email ? user.email[0].toUpperCase() : '?'
  const username = user?.email ? user.email.split('@')[0] : ''

  if (pathname === '/' || pathname === '/new-game' || pathname === '/logout') return null

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-center">
        <div className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 md:px-8 shadow-2xl">
          
          {/* LOGO + TEXTO (AUMENTADO Y CORREGIDO) */}
          <Link href="/profile" className="flex items-center gap-4 group cursor-pointer">
            <Logo 
              width={64}  // Aumentado de 56 a 64
              height={64} // Aumentado de 56 a 64
              className="transition-transform duration-300 group-hover:scale-110" 
            />
            {/* CAMBIOS: 
                - text-3xl (Más grande)
                - pr-2 (Evita que se corte la S itálica a la derecha)
                - pb-1 (Evita cortes por abajo)
            */}
            <span className="font-black italic tracking-tighter text-3xl text-white leading-none hidden md:block whitespace-nowrap pb-1 pr-2">
                POKÉ<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">BINDERS</span>
            </span>
          </Link>

          {/* ZONA DERECHA */}
          <div className="flex items-center gap-4 md:gap-6">
            {user && (
              <Link href="/create">
                <button 
                  id="tour-create-btn" 
                  className={`
                    flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 active:scale-95
                    ${isTutorialMode 
                      ? 'bg-violet-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.8)] border border-violet-400 animate-pulse ring-4 ring-violet-500/30' 
                      : 'bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                    }
                  `}
                >
                  <Plus size={14} strokeWidth={3} className={isTutorialMode ? 'animate-bounce' : ''} />
                  <span className="hidden sm:inline">Crear Álbum</span>
                </button>
              </Link>
            )}

            <div className="h-6 w-px bg-white/10" />

            {!user ? (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">
                <LogIn size={14} /> <span>Entrar</span>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/profile" className="group flex items-center gap-3 cursor-pointer">
                   <div className="text-right hidden md:block">
                      <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase mb-0.5 group-hover:text-violet-400 transition-colors">Entrenador</p>
                      <p className="text-xs font-bold text-white leading-none">{username}</p>
                   </div>
                   <div className="w-10 h-10 bg-slate-800 border-2 border-white/10 rounded-full flex items-center justify-center text-violet-400 font-black shadow-lg group-hover:border-violet-500 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-all overflow-hidden">
                      <span className="text-sm">{initial}</span>
                   </div>
                </Link>
                <button onClick={() => setShowLogoutModal(true)} className="text-slate-600 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-full" title="Cerrar sesión">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Ajustamos el espaciador porque el navbar ahora es más alto */}
      <div className="h-32 w-full" />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <ConfirmModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="¿Cerrar Sesión?"
        description="Tendrás que volver a introducir tus credenciales para acceder a tu colección."
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="danger"
        isProcessing={isLoggingOut}
      />
    </>
  )
}