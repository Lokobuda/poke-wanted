// app/api/get-prices/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId');
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '10';

  if (!setId) {
    return NextResponse.json({ error: 'Falta el Set ID' }, { status: 400 });
  }

  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}&select=id,cardmarket`;
    
    // AUMENTADO: De 8000 a 40000 (40 segundos) para que no corte la llamada
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'PokeWanted/1.0' },
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Error API Pokémon: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    // Si es un error de aborto, lo decimos claro
    if (error.name === 'AbortError') {
       return NextResponse.json({ error: 'La API externa tardó demasiado (Timeout 40s)' }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}