import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  console.log("--- 💳 INICIO CHECKOUT (MODO PRODUCCIÓN) ---");
  
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
    } else {
        // INTENTO B: Cabecera Authorization (Plan de Emergencia)
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.split(' ')[1]; 
            const { data: { user: userFromToken } } = await supabase.auth.getUser(token);
            if (userFromToken) user = userFromToken;
        }
    }

    if (!user) {
      console.error("❌ ERROR: Usuario no autenticado.");
      return new NextResponse('No autorizado', { status: 401 });
    }

    console.log(`👤 Usuario: ${user.email}`);

    // --- 2. CONFIGURACIÓN DE STRIPE (VALIDACIÓN CRÍTICA) ---
    // En producción, estas variables SON VITALES.
    const priceId = process.env.STRIPE_PRICE_ID; 
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!priceId) {
        console.error("❌ FATAL: Falta STRIPE_PRICE_ID en las variables de entorno.");
        return new NextResponse('Configuración de precio no encontrada', { status: 500 });
    }
    
    if (!baseUrl) {
        console.error("❌ FATAL: Falta NEXT_PUBLIC_BASE_URL en las variables de entorno.");
        return new NextResponse('Configuración de URL base no encontrada', { status: 500 });
    }

    // --- 3. GESTIÓN DE CLIENTE (Customer) ---
    const { data: customerData } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = customerData?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("🆕 Creando nuevo cliente en Stripe...");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      stripeCustomerId = customer.id;

      await supabase
        .from('customers')
        .insert({ id: user.id, stripe_customer_id: stripeCustomerId });
    }

    // --- 4. CREAR SESIÓN DE PAGO ---
    console.log(`🚀 Creando sesión con precio: ${priceId}`);
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/profile?payment=success`,
      cancel_url: `${baseUrl}/profile?payment=cancelled`,
      metadata: { userId: user.id },
      // Opcional: Permite códigos de promoción si los configuras en Stripe
      allow_promotion_codes: true, 
    });

    console.log("✅ URL de pago generada:", session.url);
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('🔥 CRASH EN CHECKOUT:', error.message);
    // Devolvemos el mensaje de error para verlo en el network tab del navegador si falla
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}