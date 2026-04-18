const WEATHER_CACHE = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;
const FETCH_TIMEOUT = 8000;

export interface WeatherData {
  temp: number;
  tempMin: number;
  code: number;
  rainProb: number;
  current: number | null;
  location: string;
  date: string;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

function getCacheKey(location: string, date: string): string {
  return `${location.toLowerCase().trim()}_${date.split('T')[0]}`;
}

function parseDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
}

function getWeatherCodeLabel(code: number): string {
  if (code === 0) return 'Klarer Himmel';
  if ([1, 2, 3].includes(code)) return 'Leicht bewölkt';
  if ([45, 48].includes(code)) return 'Nebel';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Regen';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Schnee';
  if ([95, 96, 99].includes(code)) return 'Gewitter';
  return 'Unbekannt';
}

export async function fetchWeather(location: string, dateStr: string): Promise<WeatherData | null> {
  if (!location || !dateStr) {
    console.error('fetchWeather: missing location or date');
    return null;
  }

  const cacheKey = getCacheKey(location, dateStr);
  const cached = WEATHER_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('fetchWeather: cache hit for', cacheKey);
    return cached.data;
  }

  try {
    console.log('fetchWeather: fetching for', location, dateStr);
    
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`;
    const geoRes = await fetchWithTimeout(geoUrl, FETCH_TIMEOUT);
    
    if (!geoRes.ok) {
      console.error('fetchWeather: geocoding failed', geoRes.status);
      return null;
    }
    
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      console.error('fetchWeather: no results for location', location);
      return null;
    }

    const { latitude, longitude, name: geoName } = geoData.results[0];
    const eventDate = parseDate(dateStr);
    
    if (isNaN(eventDate.getTime())) {
      console.error('fetchWeather: invalid date', dateStr);
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const daysDiff = Math.ceil((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let weatherData: any;
    
    if (daysDiff < 0) {
      console.log('fetchWeather: past date, getting current weather');
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
      const res = await fetchWithTimeout(weatherUrl, FETCH_TIMEOUT);
      if (!res.ok) return null;
      weatherData = await res.json();
      
      const w = weatherData.current_weather;
      const weather: WeatherData = {
        temp: Math.round(w?.temperature ?? 0),
        tempMin: Math.round(w?.temperature ?? 0),
        code: w?.weathercode ?? 0,
        rainProb: 0,
        current: Math.round(w?.temperature ?? 0),
        location: geoName || location,
        date: dateStr
      };
      
      WEATHER_CACHE.set(cacheKey, { data: weather, timestamp: Date.now() });
      return weather;
    }

    const forecastDays = Math.min(daysDiff + 7, 16);
    console.log('fetchWeather: requesting', forecastDays, 'days forecast');
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current_weather=true&timezone=auto&forecast_days=${forecastDays}`;
    const weatherRes = await fetchWithTimeout(weatherUrl, FETCH_TIMEOUT);
    
    if (!weatherRes.ok) {
      console.error('fetchWeather: forecast API failed', weatherRes.status);
      return null;
    }
    
    weatherData = await weatherRes.json();
    
    if (!weatherData.daily?.time) {
      console.error('fetchWeather: no daily data');
      return null;
    }

    const targetDateStr = dateStr.split('T')[0];
    const times = weatherData.daily.time;
    let dayIndex = times.indexOf(targetDateStr);
    
    if (dayIndex === -1) {
      console.log('fetchWeather: date not found, finding closest', targetDateStr);
      for (let i = 0; i < times.length; i++) {
        if (new Date(times[i]) >= eventDate) {
          dayIndex = i;
          break;
        }
      }
    }
    
    if (dayIndex === -1) {
      console.log('fetchWeather: no matching date found, using last available');
      dayIndex = times.length - 1;
    }

    console.log('fetchWeather: using dayIndex', dayIndex, 'for', times[dayIndex]);

    const w = weatherData;
    const weather: WeatherData = {
      temp: Math.round(w.daily?.temperature_2m_max?.[dayIndex] ?? w.current_weather?.temperature ?? 0),
      tempMin: Math.round(w.daily?.temperature_2m_min?.[dayIndex] ?? w.current_weather?.temperature ?? 0),
      code: w.daily?.weathercode?.[dayIndex] ?? 0,
      rainProb: w.daily?.precipitation_probability_max?.[dayIndex] ?? 0,
      current: daysDiff === 0 ? Math.round(w.current_weather?.temperature ?? 0) : null,
      location: geoName || location,
      date: dateStr
    };

    console.log('fetchWeather: result', weather);

    WEATHER_CACHE.set(cacheKey, { data: weather, timestamp: Date.now() });
    return weather;

  } catch (error) {
    console.error('fetchWeather: error', error);
    return null;
  }
}

export function getWeatherLabel(code: number): string {
  return getWeatherCodeLabel(code);
}

export function clearWeatherCache(): void {
  WEATHER_CACHE.clear();
}