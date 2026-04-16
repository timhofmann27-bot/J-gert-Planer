import { format, parseISO } from 'date-fns';

export interface TransitLeg {
  mode: 'train' | 'bus' | 'walk' | 'subway' | 'tram';
  line?: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
}

export interface TransitConnection {
  id: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
  transfers: number;
  legs: TransitLeg[];
  price?: string;
}

export async function fetchTransitConnections(from: string, to: string): Promise<TransitConnection[]> {
  try {
    const params = new URLSearchParams();
    params.append('results', '3');
    params.append('stopovers', 'false');

    // Helper to detect coordinates
    const isCoords = (str: string) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(str);

    if (isCoords(from)) {
      const [lat, lon] = from.split(',');
      params.append('from.latitude', lat);
      params.append('from.longitude', lon);
      params.append('from.name', 'Aktueller Standort');
    } else {
      params.append('from', from);
    }

    if (isCoords(to)) {
      const [lat, lon] = to.split(',');
      params.append('to.latitude', lat);
      params.append('to.longitude', lon);
      params.append('to.name', 'Ziel');
    } else {
      params.append('to', to);
    }

    const response = await fetch(`https://v6.db.transport.rest/journeys?${params.toString()}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Transit API Error:', errData);
      throw new Error(errData.message || 'Route could not be calculated');
    }
    
    const data = await response.json();
    
    if (!data.journeys || data.journeys.length === 0) {
      return [];
    }

    return data.journeys.map((j: any) => {
      const dep = parseISO(j.legs[0].departure);
      const arr = parseISO(j.legs[j.legs.length - 1].arrival);
      
      return {
        id: j.refreshToken || Math.random().toString(),
        departure: j.legs[0].departure,
        arrival: j.legs[j.legs.length - 1].arrival,
        duration: Math.round((arr.getTime() - dep.getTime()) / 60000),
        transfers: j.legs.filter((l: any) => l.mode !== 'walking').length - 1,
        legs: j.legs.map((l: any) => ({
          mode: l.mode === 'walking' ? 'walk' : (l.line?.product || 'bus'),
          line: l.line?.name || l.line?.label,
          departure: l.departure,
          arrival: l.arrival,
          duration: Math.round((parseISO(l.arrival).getTime() - parseISO(l.departure).getTime()) / 60000)
        })),
        price: j.price?.amount ? `${j.price.amount} ${j.price.currency}` : undefined
      };
    });
  } catch (error) {
    console.error('Transit fetch error:', error);
    // Return empty array for fallback to trigger "No connection found"
    return [];
  }
}
