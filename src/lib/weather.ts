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
  hour?: number;
  isHourly?: boolean;
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
  return `${location.toLowerCase().trim()}_${date}`;
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
  console.log('fetchWeather START:', location, dateStr);
  
  if (!location || !dateStr) {
    console.error('fetchWeather: missing location or date');
    return null;
  }

  const cacheKey = getCacheKey(location, dateStr);
  const cached = WEATHER_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('fetchWeather: cache hit');
    return cached.data;
  }

  try {
    console.log('fetchWeather: calling geocoding API');
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`;
    const geoRes = await fetchWithTimeout(geoUrl, FETCH_TIMEOUT);
    
    if (!geoRes.ok) {
      console.error('fetchWeather: geocoding failed', geoRes.status);
      return null;
    }
    
    const geoData = await geoRes.json();
    console.log('fetchWeather: geocoding result', geoData);
    
    if (!geoData.results || geoData.results.length === 0) {
      console.error('fetchWeather: no geocoding results');
      return null;
    }

    const { latitude, longitude, name: geoName } = geoData.results[0];
    const eventDate = new Date(dateStr);
    
    if (isNaN(eventDate.getTime())) return null;

    const now = new Date();
    const eventTimeMs = eventDate.getTime();
    const nowMs = now.getTime();
    const hoursDiff = (eventTimeMs - nowMs) / (1000 * 60 * 60);

    let weather: WeatherData;

    if (hoursDiff < 0) {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
      const res = await fetchWithTimeout(weatherUrl, FETCH_TIMEOUT);
      if (!res.ok) return null;
      const w = await res.json();
      
      weather = {
        temp: Math.round(w.current_weather?.temperature ?? 0),
        tempMin: Math.round(w.current_weather?.temperature ?? 0),
        code: w.current_weather?.weathercode ?? 0,
        rainProb: 0,
        current: Math.round(w.current_weather?.temperature ?? 0),
        location: geoName || location,
        date: dateStr
      };
    } else if (hoursDiff <= 48) {
      console.log('fetchWeather: using HOURLY forecast', hoursDiff, 'hours until event');
      const forecastDays = Math.ceil(hoursDiff / 24) + 1;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,precipitation_probability&current_weather=true&timezone=auto&forecast_days=${Math.min(forecastDays, 7)}`;
      console.log('fetchWeather: URL', weatherUrl);
      const res = await fetchWithTimeout(weatherUrl, FETCH_TIMEOUT);
      if (!res.ok) {
        console.error('fetchWeather: hourly forecast failed', res.status);
        return null;
      }
      const w = await res.json();
      console.log('fetchWeather: hourly result keys', Object.keys(w));
      
      if (!w.hourly?.time) {
        console.error('fetchWeather: no hourly data');
        return null;
      }
      
      const times = w.hourly.time;
      const eventHourStr = dateStr.slice(0, 16);
      let hourIndex = times.indexOf(eventHourStr);
      
      if (hourIndex === -1) {
        for (let i = 0; i < times.length; i++) {
          if (new Date(times[i]) >= eventDate) {
            hourIndex = i;
            break;
          }
        }
      }
      
      if (hourIndex === -1) hourIndex = times.length - 1;

      weather = {
        temp: Math.round(w.hourly.temperature_2m[hourIndex] ?? w.current_weather?.temperature ?? 0),
        tempMin: Math.round(w.hourly.temperature_2m[Math.max(0, hourIndex - 3)] ?? w.current_weather?.temperature ?? 0),
        code: w.hourly.weathercode[hourIndex] ?? 0,
        rainProb: w.hourly.precipitation_probability[hourIndex] ?? 0,
        current: hoursDiff < 1 ? Math.round(w.current_weather?.temperature ?? 0) : null,
        location: geoName || location,
        date: dateStr,
        hour: eventDate.getHours(),
        isHourly: true
      };
    } else {
      const forecastDays = Math.min(Math.ceil(hoursDiff / 24) + 7, 16);
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current_weather=true&timezone=auto&forecast_days=${forecastDays}`;
      const res = await fetchWithTimeout(weatherUrl, FETCH_TIMEOUT);
      if (!res.ok) return null;
      const w = await res.json();
      
      if (!w.daily?.time) return null;
      
      const times = w.daily.time;
      const targetDate = dateStr.split('T')[0];
      let dayIndex = times.indexOf(targetDate);
      
      if (dayIndex === -1) {
        for (let i = 0; i < times.length; i++) {
          if (new Date(times[i]) >= eventDate) {
            dayIndex = i;
            break;
          }
        }
      }
      
      if (dayIndex === -1) dayIndex = times.length - 1;

      weather = {
        temp: Math.round(w.daily?.temperature_2m_max?.[dayIndex] ?? 0),
        tempMin: Math.round(w.daily?.temperature_2m_min?.[dayIndex] ?? 0),
        code: w.daily?.weathercode?.[dayIndex] ?? 0,
        rainProb: w.daily?.precipitation_probability_max?.[dayIndex] ?? 0,
        current: null,
        location: geoName || location,
        date: dateStr,
        isHourly: false
      };
    }

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