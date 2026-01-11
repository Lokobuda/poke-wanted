'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Mail, Lock, User, ShieldCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'

export default function NewGamePage() {
  const router = useRouter()
  
  // ESTADOS DEL FORMULARIO
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [isRegistering, setIsRegistering] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [isCheckingVerif, setIsCheckingVerif] = useState(false)

  // --- NUEVA LÓGICA: VERIFICAR SI YA CONFIRMÓ EL MAIL ---
  const checkVerification = async () => {
      setIsCheckingVerif(true)
      
      // Intentamos iniciar sesión con los datos que ya están en el formulario
      const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
      })

      if (data?.session) {
          // ¡BINGO! Ya ha verificado
          toast.success(`¡Todo listo, ${username}!`, {
             description: 'Tu perfil ha sido activado.'
          })
          router.push('/profile?new=true')
      } else {
          // Aún no (o error)
          setIsCheckingVerif(false)
          toast.info('Aún no detectamos la activación', {
              description: 'Asegúrate de hacer clic en el enlace que te enviamos al correo.'
          })
      }
  }

  const handleRegistration = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || !password || !username) return

      setIsRegistering(true)

      try {
          // 1. CREAR EL USUARIO
          const { data: authData, error: authError } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { username: username } }
          })

          if (authError) throw authError

          if (authData.user) {
              // 2. GUARDAR PERFIL (INDIE por defecto)
              await supabase.from('profiles').upsert({
                  id: authData.user.id,
                  email: email,
                  username: username,
                  subscription_status: 'INDIE'
              })

              // 3. RESPUESTA
              if (authData.session) {
                  toast.success(`¡Bienvenido, ${username}!`)
                  router.push('/profile?new=true')
              } else {
                  setNeedsConfirmation(true)
              }
          }

      } catch (error: any) {
          toast.error('Error al crear cuenta', { description: error.message })
      } finally {
          setIsRegistering(false)
      }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-violet-500/30">
      
      {/* FONDO ANIMADO */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 mix-blend-screen z-0" style={{ backgroundImage: "url('/images/holo-map-bg.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90 z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] overflow-hidden perspective-grid-container opacity-30 z-20">
             <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000_100%)] z-30"></div>
             <div className="grid-floor animate-grid-move"></div>
        </div>
      </div>

      <div className="relative z-30 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        
        {/* CABECERA */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-lg">
                NUEVA PARTIDA
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-mono uppercase tracking-widest">
                Crea tu identidad de coleccionista
            </p>
        </div>

        {/* TARJETA */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-[30px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-20 group-hover:opacity-40 transition duration-1000 blur-lg rounded-[30px]" />
            
            <div className="relative z-10">
                {needsConfirmation ? (
                    // --- PANTALLA DE CONFIRMACIÓN MEJORADA ---
                    <div className="text-center py-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50 relative">
                            <Sparkles className="text-emerald-400" size={32} />
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Confirma tu correo!</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Hemos enviado un enlace mágico a <span className="text-white font-bold">{email}</span>.
                            <br/>Haz clic en él y luego pulsa el botón de abajo.
                        </p>
                        
                        <button 
                            onClick={checkVerification}
                            disabled={isCheckingVerif}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 mb-4"
                        >
                            {isCheckingVerif ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            {isCheckingVerif ? 'Verificando...' : 'Ya he verificado el correo'}
                        </button>

                        <button onClick={() => router.push('/')} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">
                            Volver al Inicio (Cancelar)
                        </button>
                    </div>
                ) : (
                    // --- FORMULARIO DE REGISTRO ---
                    <form onSubmit={handleRegistration} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider pl-1">Nombre de Entrenador</label>
                            <div className="relative group/field">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-violet-400 transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej: Ash Ketchum"
                                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 focus:bg-slate-900 transition-all placeholder:text-slate-600 font-bold"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Correo Electrónico</label>
                            <div className="relative group/field">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-violet-400 transition-colors" size={16} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="tu@email.com"
                                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Contraseña</label>
                            <div className="relative group/field">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-violet-400 transition-colors" size={16} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={isRegistering}
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-violet-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                            >
                                {isRegistering ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} className="group-hover/btn:scale-110 transition-transform"/>}
                                Crear Perfil
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
        
        {!needsConfirmation && (
            <div className="mt-8 text-center">
                <Link href="/" className="flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest">
                    <ArrowLeft size={12} /> Volver
                </Link>
            </div>
        )}

      </div>

      <style jsx>{`
        .perspective-grid-container { perspective: 600px; }
        .grid-floor {
            position: absolute; top: 0; left: -50%; right: -50%; bottom: 0;
            background-image: linear-gradient(to right, rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 92, 246, 0.3) 1px, transparent 1px);
            background-size: 60px 60px;
            transform-origin: 50% 0; transform: rotateX(60deg);
            animation: gridMove 20s linear infinite;
            mask-image: linear-gradient(to bottom, transparent 0%, black 40%, black 100%);
        }
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
      `}</style>
    </div>
  )
}