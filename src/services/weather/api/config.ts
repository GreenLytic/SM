export const API_CONFIG = {
  key: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  baseUrl: import.meta.env.VITE_WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  defaultParams: {
    units: 'metric',
    lang: 'fr'
  }
};

export const isApiKeyConfigured = (): boolean => {
  // Consider the key configured if it exists and isn't the placeholder
  return Boolean(API_CONFIG.key && 
                API_CONFIG.key.trim() !== '' && 
                API_CONFIG.key !== 'your_openweathermap_api_key_here');
};

export const getApiKeyError = (): string => {
  if (!API_CONFIG.key) {
    return 'OpenWeatherMap API key is not configured. Please set VITE_OPENWEATHER_API_KEY in your .env file.';
  }
  if (API_CONFIG.key === 'your_openweathermap_api_key_here') {
    return 'Please replace the placeholder API key with a valid OpenWeatherMap API key.';
  }
  return 'Invalid OpenWeatherMap API key. Please check your VITE_OPENWEATHER_API_KEY in your .env file.';
};