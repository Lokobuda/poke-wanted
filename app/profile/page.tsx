'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation' 
import { supabase } from '../../lib/supabase'
import { 
  Loader2, Disc, Share2,
  CheckCircle2, X, Sparkles, ChevronDown, ChevronLeft, ChevronRight,
  Layers, BarChart3, Trophy, Target, Filter, Search, FolderOpen, 
  ShieldCheck, Package, Lock, 
  Ticket, CreditCard, Zap, ArrowLeft, Copy
} from 'lucide-react'
import { toPng } from 'html-to-image'
import download from 'downloadjs'
import { toast } from 'sonner'
import ConfirmModal from '../components/ConfirmModal'

// COMPONENTES
import ProfileHeader from './components/ProfileHeader'
import StarterSelector from '../components/StarterSelector'
import TutorialOverlay, { TutorialStep } from '../components/TutorialOverlay'

// UTILIDADES
import { getCardScore } from '../../lib/scoring'
import { RANKS, STARTER_PATHS } from '../../lib/ranks'

const RARITY_TRANSLATIONS: Record<string, string> = {
  'Common': 'Común', 'Uncommon': 'Infrecuente', 'Rare': 'Rara', 'Double Rare': 'Doble Rara',
  'Ultra Rare': 'Ultra Rara', 'Illustration Rare': 'Ilustración Rara', 'Special Illustration Rare': 'Ilustración Especial Rara',
  'Hyper Rare': 'Híper Rara', 'Secret Rare': 'Secreta', 'Promo': 'Promo', 'Rare Holo': 'Rara Holo',
  'Rare Holo V': 'Rara Holo V', 'Rare Holo VMAX': 'Rara Holo VMAX', 'Rare Ultra': 'Ultra Rara',
  'Rare Secret': 'Secreta Rara', 'Classic Collection': 'Colección Clásica', 'Radiant Rare': 'Radiante'
}

const PROFILE_STEPS: TutorialStep[] = [
  { targetId: 'tour-start', title: '¡Hola, coleccionista! 👋', text: 'Veo que acabas de aterrizar. Tu perfil es tu cuartel general.', action: '¡Dale caña!', position: 'center' },
  { targetId: 'tour-rank', title: 'Tu Nivel de Prestigio 👑', text: 'Sube de nivel consiguiendo cartas y completando sets para demostrar quién manda.', action: 'Entendido', position: 'bottom' },
  { targetId: 'tour-stats', title: 'Tus Estadísticas 📊', text: 'Un vistazo rápido a tu progreso global. Cantidad total de cartas, puntuación Hunter y porcentaje total completado.', action: 'Siguiente', position: 'bottom' },
  { targetId: 'tour-projects', title: 'Centro de Proyectos 📁', text: 'Aquí viven tus Álbumes, tu Cámara Acorazada (para cartas gradeadas) y tu Almacén Sellado.', action: '¡Genial!', position: 'top' },
  { targetId: 'tour-wanted', title: 'Wanted List 🎯', text: 'Selecciona las cartas que te faltan para generar un póster de búsqueda y compartirlo.', action: '¡Entendido!', position: 'top' },
  { targetId: 'tour-create-btn', title: 'Tu Primera Misión 🚀', text: 'Haz clic en el botón de crear álbum para empezar tu primera colección.', action: 'Vamos allá', position: 'bottom' }
]

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [dbProfile, setDbProfile] = useState<any>(null) 
  
  const [collectorScore, setCollectorScore] = useState(0)
  const [currentRank, setCurrentRank] = useState<any>(RANKS[0])
  const [nextRank, setNextRank] = useState<any>(RANKS[1])
  const [starterData, setStarterData] = useState<{gen: string, type: string} | null>(null)
  const [subscriptionType, setSubscriptionType] = useState<'INDIE' | 'GYM' | 'PRO'>('INDIE')
  const [gymData, setGymData] = useState<{name: string, logo_url?: string | null} | null>(null)
  
  // NUEVO ESTADO: Ofertas de la tienda
  const [gymOffers, setGymOffers] = useState<any[]>([])
  
  const [showStarterSelector, setShowStarterSelector] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const isTutorialChecked = useRef(false) 
  
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [redeemMode, setRedeemMode] = useState<'CODE' | 'SUBSCRIPTION'>('SUBSCRIPTION')
  const [redeemCode, setRedeemCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  
  const [stats, setStats] = useState({ totalCards: 0, totalAlbums: 0, globalCompletion: 0, projectsProgress: [] as any[], gradedCount: 0 })
  const [missingCards, setMissingCards] = useState<any[]>([])

  const [filterSet, setFilterSet] = useState<string>('ALL')
  const [filterRarity, setFilterRarity] = useState<string>('ALL')
  const [filterAlbum, setFilterAlbum] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const [selectedForOrder, setSelectedForOrder] = useState<string[]>([])
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isPosterMode, setIsPosterMode] = useState(false)
  const [posterPage, setPosterPage] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null)
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false)
  
  useEffect(() => {
    const checkTutorial = async () => {
        if (isTutorialChecked.current) return;
        const localCompleted = typeof window !== 'undefined' ? localStorage.getItem('tutorial_completed') === 'true' : false
        if (localCompleted) { isTutorialChecked.current = true; return; }
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profiles } = await supabase.from('profiles').select('has_completed_tutorial, starter_gen').eq('id', session.user.id).limit(1)
            const profile = profiles?.[0]
            if (profile?.has_completed_tutorial) { localStorage.setItem('tutorial_completed', 'true') } 
            else if (profile?.starter_gen && !profile?.has_completed_tutorial) { setShowTutorial(true) }
        }
        isTutorialChecked.current = true;
    }
    checkTutorial()
  }, [])

  useEffect(() => {
    if (!searchParams) return;
    const openPro = searchParams.get('open_pro')
    if (openPro === 'true') { setIsRedeemOpen(true); router.replace('/profile', { scroll: false }) }
    
    // GESTIÓN RETORNO STRIPE
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
        toast.success('¡Bienvenido al Club PRO!', { description: 'Tu suscripción se ha activado correctamente.' })
        router.replace('/profile', { scroll: false })
        setTimeout(() => window.location.reload(), 1500)
    } else if (paymentStatus === 'cancelled') {
        toast.info('Proceso de pago cancelado')
        router.replace('/profile', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => { 
      let mounted = true; 
      const runFetch = async () => { await fetchProfileData(mounted) }
      runFetch()
      return () => { mounted = false }
  }, [searchParams]) 

  const uniqueSets = useMemo(() => { const sets = missingCards.map(c => ({ id: c.setId, name: c.setName })); const unique = sets.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); return unique.sort((a, b) => a.name.localeCompare(b.name)) }, [missingCards])
  const uniqueRarities = useMemo(() => { return [...new Set(missingCards.map(c => c.rarity))].filter(Boolean).sort() }, [missingCards])
  const filteredCards = useMemo(() => { return missingCards.filter(card => { const matchSet = filterSet === 'ALL' || card.setId === filterSet; const matchRarity = filterRarity === 'ALL' || card.rarity === filterRarity; const matchAlbum = filterAlbum === 'ALL' || card.albumIds.includes(filterAlbum); const matchSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || card.setName.toLowerCase().includes(searchQuery.toLowerCase()); return matchSet && matchRarity && matchAlbum && matchSearch }) }, [missingCards, filterSet, filterRarity, filterAlbum, searchQuery])
  
  const toggleSelectCard = (id: string) => setSelectedForOrder(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const handleLoadMore = () => setVisibleCount(prev => prev + 50)
  const handleOpenPosterMode = () => { if (selectedForOrder.length === 0) return toast.warning("Selecciona al menos una carta."); setPosterPage(0); setIsPosterMode(true) }
  const handleInteractiveDownload = async (totalPages: number) => { if (isDownloading) return; setIsDownloading(true); setDownloadSuccess(false); try { const initialPage = posterPage; for (let i = 0; i < totalPages; i++) { setPosterPage(i); await new Promise(resolve => setTimeout(resolve, 1000)); const posterNode = document.getElementById('visible-poster'); if (posterNode) { const dataUrl = await toPng(posterNode, { quality: 1.0, pixelRatio: 2, cacheBust: true }); setFlashActive(true); setTimeout(() => setFlashActive(false), 150); download(dataUrl, `pokebinders-wanted-${username}-${i + 1}.png`); await new Promise(resolve => setTimeout(resolve, 500)); } } setPosterPage(initialPage); setDownloadSuccess(true); setTimeout(() => { setDownloadSuccess(false); setIsDownloading(false) }, 3000); } catch (error) { console.error('Error:', error); toast.error('Error al descargar póster'); setIsDownloading(false) } }

  const fetchProfileData = async (mounted: boolean = true) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !mounted) return
      setUser(session.user)

      const { data: profiles, error: profileError } = await supabase.from('profiles').select(`*, gyms (name, logo_url)`).eq('id', session.user.id).limit(1)
      const profile = profiles?.[0]
      if (profileError && profileError.code !== 'PGRST116') toast.error(`Error: ${profileError.message}`)
      if (!mounted) return
      setDbProfile(profile) 

      let currentStatus: 'INDIE' | 'GYM' | 'PRO' = 'INDIE'; 
      if (profile) {
        if (profile.starter_gen && profile.starter_type) { setStarterData({ gen: profile.starter_gen, type: profile.starter_type }) } else { setShowStarterSelector(true) }
        
        if (profile.subscription_status === 'GYM') { 
          currentStatus = 'GYM'; 
          if (profile.gyms) { 
              const g: any = profile.gyms; 
              setGymData({ name: g.name, logo_url: g.logo_url }) 
          }
          if (profile.gym_id) {
              const { data: offers } = await supabase
                .from('gym_offers')
                .select('*')
                .eq('gym_id', profile.gym_id)
                .eq('is_active', true)
              if (offers) setGymOffers(offers)
          }

        } else if (profile.subscription_status === 'PRO') { 
            currentStatus = 'PRO'; 
        }
      } else { setShowStarterSelector(true) }
      setSubscriptionType(currentStatus)

      const { data: setsData } = await supabase.from('sets').select('id, name')
      const setsMap = new Map<string, string>(); setsData?.forEach((s: any) => setsMap.set(s.id, s.name))

      const { data: inventoryData } = await supabase.from('inventory').select('card_id, quantity_normal, quantity_holo, quantity_reverse').eq('user_id', session.user.id)
      const inventoryMap = new Map(); inventoryData?.forEach((item: any) => inventoryMap.set(item.card_id, item))

      const { count: gradedCount } = await supabase.from('graded_cards').select('id', { count: 'exact' }).eq('user_id', session.user.id)
      const { count: sealedCount } = await supabase.from('sealed_products').select('id', { count: 'exact' }).eq('user_id', session.user.id)

      const totalGraded = gradedCount || 0; 
      const totalSealed = sealedCount || 0
      const gradedScoreBoost = totalGraded * 50; 
      const sealedScoreBoost = totalSealed * 20 

      const { data: albumsData } = await supabase.from('albums').select(`id, name, is_master_set, set_id, created_at, album_cards (acquired, card_variants (id, image_url, cards (name, set_id, collector_number, rarity)))`).eq('user_id', session.user.id).order('created_at', { ascending: false })

      let totalCardsOwned = 0; let totalSlotsTracked = 0; let totalOwnedInTracked = 0; let totalScore = 0
      const projectsList: any[] = []
      const missingMap = new Map()

      projectsList.push({ id: 'graded-vault', name: 'Cámara Acorazada', type: 'Slabs Graded', owned: totalGraded, total: totalGraded, percent: 100, isVault: true, isLocked: currentStatus === 'INDIE' })
      projectsList.push({ id: 'sealed-collection', name: 'Almacén Sellado', type: 'Sealed Products', owned: totalSealed, total: totalSealed, percent: 100, isSealed: true, isLocked: currentStatus === 'INDIE' })

      albumsData?.forEach((album: any) => {
        const totalInAlbum = album.album_cards.length; let ownedInAlbum = 0
        album.album_cards.forEach((c: any) => {
          const variant = c.card_variants
          if (variant && variant.cards) {
            const cardInfo = Array.isArray(variant.cards) ? variant.cards[0] : variant.cards;
            if (cardInfo) {
                const invItem = inventoryMap.get(variant.id)
                const globalTotal = (invItem?.quantity_normal || 0) + (invItem?.quantity_holo || 0) + (invItem?.quantity_reverse || 0)
                if (globalTotal > 0) { ownedInAlbum++; totalCardsOwned++; totalScore += getCardScore({ set_id: cardInfo.set_id, card_number: cardInfo.collector_number, rarity: cardInfo.rarity, name: cardInfo.name }) } 
                else { if (missingMap.has(variant.id)) { const existing = missingMap.get(variant.id); if (!existing.albumIds.includes(album.id)) existing.albumIds.push(album.id) } else { missingMap.set(variant.id, { id: variant.id, name: cardInfo.name, image: variant.image_url, number: cardInfo.collector_number, setId: cardInfo.set_id, setName: setsMap.get(cardInfo.set_id) || cardInfo.set_id, rarity: cardInfo.rarity, albumIds: [album.id] }) } }
            }
          }
        })
        if (totalInAlbum > 0) { const percent = Math.round((ownedInAlbum / totalInAlbum) * 100); projectsList.push({ id: album.id, name: album.name, type: album.is_master_set ? 'Oficial' : 'Personal', owned: ownedInAlbum, total: totalInAlbum, percent: percent, isLocked: false, setId: album.set_id }); totalSlotsTracked += totalInAlbum; totalOwnedInTracked += ownedInAlbum }
      })

      const finalScore = totalScore + gradedScoreBoost + sealedScoreBoost
      setCollectorScore(finalScore)
      setStats({ totalCards: totalCardsOwned, totalAlbums: albumsData?.length || 0, globalCompletion: totalSlotsTracked > 0 ? Math.round((totalOwnedInTracked / totalSlotsTracked) * 100) : 0, projectsProgress: projectsList, gradedCount: totalGraded })
      setMissingCards(Array.from(missingMap.values()))

      let rankIndex = 0; for (let i = 0; i < RANKS.length; i++) { if (finalScore >= RANKS[i].min) rankIndex = i }
      setCurrentRank(RANKS[rankIndex]); setNextRank(RANKS[rankIndex + 1] || null)

    } catch (error) { console.error(error); toast.error('Error al cargar perfil') } finally { if(mounted) setLoading(false) }
  }

  // --- LOGICA SUSCRIPCIÓN CORREGIDA (PLAN DE EMERGENCIA) ---
  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
        // 1. OBTENEMOS EL TOKEN DE SESIÓN MANUALMENTE
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            throw new Error('No se encontró sesión activa. Por favor, recarga e inicia sesión.');
        }

        // 2. ENVIAMOS EL TOKEN EN LA CABECERA 'Authorization'
        const response = await fetch('/api/checkout', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- ESTO ES LA CLAVE
            }
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(errorMsg || 'Error desconocido del servidor');
        }

        const data = await response.json();
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No se recibió la URL de pago');
        }
    } catch (error: any) {
        console.error(error);
        toast.error('Error de pago', { description: error.message || 'Comprueba la consola para más detalles.' });
        setIsSubscribing(false);
    }
  }

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault(); if (!redeemCode.trim()) return; setIsRedeeming(true)
    try { const { data, error } = await supabase.rpc('claim_gym_access', { input_code: redeemCode.trim() }); if (error) throw error; if (data && data.success) { router.push(`/store-landing?code=${redeemCode.trim()}&redeemed=true`) } else { toast.error('Código inválido', { description: data?.error || 'Revisa el código.' }); setIsRedeeming(false) } } catch (err: any) { toast.error('Error', { description: err.message }); setIsRedeeming(false) }
  }
  
  const handleCopyOffer = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('¡Código copiado!', {
        description: 'Muéstralo en caja o úsalo en la web.',
        icon: '🎟️'
    })
  }

  const getBuddyImage = () => {
      if (!starterData) return null
      let genKey = starterData.gen; if (!genKey.startsWith('gen')) genKey = `gen${genKey}`
      const genPaths = STARTER_PATHS[genKey]; if (!genPaths) return null
      const typePaths = genPaths[starterData.type]; if (!typePaths) return null
      return typePaths[currentRank.id] || typePaths[1] || Object.values(typePaths)[0] || null
  }

  const handleConfirmDeleteAlbum = async () => { if (!albumToDelete) return; setIsDeletingAlbum(true); const { error } = await supabase.from('albums').delete().eq('id', albumToDelete); if (!error) setStats(prev => ({ ...prev, projectsProgress: prev.projectsProgress.filter(p => p.id !== albumToDelete), totalAlbums: Math.max(0, prev.totalAlbums - 1) })); setIsDeletingAlbum(false); setAlbumToDelete(null) }
  const handleStarterSelect = async (gen: string, type: string) => { const { data: { session } } = await supabase.auth.getSession(); if (!session) return; const cleanGen = gen.startsWith('gen') ? gen : `gen${gen}`; const { error } = await supabase.from('profiles').upsert({ id: session.user.id, starter_gen: cleanGen, starter_type: type }, { onConflict: 'id' }); if (!error) { setStarterData({ gen: cleanGen, type }); setShowStarterSelector(false); setShowTutorial(true); fetchProfileData() } }

  const handleFinishTutorial = async () => {
    localStorage.setItem('tutorial_completed', 'true')
    localStorage.setItem('tutorial_phase', 'creating')
    setShowTutorial(false)
    try { 
        const { data: { session } } = await supabase.auth.getSession(); 
        if (session) await supabase.from('profiles').update({ has_completed_tutorial: true }).eq('id', session.user.id) 
    } catch (err) { console.log("Error guardando tutorial") }
    router.push('/create', { scroll: false })
  }

  const closeTutorialPermanently = async () => { setShowTutorial(false); localStorage.setItem('tutorial_completed', 'true'); try { const { data: { session } } = await supabase.auth.getSession(); if (session) await supabase.from('profiles').update({ has_completed_tutorial: true }).eq('id', session.user.id) } catch (err) { console.log("Error guardando tutorial skip") } }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>
  
  const username = dbProfile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Coleccionista'
  const buddyImage = getBuddyImage()
  
  const showPartnerSpace = subscriptionType === 'GYM' && gymData && gymOffers.length > 0
  
  const gridLayoutClass = showPartnerSpace ? 'md:grid-cols-2' : 'grid-cols-1'

  const PosterTemplate = ({ cards, pageIndex, totalPages }: any) => (
    <div id="visible-poster" className="relative w-[400px] h-[711px] bg-[#0a0a0a] flex flex-col shadow-2xl border border-white/10 overflow-hidden isolate mx-auto transition-all duration-500">
        <div className={`absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-150 ease-out ${flashActive ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-slate-950 -z-30" />
        <div className="absolute inset-0 opacity-20 -z-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="h-[140px] flex flex-col justify-end px-6 pb-2 text-center flex-shrink-0 pl-10 z-20"> 
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none mb-3 drop-shadow-xl whitespace-nowrap">WANTED <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 pr-10 pb-1">LIST</span></h1>
        </div>
        <div className="flex-1 min-h-0 px-6 py-2 flex items-center justify-center z-10">
            <div className="grid grid-cols-3 gap-3 w-full h-full max-h-full">
                {cards.map((card:any) => (<div key={card.id} className="relative aspect-[0.716] rounded-lg overflow-hidden shadow-lg border border-white/10 group bg-slate-900"><img src={card.image} className="w-full h-full object-cover" /></div>))}
                {[...Array(Math.max(0, 9 - cards.length))].map((_, i) => (<div key={`empty-${i}`} className="relative aspect-[0.716] rounded-lg border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center opacity-50"><Target size={10} className="text-white/30" /></div>))}
            </div>
        </div>
        <div className="h-[80px] px-8 pb-6 pt-2 flex-shrink-0 z-20 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-lg"><Disc size={14} className="text-violet-400" /><p className="text-[10px] font-black text-white tracking-widest uppercase truncate max-w-[150px]">@{username}</p></div>
            {totalPages > 1 && <p className="text-[8px] text-white/30 font-mono tracking-widest">PÁGINA {pageIndex + 1} DE {totalPages}</p>}
        </div>
    </div>
  )

  if (isPosterMode) {
     const selectedCardsList = missingCards.filter(c => selectedForOrder.includes(c.id)); const CARDS_PER_PAGE = 9; const totalPages = Math.ceil(selectedCardsList.length / CARDS_PER_PAGE); const currentCards = selectedCardsList.slice(posterPage * CARDS_PER_PAGE, (posterPage + 1) * CARDS_PER_PAGE);
     return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50 pointer-events-none">
                <button onClick={() => setIsPosterMode(false)} disabled={isDownloading} className="pointer-events-auto text-white/70 hover:text-white flex items-center gap-2 font-bold uppercase text-xs tracking-widest bg-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-colors"><ArrowLeft size={16} /> Editar</button>
                {totalPages > 1 && (<div className="pointer-events-auto flex items-center gap-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 animate-in fade-in zoom-in"><button onClick={() => setPosterPage(p => Math.max(0, p - 1))} disabled={posterPage === 0 || isDownloading} className="p-1 hover:text-violet-400 disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button><span className="text-xs font-bold font-mono text-white min-w-[40px] text-center">{posterPage + 1}/{totalPages}</span><button onClick={() => setPosterPage(p => Math.min(totalPages - 1, p + 1))} disabled={posterPage === totalPages - 1 || isDownloading} className="p-1 hover:text-violet-400 disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button></div>)}
                <button onClick={() => handleInteractiveDownload(totalPages)} disabled={isDownloading || downloadSuccess} className={`pointer-events-auto px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${downloadSuccess ? 'bg-emerald-500' : 'bg-violet-600 hover:bg-violet-500'}`}>{downloadSuccess ? '¡Guardado!' : 'Guardar Todo'}</button>
            </div>
            <div className="flex items-center gap-4 md:gap-8 max-h-screen py-12"><div id="visible-poster-container" className={`transition-transform duration-500 origin-center ${isDownloading ? 'scale-100' : 'scale-[0.85] md:scale-100'}`}><PosterTemplate cards={currentCards} pageIndex={posterPage} totalPages={totalPages} /></div></div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 relative font-sans">
      <StarterSelector isOpen={showStarterSelector} onSelect={handleStarterSelect} />
      {showTutorial && !showStarterSelector && (<TutorialOverlay steps={PROFILE_STEPS} onComplete={handleFinishTutorial} onClose={closeTutorialPermanently} />)}
      
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/10 via-slate-950 to-black" />

      <div className="relative pt-12 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div id="tour-rank" className="flex-1">
                <ProfileHeader username={username} xp={collectorScore} nextLevelXp={nextRank?.min} rankTitle={currentRank.title} subscriptionType={subscriptionType} avatarUrl={buddyImage} gymData={gymData} onEditAvatar={() => setShowStarterSelector(true)} />
            </div>
            {subscriptionType === 'INDIE' && (
                <button onClick={() => setIsRedeemOpen(true)} className="group relative flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 text-amber-400 border border-amber-500/50 px-6 py-3 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] overflow-hidden self-start md:self-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <Zap size={18} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                    <div className="text-left"><p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider leading-none">Mejorar Cuenta</p><p className="text-sm font-black text-amber-300 uppercase tracking-widest leading-none mt-1">ACTIVAR PRO</p></div>
                </button>
            )}
        </div>

        {/* STATS */}
        <div id="tour-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-40">
                <div className="flex justify-between items-start"><div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><Layers size={24} /></div><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Colección</span></div>
                <div><span className="text-4xl font-black text-white">{stats.totalCards}</span><p className="text-slate-400 text-xs mt-1">Cartas totales</p></div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-40 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-fuchsia-500/5"><Trophy size={100} /></div>
                <div className="flex justify-between items-start relative z-10"><div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400"><Trophy size={24} /></div><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Hunter Score</span></div>
                <div className="relative z-10"><span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">{collectorScore}</span><p className="text-slate-400 text-xs mt-1">Puntos de Prestigio</p></div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-40">
                <div className="flex justify-between items-start relative z-10"><div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><BarChart3 size={24} /></div><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Progreso Global</span></div>
                <div><span className="text-4xl font-black text-white">{stats.globalCompletion}%</span><p className="text-slate-400 text-xs mt-1">De tus proyectos activos</p></div>
            </div>
        </div>

        {/* PROYECTOS */}
        {stats.projectsProgress.length > 0 && (
          <div id="tour-projects" className="mb-12 animate-in slide-in-from-bottom-6 duration-700 delay-200">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><CheckCircle2 size={18} className="text-violet-500"/> Proyectos Activos</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {stats.projectsProgress.map((album: any) => {
                 const isLocked = album.isLocked === true
                 const setLogo = album.setId ? `https://images.pokemontcg.io/${album.setId}/logo.png` : null;
                 const isImage = !album.isVault && !album.isSealed && setLogo;
                 let cardStyles = 'border-white/5 hover:border-violet-500/30'; let iconStyles = 'bg-blue-500/10 text-blue-400'; let barColor = album.percent >= 100 ? 'bg-emerald-500' : 'bg-violet-600'; let titleColor = 'text-white group-hover:text-violet-300'; let linkTo = `/album/${album.id}`; let progressText = `${album.percent}%`; let showBottomStats = true;
                 if (album.isVault) { cardStyles = 'border-amber-500/30 bg-amber-900/10'; iconStyles = 'bg-amber-500 text-black'; barColor = 'bg-amber-500'; titleColor = 'text-amber-100 group-hover:text-amber-400'; linkTo = '/graded'; progressText = `${album.owned} JOYAS`; showBottomStats = false; }
                 else if (album.isSealed) { cardStyles = 'border-indigo-500/30 bg-indigo-900/10'; iconStyles = 'bg-indigo-500 text-white'; barColor = 'bg-indigo-500'; titleColor = 'text-indigo-100 group-hover:text-indigo-400'; linkTo = '/sealed'; progressText = `${album.owned} ITEMS`; showBottomStats = false; }
                 if (isLocked) { cardStyles = 'border-white/5 bg-slate-900/50 opacity-60 grayscale-[80%]'; linkTo = '#'; }
                 const paddingClass = isImage ? 'p-0.5' : 'p-2.5';

                 return (
                    <div key={album.id} className="relative group" onClick={() => { if (isLocked) { setIsRedeemOpen(true); toast.info('Acceso Restringido', {description: 'Activa el modo PRO para acceder a esta función.'}); } else { router.push(linkTo) } }}>
                        <div className={`bg-slate-900/30 border p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-800/50 transition-all cursor-pointer group-inner ${cardStyles}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden ${iconStyles} ${paddingClass}`}>
                                {isLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"><Lock size={16} className="text-white"/></div>}
                                {isImage ? <img src={setLogo} alt={album.name} className="w-full h-full object-contain drop-shadow-sm" loading="lazy" /> : (album.isVault ? <ShieldCheck size={20} /> : album.isSealed ? <Package size={20} /> : <Layers size={20} />)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className={`font-bold text-sm transition-colors truncate ${titleColor}`}>{album.name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{isLocked ? 'BLOQUEADO' : album.type}</span>
                                    </div>
                                    <span className={`text-sm font-black flex-shrink-0 ${album.isVault ? 'text-amber-500' : album.isSealed ? 'text-indigo-400' : 'text-white'}`}>{progressText}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${album.percent}%` }} /></div>
                                {showBottomStats && (<p className="text-[10px] text-slate-500 mt-2 text-right">{album.owned} / {album.total} items</p>)}
                            </div>
                        </div>
                    </div>
                 )
               })}
             </div>
          </div>
        )}

        {/* --- GRID MIXTO: WANTED LIST + PARTNER SPACE --- */}
        <div className={`grid grid-cols-1 ${gridLayoutClass} gap-6 mb-12 auto-rows-fr`}>
            
            {/* COLUMNA WANTED LIST */}
            <div id="tour-wanted" className="bg-slate-900/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-full">
                <div className="relative z-10 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black text-white flex items-center gap-3"><Sparkles className="text-violet-400" /> Wanted List</h3></div>
                    {selectedForOrder.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8">
                             <p className="text-slate-400 mb-6 text-center text-sm">No tienes cartas en busca y captura.</p>
                             <button onClick={() => setIsSelectorOpen(true)} className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform">Seleccionar Cartas</button>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1 flex flex-col justify-end">
                            <div className="flex gap-4 overflow-x-auto pb-4">{missingCards.filter(c => selectedForOrder.includes(c.id)).map(c => (<img key={c.id} src={c.image} className="h-32 rounded-lg shadow-lg" />))}</div>
                            <button onClick={handleOpenPosterMode} className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-xl uppercase tracking-widest hover:scale-[1.02] transition-transform"><Share2 size={16} className="inline mr-2" /> Crear Póster</button>
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMNA ESPACIO PARTNER */}
            {showPartnerSpace && gymData && (
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4 duration-700">
                    <div className="relative z-10 flex-1 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-10 h-[36px]">
                            <Ticket size={24} className="text-amber-500" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Espacio <span className="text-amber-400">{gymData.name}</span></h3>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-4">
                            {gymOffers.map((offer) => (
                                <div key={offer.id} className="group relative bg-gradient-to-br from-slate-900 via-black to-slate-900 border border-amber-500/30 rounded-3xl p-6 overflow-hidden hover:border-amber-500/50 transition-all shadow-xl flex-1 flex flex-col justify-between h-full">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={60} /></div>
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-amber-500 rounded-r-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                    
                                    <div className="relative z-10 mb-4 flex-1 flex flex-col justify-center">
                                        <div className="self-start px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 mb-3">
                                            Exclusivo Socios
                                        </div>
                                        <h4 className="text-2xl font-black text-white italic leading-tight mb-2">{offer.title}</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">{offer.description}</p>
                                    </div>
                                    
                                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                                        <div className="flex-1 bg-white/5 rounded-lg px-2 py-3 font-mono text-amber-400 text-sm font-bold tracking-widest border border-dashed border-white/10 text-center select-all truncate">
                                            {offer.code}
                                        </div>
                                        <button onClick={() => handleCopyOffer(offer.code)} className="p-3 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-900/20 active:scale-95 flex-shrink-0">
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
      </div>

      {isSelectorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
                 <div className="p-6 border-b border-white/5 flex flex-col gap-6 bg-slate-900/95 z-20">
                    <div className="flex justify-between items-center">
                        <div><h2 className="text-2xl font-black text-white tracking-tight">Selecciona Objetivos</h2><p className="text-slate-400 text-xs mt-1">Elige las cartas que te faltan para tu Wanted List</p></div>
                        <button onClick={() => setIsSelectorOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type="text" placeholder="Buscar Pokémon..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"/></div>
                        <div className="relative min-w-[200px]"><select value={filterAlbum} onChange={(e) => setFilterAlbum(e.target.value)} className="w-full appearance-none bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"><option value="ALL">Todos los Álbumes</option>{stats.projectsProgress.map(album => !album.isVault && !album.isSealed && (<option key={album.id} value={album.id}>{album.name}</option>))}</select><FolderOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} /></div>
                        <div className="relative min-w-[150px]"><select value={filterSet} onChange={(e) => setFilterSet(e.target.value)} className="w-full appearance-none bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"><option value="ALL">Todos los Sets</option>{uniqueSets.map(set => (<option key={set.id} value={set.id}>{set.name}</option>))}</select><Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} /></div>
                        <div className="relative min-w-[150px]"><select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="w-full appearance-none bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"><option value="ALL">Todas las Rarezas</option>{uniqueRarities.map(r => (<option key={r} value={r}>{RARITY_TRANSLATIONS[r] || r}</option>))}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} /></div>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
                     {filteredCards.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4"><Target size={48} className="opacity-20" /><p>No se encontraron cartas con esos filtros</p></div> : 
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-max">
                             {filteredCards.slice(0, visibleCount).map((c, index) => (
                                 <div key={`${c.id}-${index}`} onClick={() => toggleSelectCard(c.id)} className={`relative aspect-[63/88] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${selectedForOrder.includes(c.id) ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[0.98]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                     <img src={c.image} className="w-full h-full object-cover" loading="lazy" />
                                     {selectedForOrder.includes(c.id) && <div className="absolute inset-0 bg-violet-600/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-200"><div className="bg-violet-600 rounded-full p-2 shadow-lg scale-110"><CheckCircle2 className="text-white" size={24} strokeWidth={3} /></div></div>}
                                 </div>
                             ))}
                         </div>
                     }
                     {visibleCount < filteredCards.length && <div className="mt-8 text-center"><button onClick={handleLoadMore} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest px-6 py-3 border border-white/5 rounded-full hover:bg-white/5 transition-all">Cargar más cartas...</button></div>}
                 </div>
                 <div className="p-4 border-t border-white/5 bg-slate-900 flex justify-between items-center gap-4 z-20">
                     <span className="text-slate-500 text-xs font-bold uppercase tracking-wider pl-2">{selectedForOrder.length} seleccionadas</span>
                     <button onClick={() => setIsSelectorOpen(false)} className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-violet-900/20 transition-all hover:scale-105 active:scale-95">Confirmar Selección</button>
                 </div>
             </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal 
        isOpen={!!albumToDelete}
        onClose={() => setAlbumToDelete(null)}
        onConfirm={handleConfirmDeleteAlbum}
        title="¿Eliminar Álbum?"
        description="Esta acción eliminará el álbum y todas las estadísticas asociadas."
        confirmText="Eliminar Álbum"
        isProcessing={isDeletingAlbum}
        variant="danger"
      />

      {/* --- HUB DE MEMBRESÍA --- */}
      {isRedeemOpen && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-4xl bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px]">
                  {/* ... COLUMNA IZQUIERDA ... */}
                  <div className="w-full md:w-2/5 bg-gradient-to-br from-amber-500/20 via-slate-900 to-black p-8 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                      <div className="relative z-10">
                          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Acceso <span className="text-amber-500">PRO</span></h2>
                          <p className="text-amber-200/60 text-sm font-medium mb-8">Desbloquea todo el potencial de tu colección.</p>
                          <div className="space-y-6">
                              <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                                  <div><h4 className="text-white font-bold text-sm">Cámara Acorazada</h4><p className="text-slate-400 text-xs">Gestiona tus cartas graded (PSA, BGS...)</p></div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform"><Package size={20} /></div>
                                  <div><h4 className="text-white font-bold text-sm">Almacén Sellado</h4><p className="text-slate-400 text-xs">Control de ETBs, Boosters y Cajas.</p></div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><Sparkles size={20} /></div>
                                  <div><h4 className="text-white font-bold text-sm">Sin Límites</h4><p className="text-slate-400 text-xs">Crea tantos álbumes como quieras.</p></div>
                              </div>
                          </div>
                      </div>
                      <div className="mt-auto pt-8 relative z-10">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold"><CheckCircle2 size={12} className="text-amber-500" /> Cancelación flexible</div>
                      </div>
                  </div>

                  {/* ... COLUMNA DERECHA ... */}
                  <div className="w-full md:w-3/5 bg-slate-950 p-8 flex flex-col">
                      <button onClick={() => setIsRedeemOpen(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"><X size={18} /></button>
                      <div className="flex p-1 bg-slate-900 rounded-xl mb-8 self-start border border-white/5">
                          <button onClick={() => setRedeemMode('SUBSCRIPTION')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${redeemMode === 'SUBSCRIPTION' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Suscripción Mensual</button>
                          <button onClick={() => setRedeemMode('CODE')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${redeemMode === 'CODE' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Código de Tienda</button>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                          {redeemMode === 'CODE' ? (
                              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                  <h3 className="text-xl font-bold text-white mb-2">Canjear Acceso</h3>
                                  <p className="text-slate-400 text-sm mb-6">Introduce el código único proporcionado por tu tienda local asociada.</p>
                                  <form onSubmit={handleRedeemCode} className="space-y-4">
                                      <div className="relative group/input">
                                          <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-amber-500 transition-colors" size={20} />
                                          <input type="text" placeholder="CÓDIGO (Ej: CARDZONE)" className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:bg-slate-900 transition-all" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} />
                                      </div>
                                      <button type="submit" disabled={isRedeeming || !redeemCode} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black py-4 rounded-xl text-sm font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                          {isRedeeming ? <Loader2 className="animate-spin" size={18} /> : <>Canjear Código <ChevronRight size={18}/></>}
                                      </button>
                                  </form>
                              </div>
                          ) : (
                              <div className="animate-in fade-in slide-in-from-left-4 duration-300 relative">
                                  {/* AQUÍ YA NO HAY CANDADO :) */}
                                  <div className="opacity-100">
                                      <div className="flex justify-between items-baseline mb-2"><h3 className="text-xl font-bold text-white">Plan Coleccionista</h3><span className="text-2xl font-black text-white">1.99€<span className="text-sm font-medium text-slate-500">/mes</span></span></div>
                                      <p className="text-slate-400 text-sm mb-6">Suscripción mensual flexible. Cancela cuando quieras.</p>
                                      <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mb-6 space-y-3">
                                          <div className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 size={16} className="text-violet-500"/> <span>Acceso completo a la App</span></div>
                                          {/* LINEA DE SOPORTE PRIORITARIO ELIMINADA */}
                                          <div className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 size={16} className="text-violet-500"/> <span>Badge de perfil PRO</span></div>
                                      </div>
                                      <button onClick={handleSubscribe} disabled={isSubscribing} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                         {isSubscribing ? <Loader2 className="animate-spin" size={18}/> : <><CreditCard size={18} /> Suscribirse</>}
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}

// --- EXPORTACIÓN PRINCIPAL ---
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>}>
      <ProfileContent />
    </Suspense>
  )
}