'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Mail, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: 'login' | 'sign_up'
}

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
  const router = useRouter()
  const [view, setView] = useState<'login' | 'sign_up' | 'verify_email'>(defaultView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Reseteamos la vista al abrir
  useEffect(() => {
    if (isOpen) setView(defaultView)
  }, [isOpen, defaultView])

  // ESCUCHAMOS EL ESTADO DE AUTENTICACIÓN
  useEffect(() => {
    if (!isOpen) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || session) {
        
        // --- ACTIVAR MEMBRESÍA SI VIENE DE TIENDA (Corregido) ---
        const pendingCode = localStorage.getItem('pending_gym_code')
        if (pendingCode && session?.user) {
            await supabase.from('profiles').update({ subscription_status: 'GYM' }).eq('id', session.user.id)
            localStorage.removeItem('pending_gym_code')
            toast.success('¡Membresía de Gimnasio Activada!')
        }
        // --------------------------------------------------------

        toast.success('¡Bienvenido!')
        onClose()
        router.push('/profile') 
      }
    })

    return () => subscription.unsubscribe()
  }, [isOpen, onClose, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (view === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        })
        if (error) throw error
        setView('verify_email') 
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        toast.success('Sesión iniciada')
        onClose()
        router.push('/profile')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {/* --- VISTA: VERIFICAR EMAIL --- */}
        {view === 'verify_email' ? (
           <div className="text-center py-6">
              <div className="w-16 h-16 bg-violet-600/20 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Mail size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">¡Revisa tu correo!</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Te hemos enviado un enlace mágico a <span className="text-white font-bold">{email}</span>.
                  <br/>Haz clic en él para activar tu Pokédex.
              </p>
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-xs text-slate-500 animate-pulse">
                  <p className="flex items-center justify-center gap-2">
                      <Loader2 size={12} className="animate-spin" /> Esperando confirmación...
                  </p>
              </div>
           </div>
        ) : (
          /* --- VISTA: LOGIN / REGISTRO --- */
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-1">
                {view === 'login' ? 'Bienvenido' : 'Nueva Partida'}
              </h2>
              <p className="text-slate-400 text-sm">
                {view === 'login' ? 'Continua tu aventura donde la dejaste.' : 'Crea tu cuenta para empezar a coleccionar.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="entrenador@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 ml-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader2 className="animate-spin" /> : (view === 'login' ? 'Entrar' : 'Crear Cuenta')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setView(view === 'login' ? 'sign_up' : 'login')}
                className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                {view === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}