'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { LogIn, Plus, LogOut, FolderPlus, User, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import AuthModal from './AuthModal'
import ConfirmModal from './ConfirmModal'
import Logo from './Logo'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // NUEVO: Estado para el menú móvil del avatar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isTutorialMode = searchParams.get('step') === 'create'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Cierra el menú si tocas fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cierra el menú al cambiar de ruta
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setShowLogoutModal(false)
        router.push('/logout') 
    } catch (error) {
        toast.error('Error al cerrar sesión')
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
          
          {/* LOGO */}
          <Link href="/profile" className="flex items-center gap-3 group cursor-pointer">
            <Logo width={48} height={48} className="md:w-[64px] md:h-[64px] transition-transform duration-300 group-hover:scale-110" />
            <div className="flex flex-col justify-center">
                <span className="font-black italic tracking-tighter text-xl md:text-3xl text-white leading-none whitespace-nowrap pr-2 drop-shadow-lg">
                    POKÉ<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">BINDERS</span>
                </span>
            </div>
          </Link>

          {/* ZONA DERECHA */}
          <div className="flex items-center gap-3 md:gap-6">
            {user && (
              <Link href="/create">
                <button 
                  id="tour-create-btn" 
                  className={`flex items-center justify-center gap-2 rounded-full font-bold tracking-widest uppercase transition-all duration-500 active:scale-95 shadow-lg ${isTutorialMode ? 'bg-violet-600 text-white animate-pulse ring-4 ring-violet-500/30' : 'bg-violet-600 hover:bg-violet-500 text-white'} w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2.5 p-0`}
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
              <div className="flex items-center gap-3 md:gap-4 relative" ref={mobileMenuRef}>
                
                {/* --- LÓGICA DE AVATAR (MÓVIL vs PC) --- */}
                
                {/* EN PC: LINK DIRECTO A PERFIL */}
                <Link href="/profile" className="group hidden md:flex items-center gap-3 cursor-pointer">
                   <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase mb-0.5">Entrenador</p>
                      <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{username}</p>
                   </div>
                   <div className="w-11 h-11 bg-slate-800 border-2 border-white/10 rounded-full flex items-center justify-center text-violet-400 font-black shadow-lg hover:border-violet-500 transition-all">
                      {initial}
                   </div>
                </Link>

                {/* EN MÓVIL: BOTÓN QUE ABRE MENÚ */}
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden w-10 h-10 bg-slate-800 border-2 border-white/10 rounded-full flex items-center justify-center text-violet-400 font-black shadow-lg active:scale-95 transition-all relative"
                >
                    {initial}
                    {/* Indicador de menú */}
                    <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-white/10">
                        <ChevronDown size={10} className="text-slate-400" />
                    </div>
                </button>

                {/* MENÚ DESPLEGABLE MÓVIL */}
                {mobileMenuOpen && (
                    <div className="absolute top-14 right-0 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Hola,</p>
                            <p className="text-xs font-bold text-white truncate">{username}</p>
                        </div>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition-colors">
                                <User size={16} /> Mi Perfil
                            </button>
                        </Link>
                        <button 
                            onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                )}
                
                {/* BOTÓN LOGOUT (SOLO PC) */}
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
      <ConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} title="¿Cerrar Sesión?" description="¿Seguro que quieres salir?" confirmText="Cerrar Sesión" variant="danger" isProcessing={isLoggingOut} />
    </>
  )
}