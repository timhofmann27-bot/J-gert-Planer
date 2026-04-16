import { parseISO } from 'date-fns';

/**
 * Core transit interfaces for consistent data handling across UI
 */
export interface TransitLeg {
  mode: 'train' | 'bus' | 'walk' | 'subway' | 'tram' | 'ferry';
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

/**
 * Abstract Transit Provider Interface
 * Allows swapping between DB, VBB, OTP, or Google Maps without changing the UI
 */
export interface TransitProvider {
  fetchJourneys(from: string, to: string, when?: string): Promise<TransitConnection[]>;
}

// Client-side cache for locations and journeys to avoid redundant network calls
const locationCache = new Map<string, string>();
const journeyCache = new Map<string, { data: TransitConnection[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * HAFAS / transport.rest Provider Implementation (Default)
 * Optimized for EU / DE context
 */
class HafasProvider implements TransitProvider {
  // Memoized coordinate check - much faster for high-frequency calls
  private readonly coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
  private isCoords(str: string) { return this.coordRegex.test(str); }

  async fetchJourneys(from: string, to: string, when?: string): Promise<TransitConnection[]> {
    const cacheKey = `${from}-${to}-${when || 'now'}`;
    const cached = journeyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    const params = new URLSearchParams();
    params.append('results', '4');
    params.append('stopovers', 'false');
    if (when) params.append('when', when);

    // Optimized resolution with local caching
    const resolve = async (val: string, type: 'from' | 'to') => {
      if (this.isCoords(val)) {
        const [lat, lon] = val.split(',').map(s => s.trim());
        params.append(`${type}.latitude`, lat);
        params.append(`${type}.longitude`, lon);
        params.append(`${type}.name`, type === 'from' ? 'Start' : 'Ziel');
      } else {
        if (locationCache.has(val)) {
          params.append(type, locationCache.get(val)!);
          return;
        }

        try {
          const locRes = await fetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(val)}&results=1`);
          if (locRes.ok) {
            const locData = await locRes.json();
            if (locData.length > 0 && locData[0].id) {
              const id = locData[0].id;
              locationCache.set(val, id);
              params.append(type, id);
              return;
            }
          }
        } catch (e) {
          console.warn('Location resolution failed:', e);
        }
        params.append(type, val);
      }
    };

    await Promise.all([resolve(from, 'from'), resolve(to, 'to')]);

    // Race strategy: Request from both VBB and DB in parallel to ensure fastest response
    // VBB is optimized for regional, DB for national. Parallelizing reduces total wait time.
    const transportUrls = [
      `https://v6.vbb.transport.rest/journeys?${params.toString()}`,
      `https://v6.db.transport.rest/journeys?${params.toString()}`
    ];

    try {
      // Promise.any returns the first successful fetch, significantly reducing latency
      const fastestResponse = await Promise.any(
        transportUrls.map(url => 
          fetch(url).then(res => {
            if (!res.ok) throw new Error('API down');
            return res.json();
          })
        )
      );
      
      const results = this.parseResponse(fastestResponse);
      journeyCache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    } catch (e) {
      console.warn('All routing APIs failed or returned no results');
      return [];
    }
  }

  private parseResponse(data: any): TransitConnection[] {
    if (!data.journeys || data.journeys.length === 0) return [];

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
          mode: l.mode === 'walking' ? 'walk' : (l.line?.product || 'tram'),
          line: l.line?.name || l.line?.label,
          departure: l.departure,
          arrival: l.arrival,
          duration: Math.round((parseISO(l.arrival).getTime() - parseISO(l.departure).getTime()) / 60000)
        })),
        price: j.price?.amount ? `${j.price.amount} ${j.price.currency}` : undefined
      };
    });
  }
}

/**
 * Service Factory (Singleton)
 * Easily switch providers here
 */
const activeProvider: TransitProvider = new HafasProvider();

/**
 * Main Public API
 */
export async function fetchTransitConnections(from: string, to: string, when?: string): Promise<TransitConnection[]> {
  // Logic is completely encapsulated in provider
  return activeProvider.fetchJourneys(from, to, when);
}
