'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Store, Sparkles, ArrowRight, CheckCircle2, LogIn, Crown, Loader2, UserCheck, ShieldCheck, Layers, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import AuthModal from '../components/AuthModal'

export default function StoreLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Datos básicos de la URL
  const promoCode = searchParams.get('code')
  const isRedeemed = searchParams.get('redeemed') === 'true'
  
  // Estado para guardar los datos de la tienda (Logo y Nombre)
  const [gymDetails, setGymDetails] = useState<{name: string, logo_url?: string}>({ name: 'Tienda Asociada' })
  const [loadingGym, setLoadingGym] = useState(true)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'sign_up'>('sign_up')
  const [isApplying, setIsApplying] = useState(false)
  const [successMode, setSuccessMode] = useState(false)

  useEffect(() => {
    // 1. Cargar Usuario
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) setCurrentUser(session.user)
    }
    checkSession()

    // 2. Gestionar Estado Redimido
    if (isRedeemed) setSuccessMode(true)
    else if (promoCode) localStorage.setItem('pending_gym_code', promoCode)

    // 3. BUSCAR DATOS DE LA TIENDA (Logo y Nombre)
    const fetchGymInfo = async () => {
        if (!promoCode) { setLoadingGym(false); return }
        
        const { data, error } = await supabase
            .from('gyms')
            .select('store_name, logo_url')
            .eq('code', promoCode) // Buscamos por el código de la URL
            .single()
        
        if (data) {
            setGymDetails({ name: data.store_name, logo_url: data.logo_url })
        }
        setLoadingGym(false)
    }
    
    fetchGymInfo()

  }, [promoCode, isRedeemed])

  // Lógica para canjear si entran por QR
  const handleApplyToCurrentAccount = async () => {
      if (!currentUser || !promoCode) return
      setIsApplying(true)

      try {
          const { data, error } = await supabase.rpc('claim_gym_access', { input_code: promoCode })
          if (error) throw error

          if (data && data.success) {
              localStorage.removeItem('pending_gym_code')
              setSuccessMode(true)
              toast.success('¡Código canjeado con éxito!')
              // Actualizamos los detalles con lo que devuelve la función por si acaso
              setGymDetails({ name: data.store_name, logo_url: data.logo_url })
          } else {
              toast.error(data?.error || 'Código no válido')
          }
      } catch (error: any) {
          toast.error('Error al aplicar el código', { description: error.message })
      } finally {
          setIsApplying(false)
      }
  }

  const openAuth = (view: 'login' | 'sign_up') => { setAuthView(view); setIsAuthOpen(true) }
  const storeInitial = gymDetails.name.charAt(0).toUpperCase()
  const userName = currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0] || 'Entrenador'

  if (loadingGym) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-amber-500/30 p-6">
      
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-3xl">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl relative group overflow-hidden min-h-[500px] flex items-center">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50"></div>

              {/* MODO ÉXITO */}
              {successMode ? (
                  <div className="w-full p-12 md:p-20 text-center animate-in zoom-in slide-in-from-bottom-10 duration-700 relative leading-none">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none animate-pulse"></div>
                      
                      {/* LOGO TIENDA */}
                      <div className="relative w-40 h-40 mx-auto mb-8">
                          <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping opacity-50"></div>
                          <div className="relative w-full h-full bg-slate-900 rounded-full flex items-center justify-center border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.4)] overflow-hidden p-6 bg-white/5">
                            {gymDetails.logo_url ? (
                                <img src={gymDetails.logo_url} alt={gymDetails.name} className="w-full h-full object-contain drop-shadow-xl" />
                            ) : (
                                <Crown size={64} className="text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
                            )}
                          </div>
                      </div>

                      <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 drop-shadow-2xl">
                          ¡YA ERES PRO!
                      </h1>

                      <p className="text-xl text-slate-300 mb-12 max-w-lg mx-auto leading-relaxed">
                          Has desbloqueado el acceso total gracias a <strong className="text-white text-2xl block mt-2">{gymDetails.name}</strong>
                      </p>
                      <button onClick={() => router.push('/profile')} className="px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-lg uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                          Ir a mi Perfil PRO <ArrowRight size={20} />
                      </button>
                  </div>
              ) : (
                  /* MODO INVITACIÓN */
                  <div className="flex flex-col md:flex-row w-full h-full">
                      <div className="md:w-5/12 bg-white/5 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-50"></div>
                          <div className="relative w-40 h-40 mb-6 z-10">
                              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse"></div>
                              <div className="relative w-full h-full bg-slate-900 border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-6 bg-white/5">
                                  {gymDetails.logo_url ? (
                                      <img src={gymDetails.logo_url} className="w-full h-full object-contain"/>
                                  ) : (
                                      <span className="text-6xl font-black text-amber-500">{storeInitial}</span>
                                  )}
                              </div>
                          </div>
                          <div className="text-center z-10">
                              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Invitación de</h2>
                              <h1 className="text-2xl font-black italic text-white leading-tight">{gymDetails.name}</h1>
                          </div>
                      </div>

                      <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center py-12">
                          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Sparkles className="text-amber-400" size={20} /> Tu Pase de Gimnasio incluye:</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex items-start gap-3"><Crown size={18} className="text-amber-500 mt-0.5 shrink-0" /><div><span className="block text-sm font-bold text-white">Estatus PRO</span><span className="text-[10px] text-slate-400">Sin coste mensual</span></div></div>
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex items-start gap-3"><Layers size={18} className="text-amber-500 mt-0.5 shrink-0" /><div><span className="block text-sm font-bold text-white">Álbumes Ilimitados</span><span className="text-[10px] text-slate-400">Crea sin fin</span></div></div>
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex items-start gap-3"><ShieldCheck size={18} className="text-amber-500 mt-0.5 shrink-0" /><div><span className="block text-sm font-bold text-white">Cámara Acorazada</span><span className="text-[10px] text-slate-400">Para tus Slabs</span></div></div>
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex items-start gap-3"><CheckCircle2 size={18} className="text-amber-500 mt-0.5 shrink-0" /><div><span className="block text-sm font-bold text-white">Soporte Prioritario</span><span className="text-[10px] text-slate-400">Canal directo</span></div></div>
                          </div>
                          <div className="mt-auto">
                              {currentUser ? (
                                  <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-2xl mb-4 relative overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50 animate-pulse"></div>
                                      <div className="flex items-center gap-3 mb-4 text-amber-400 text-sm font-mono relative z-10"><UserCheck size={16} /> Sesión como <strong>{userName}</strong></div>
                                      <button onClick={handleApplyToCurrentAccount} disabled={isApplying} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-amber-900/40 flex items-center justify-center gap-2 relative z-10">{isApplying ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> Canjear para mi cuenta</>}</button>
                                  </div>
                              ) : (
                                  <div className="space-y-3">
                                      <button onClick={() => openAuth('sign_up')} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-amber-900/40 flex items-center justify-center gap-2"><Sparkles size={18} /> Canjear y Crear Cuenta</button>
                                      <button onClick={() => openAuth('login')} className="w-full py-3 bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"><LogIn size={14} /> Ya tengo cuenta</button>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
          {!successMode && (
              <div className="mt-6 flex justify-between items-center px-4">
                  <button onClick={() => router.back()} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"><ArrowLeft size={14} /> Cancelar</button>
                  <p className="text-[10px] text-slate-600 font-mono uppercase">CÓDIGO: {promoCode}</p>
              </div>
          )}
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultView={authView} />
    </div>
  )
}