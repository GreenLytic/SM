import { StockEntry } from '../../types/stock';
import { WeatherData, WeatherForecast } from '../../types/weather';

export interface DryingConditions {
  canDry: boolean;
  optimalHours?: { start: Date; end: Date; };
  recommendations: string[];
}

export const analyzeDryingConditions = (
  weather: WeatherData,
  forecast: WeatherForecast
): DryingConditions => {
  // Validate inputs
  if (!weather || !forecast?.hourly?.length) {
    return {
      canDry: false,
      recommendations: ['Données météorologiques non disponibles']
    };
  }

  const next6Hours = forecast.hourly.slice(0, 6);
  
  // Check for precipitation
  const hasPrecipitation = weather.precipitation > 0 || 
    next6Hours.some(hour => hour?.precipitation > 0);

  if (hasPrecipitation) {
    return {
      canDry: false,
      recommendations: [
        'Séchage déconseillé - Précipitations prévues',
        'Maintenir le stock à l\'abri',
        'Assurer une bonne ventilation'
      ]
    };
  }

  // Find optimal drying hours (temperature > 20°C, no rain)
  const optimalHours = next6Hours.filter(hour => 
    hour?.precipitation === 0 && 
    hour?.temperature > 20 &&
    hour?.humidity < 85
  );

  if (optimalHours.length >= 2) {
    return {
      canDry: true,
      optimalHours: {
        start: optimalHours[0].timestamp,
        end: optimalHours[optimalHours.length - 1].timestamp
      },
      recommendations: [
        'Conditions optimales pour le séchage',
        'Température favorable',
        'Surveiller régulièrement le taux d\'humidité'
      ]
    };
  }

  // If sunny but not optimal temperature
  if (weather.temperature > 15) {
    return {
      canDry: true,
      recommendations: [
        'Séchage possible - Conditions acceptables',
        'Prolonger la durée de séchage si nécessaire',
        'Surveiller régulièrement le taux d\'humidité'
      ]
    };
  }

  return {
    canDry: true,
    recommendations: [
      'Séchage possible mais conditions non optimales',
      'Surveiller régulièrement le taux d\'humidité',
      'Prévoir une durée de séchage plus longue'
    ]
  };
};