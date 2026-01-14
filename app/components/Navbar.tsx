'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { LogIn, Plus, LogOut, FolderPlus } from 'lucide-react'
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

  // Escuchar evento de logout desde perfil móvil
  useEffect(() => {
    const handleOpenLogout = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogout);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogout);
  }, []);

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
        <div className="w-full flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 md:px-8 shadow-2xl h-16 md:h-20 transition-all">
          
          <Link href="/profile" className="flex items-center gap-3 group cursor-pointer">
            <Logo width={48} height={48} className="md:w-[64px] md:h-[64px] transition-transform duration-300 group-hover:scale-110" />
            <div className="flex flex-col justify-center">
                <span className="font-black italic tracking-tighter text-xl md:text-3xl text-white leading-none whitespace-nowrap pr-2 drop-shadow-lg">
                    POKÉ<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">BINDERS</span>
                </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            {user && (
              <Link href="/create">
                <button 
                  id="tour-create-btn" 
                  className={`
                    flex items-center justify-center gap-2 rounded-full font-bold tracking-widest uppercase transition-all duration-500 active:scale-95 shadow-lg
                    ${isTutorialMode 
                      ? 'bg-violet-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.8)] border border-violet-400 animate-pulse ring-4 ring-violet-500/30' 
                      : 'bg-violet-600 hover:bg-violet-500 text-white border border-white/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                    }
                    w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2.5 p-0
                  `}
                >
                  <Plus size={20} strokeWidth={3} className={`md:hidden ${isTutorialMode ? 'animate-bounce' : ''}`} />
                  <FolderPlus size={18} strokeWidth={2.5} className="hidden md:block" />
                  <span className="hidden md:inline text-xs">Crear Álbum</span>
                </button>
              </Link>
            )}

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            {!user ? (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <LogIn size={14} /> <span>Entrar</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 md:gap-4">
                <Link href="/profile" className="group flex items-center gap-3 cursor-pointer">
                   <div className="text-right hidden md:block">
                      <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase mb-0.5 group-hover:text-violet-400 transition-colors">Entrenador</p>
                      <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{username}</p>
                   </div>
                   <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-800 border-2 border-white/10 rounded-full flex items-center justify-center text-violet-400 font-black shadow-lg group-hover:border-violet-500 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-all overflow-hidden">
                      <span className="text-xs md:text-sm">{initial}</span>
                   </div>
                </Link>
                <button onClick={() => setShowLogoutModal(true)} className="hidden md:flex text-slate-600 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-full" title="Cerrar sesión">
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="h-20 md:h-28 w-full" />

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