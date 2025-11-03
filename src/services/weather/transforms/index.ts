import { WeatherData, WeatherAlert, WeatherForecast } from '../../../types/weather';

export function transformCurrentWeather(data: any): WeatherData {
  if (!data || !data.main || !data.weather?.[0]) {
    return {
      temperature: 25,
      humidity: 65,
      windSpeed: 0,
      precipitation: 0,
      description: 'Données non disponibles',
      icon: '01d',
      timestamp: new Date()
    };
  }

  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
    precipitation: data.rain?.['1h'] || 0,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    timestamp: new Date(data.dt * 1000)
  };
}

export function transformForecast(data: any): WeatherForecast {
  if (!data || !data.list || !Array.isArray(data.list)) {
    // Return default forecast data
    const defaultData: WeatherData = {
      temperature: 25,
      humidity: 65,
      windSpeed: 0,
      precipitation: 0,
      description: 'Données non disponibles',
      icon: '01d',
      timestamp: new Date()
    };

    return {
      hourly: Array(24).fill({...defaultData}),
      daily: Array(5).fill({...defaultData})
    };
  }

  const mapForecastItem = (item: any): WeatherData => ({
    temperature: item.main?.temp || 0,
    humidity: item.main?.humidity || 0,
    windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
    precipitation: item.rain?.['3h'] || 0,
    description: item.weather?.[0]?.description || 'Données non disponibles',
    icon: item.weather?.[0]?.icon || '01d',
    timestamp: new Date(item.dt * 1000)
  });

  return {
    hourly: data.list.slice(0, 24).map(mapForecastItem),
    daily: data.list.filter((_: any, i: number) => i % 8 === 0).map(mapForecastItem)
  };
}

export function transformAlerts(data: any): WeatherAlert[] {
  if (!data || !data.alerts || !Array.isArray(data.alerts)) return [];

  return data.alerts.map((alert: any) => ({
    type: alert.event,
    severity: getSeverityLevel(alert.event),
    description: alert.description,
    startTime: new Date(alert.start * 1000),
    endTime: new Date(alert.end * 1000)
  }));
}

function getSeverityLevel(eventType: string): 'low' | 'medium' | 'high' {
  const highSeverity = ['Hurricane', 'Tornado', 'Severe Thunderstorm'];
  const mediumSeverity = ['Rain', 'Wind', 'Flood'];
  
  const event = eventType.toLowerCase();
  
  if (highSeverity.some(type => event.includes(type.toLowerCase()))) {
    return 'high';
  }
  if (mediumSeverity.some(type => event.includes(type.toLowerCase()))) {
    return 'medium';
  }
  return 'low';
}