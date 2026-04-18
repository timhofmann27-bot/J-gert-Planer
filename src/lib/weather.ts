const WEATHER_CACHE = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const fetchTimeout = 8000; // 8 seconds

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
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function getCacheKey(location: string, date: string): string {
  return `${location.toLowerCase()}_${date}`;
}

export async function fetchWeather(location: string, dateStr: string): Promise<WeatherData | null> {
  const cacheKey = getCacheKey(location, dateStr);
  const cached = WEATHER_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // 1. Geocoding with timeout
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`;
    const geoRes = await fetchWithTimeout(geoUrl, fetchTimeout);
    
    if (!geoRes.ok) {
      console.error('Geocoding API error:', geoRes.status);
      return null;
    }
    
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      console.error('No geocoding results for:', location);
      return null;
    }

    const { latitude, longitude, name: geoName } = geoData.results[0];
    const eventDate = new Date(dateStr);
    
    if (isNaN(eventDate.getTime())) {
      console.error('Invalid date:', dateStr);
      return null;
    }

    // Check if date is too far in future
    const daysDiff = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const forecastDays = daysDiff > 16 ? 16 : daysDiff < 0 ? 0 : 14;
    
    if (forecastDays === 0) {
      // Past date - just get current weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
      const weatherRes = await fetchWithTimeout(weatherUrl, fetchTimeout);
      
      if (!weatherRes.ok) {
        return null;
      }
      
      const weatherData = await weatherRes.json();
      const weather: WeatherData = {
        temp: Math.round(weatherData.current_weather?.temperature || 0),
        tempMin: Math.round(weatherData.current_weather?.temperature || 0),
        code: weatherData.current_weather?.weathercode || 0,
        rainProb: 0,
        current: Math.round(weatherData.current_weather?.temperature || 0),
        location: geoName || location,
        date: dateStr
      };
      
      WEATHER_CACHE.set(cacheKey, { data: weather, timestamp: Date.now() });
      return weather;
    }

    // 2. Weather forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current_weather=true&timezone=auto&forecast_days=${forecastDays}`;
    const weatherRes = await fetchWithTimeout(weatherUrl, fetchTimeout);
    
    if (!weatherRes.ok) {
      console.error('Weather API error:', weatherRes.status);
      return null;
    }
    
    const weatherData = await weatherRes.json();
    
    if (!weatherData.daily?.time) {
      console.error('No daily weather data');
      return null;
    }

    // Find the specific day
    const targetDateStr = dateStr.split('T')[0];
    const dayIndex = weatherData.daily.time.indexOf(targetDateStr);
    
    if (dayIndex === -1) {
      // Try to find closest available date
      const closestIndex = weatherData.daily.time.findIndex((t: string) => new Date(t) >= eventDate);
      if (closestIndex === -1) {
        return null;
      }
    }

    const isToday = daysDiff === 0;
    const weather: WeatherData = {
      temp: Math.round(weatherData.daily.temperature_2m_max[dayIndex] || weatherData.current_weather?.temperature || 0),
      tempMin: Math.round(weatherData.daily.temperature_2m_min[dayIndex] || weatherData.current_weather?.temperature || 0),
      code: weatherData.daily.weathercode[dayIndex] || 0,
      rainProb: weatherData.daily.precipitation_probability_max[dayIndex] || 0,
      current: isToday ? Math.round(weatherData.current_weather?.temperature || 0) : null,
      location: geoName || location,
      date: dateStr
    };

    WEATHER_CACHE.set(cacheKey, { data: weather, timestamp: Date.now() });
    return weather;

  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('Weather fetch timeout');
    } else {
      console.error('Weather fetch error:', e);
    }
    return null;
  }
}

export function getWeatherLabel(code: number): string {
  if (code === 0) return 'Klarer Himmel';
  if ([1, 2, 3].includes(code)) return 'Leicht bewölkt';
  if ([45, 48].includes(code)) return 'Nebel';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Regen';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Schnee';
  if ([95, 96, 99].includes(code)) return 'Gewitter';
  return 'Unbekannt';
}

export function clearWeatherCache(): void {
  WEATHER_CACHE.clear();
}