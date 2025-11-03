import { WeatherData, WeatherForecast, WeatherAlert } from '../types/weather';
import { API_CONFIG } from './weather/api/config';

export class WeatherService {
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Weather API error');
      }

      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        precipitation: data.rain ? data.rain['1h'] || 0 : 0,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
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
  }

  static async getForecast(lat: number, lon: number): Promise<WeatherForecast> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Forecast API error');
      }

      const data = await response.json();
      
      const hourly = data.list.slice(0, 24).map((item: any) => ({
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain ? item.rain['3h'] / 3 : 0,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        timestamp: new Date(item.dt * 1000)
      }));

      const daily = data.list.filter((item: any, index: number) => index % 8 === 0).map((item: any) => ({
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain ? item.rain['3h'] / 3 : 0,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        timestamp: new Date(item.dt * 1000)
      }));

      return { hourly, daily };
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return {
        hourly: Array(24).fill(this.getDefaultWeatherData()),
        daily: Array(5).fill(this.getDefaultWeatherData())
      };
    }
  }

  static async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&exclude=current,minutely,hourly,daily&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Alerts API error');
      }

      const data = await response.json();
      
      if (!data.alerts) return [];

      return data.alerts.map((alert: any) => ({
        type: alert.event,
        severity: this.getAlertSeverity(alert.event),
        description: alert.description,
        startTime: new Date(alert.start * 1000),
        endTime: new Date(alert.end * 1000)
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  private static getAlertSeverity(event: string): 'low' | 'medium' | 'high' {
    const lowEvents = ['Fog', 'Cloudy'];
    const mediumEvents = ['Rain', 'Wind'];
    const highEvents = ['Storm', 'Hurricane', 'Tornado'];

    if (highEvents.some(e => event.includes(e))) return 'high';
    if (mediumEvents.some(e => event.includes(e))) return 'medium';
    return 'low';
  }

  private static getDefaultWeatherData(): WeatherData {
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

  static shouldAdjustStorage(weather: WeatherData): boolean {
    return weather.humidity > 85 || weather.precipitation > 0;
  }

  static getStorageRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];

    if (weather.humidity > 85) {
      recommendations.push('Humidité élevée - Vérifier la ventilation des magasins');
    }

    if (weather.precipitation > 0) {
      recommendations.push('Précipitations en cours - Assurer l\'étanchéité des magasins');
    }

    if (weather.temperature > 30) {
      recommendations.push('Température élevée - Surveiller les conditions de stockage');
    }

    return recommendations;
  }
}