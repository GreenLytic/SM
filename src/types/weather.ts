export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  description: string;
  icon: string;
  timestamp: Date;
}

export interface WeatherForecast {
  hourly: WeatherData[];
  daily: WeatherData[];
}

export interface WeatherAlert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  startTime: Date;
  endTime: Date;
}