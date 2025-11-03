import { API_CONFIG, isApiKeyConfigured, getApiKeyError } from './config';
import { WeatherData, WeatherForecast, WeatherAlert } from '../../../types/weather';
import { transformCurrentWeather, transformForecast, transformAlerts } from '../transforms';

class WeatherService {
  private async makeRequest(url: string): Promise<any> {
    if (!isApiKeyConfigured()) {
      throw new Error(getApiKeyError());
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'force-cache' // Use browser cache when possible
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(getApiKeyError());
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Weather API request timed out');
      }
      throw error;
    }
  }

  async getCurrentWeather(lat: number, lon: number) {
    try {
      const url = `${API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=${API_CONFIG.defaultParams.units}&lang=${API_CONFIG.defaultParams.lang}`;
      return this.makeRequest(url);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      // Return a minimal object that can be transformed
      return { main: {}, weather: [{}] };
    }
  }

  async getForecast(lat: number, lon: number) {
    try {
      const url = `${API_CONFIG.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=${API_CONFIG.defaultParams.units}&lang=${API_CONFIG.defaultParams.lang}`;
      return this.makeRequest(url);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      // Return a minimal object that can be transformed
      return { list: [] };
    }
  }

  async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      // Note: The free OpenWeatherMap API doesn't provide alerts in the standard endpoints
      // This would require the OneCall API which is a paid feature
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.warn('Error fetching weather alerts:', error);
      return [];
    }
  }
}

export const weatherService = new WeatherService();