import { StockEntry } from '../types/stock';
import { weatherService } from './weather/api/endpoints';
import { WeatherData } from '../types/weather';
import { toast } from 'react-hot-toast';
import { isApiKeyConfigured, getApiKeyError } from './weather/api/config';
import { transformForecast } from './weather/transforms/index';

export class StockMonitoringService {
  private static HUMIDITY_THRESHOLD = 8; // 8% humidity threshold
  private static CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour

  static async monitorStockHumidity(stocks: StockEntry[], lat: number, lon: number) {
    try {
      // Skip if no stocks need monitoring
      if (!stocks || stocks.length === 0) {
        return;
      }
      
      // Check if API key is configured before making weather requests
      if (!isApiKeyConfigured()) {
        console.warn('Weather monitoring disabled:', getApiKeyError());
        return;
      }

      // Filter stocks with high humidity first to avoid unnecessary API calls
      const highHumidityStocks = stocks.filter(stock => 
        stock && stock.humidity && stock.humidity >= this.HUMIDITY_THRESHOLD
      );
      
      if (highHumidityStocks.length === 0) {
        return;
      }

      // Get current weather data
      const weather = await weatherService.getCurrentWeather(lat, lon);
      const rawForecast = await weatherService.getForecast(lat, lon);
      
      // Transform the raw forecast data to the expected format
      const forecast = transformForecast(rawForecast);

      // Check weather conditions
      const shouldDry = this.shouldDryStocks(weather, forecast);
      if (shouldDry) {
        this.notifyDryingRecommendation(highHumidityStocks, weather);
      }
    } catch (error) {
      console.error('Error monitoring stock humidity:', error);
      
      // Show user-friendly error message if it's an API key issue
      if (error instanceof Error && error.message.includes('API key')) {
        toast.error('Configuration météo manquante. Contactez l\'administrateur.', {
          duration: 5000,
        });
      }
    }
  }

  private static shouldDryStocks(currentWeather: WeatherData, forecast: any): boolean {
    // Check current conditions
    if (currentWeather.humidity > 85 || currentWeather.precipitation > 0) {
      return false;
    }

    // Check if next 6 hours are favorable for drying
    if (forecast && forecast.hourly && Array.isArray(forecast.hourly)) {
      const next6Hours = forecast.hourly.slice(0, 6);
      const unfavorableConditions = next6Hours.some(hour => 
        hour.humidity > 85 || hour.precipitation > 0
      );
      return !unfavorableConditions;
    }
    
    // Default to current weather if forecast is unavailable
    return true;
  }

  private static notifyDryingRecommendation(stocks: StockEntry[], weather: WeatherData) {
    const stockCount = stocks.length;
    const totalWeight = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);

    const notification = {
      title: 'Recommandation de séchage',
      message: `${stockCount} stock${stockCount > 1 ? 's' : ''} (${totalWeight.toFixed(2)} tonnes) ` +
               `nécessite${stockCount > 1 ? 'nt' : ''} un séchage.\n` +
               `Conditions actuelles favorables: ${Math.round(weather.temperature)}°C, ` +
               `${weather.humidity}% humidité`,
      type: 'warning' as const,
      duration: 10000
    };

    toast(notification.message, {
      duration: notification.duration,
      icon: '🌞',
    });
  }

  static startMonitoring(stocks: StockEntry[], lat: number, lon: number) {
    // Skip if no stocks to monitor
    if (!stocks || stocks.length === 0) {
      return () => {};
    }
    
    // Check if API key is configured before starting monitoring
    if (!isApiKeyConfigured()) {
      console.warn('Weather monitoring disabled: API key not configured');
      return () => {}; // Return empty cleanup function
    }

    // Initial check with a small delay to avoid blocking the main thread during page load
    setTimeout(() => {
      this.monitorStockHumidity(stocks, lat, lon);
    }, 2000);

    // Set up periodic monitoring
    const intervalId = setInterval(() => {
      this.monitorStockHumidity(stocks, lat, lon);
    }, this.CHECK_INTERVAL);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}