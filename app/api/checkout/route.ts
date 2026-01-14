import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  console.log("--- INICIO PROCESO DE PAGO (PLAN DE EMERGENCIA) ---");
  
  try {
    const cookieStore = await cookies();

    // 1. Cliente Supabase (Base)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { },
        },
      }
    );

    let user = null;

    // INTENTO A: Cookies (Estándar)
    const { data: { user: userFromCookie } } = await supabase.auth.getUser();
    if (userFromCookie) {
        user = userFromCookie;
        console.log("✅ Usuario autenticado por Cookie");
    } else {
        // INTENTO B: Cabecera Authorization (Plan de Emergencia)
        console.warn("⚠️ Cookie falló. Buscando token manual en cabeceras...");
        const authHeader = req.headers.get('Authorization');
        
        if (authHeader) {
            const token = authHeader.split(' ')[1]; // Quitamos 'Bearer '
            const { data: { user: userFromToken }, error } = await supabase.auth.getUser(token);
            
            if (userFromToken) {
                user = userFromToken;
                console.log("✅ Usuario autenticado por Token Manual");
            } else {
                console.error("❌ Token manual inválido:", error?.message);
            }
        }
    }

    if (!user) {
      console.error("❌ ERROR FINAL: Imposible identificar al usuario por ningún método.");
      return new NextResponse('No autorizado', { status: 401 });
    }

    console.log(`👤 USUARIO: ${user.email}`);

    // --- CONFIGURACIÓN DE STRIPE ---
    const priceId = process.env.STRIPE_PRICE_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!priceId || !baseUrl) {
      return new NextResponse('Error config servidor', { status: 500 });
    }

    // --- GESTIÓN DE CLIENTE (Customer) ---
    const { data: customerData } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = customerData?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("🆕 Creando cliente en Stripe...");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      stripeCustomerId = customer.id;

      await supabase
        .from('customers')
        .insert({ id: user.id, stripe_customer_id: stripeCustomerId });
    }

    // --- CREAR SESIÓN DE PAGO ---
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/profile?payment=success`,
      cancel_url: `${baseUrl}/profile?payment=cancelled`,
      metadata: { userId: user.id },
    });

    console.log("🚀 URL GENERADA:", session.url);
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('🔥 CRASH:', error.message);
    return new NextResponse('Error interno: ' + error.message, { status: 500 });
  }
}