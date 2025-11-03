import { buildStyles } from 'react-circular-progressbar';

export const getKPIColor = (type: 'revenue' | 'collection' | 'storage' | 'producers'): string => {
  switch (type) {
    case 'revenue':
      return '#FF6B00'; // Orange for revenue
    case 'collection':
      return '#4CAF50'; // Green for collection
    case 'storage':
      return '#2196F3'; // Blue for storage
    case 'producers':
      return '#9C27B0'; // Purple for producers
    default:
      return '#FF6B00';
  }
};

export const getKPIStyles = (color: string) => {
  return buildStyles({
    textSize: '24px',
    pathColor: color,
    textColor: '#1F2937',
    trailColor: '#E5E7EB'
  });
};

export const calculatePercentage = (value: number, target: number): number => {
  return Math.min((value / target) * 100, 100);
};

export const getTrendClass = (trend: number): string => {
  return trend >= 0 ? 'text-success' : 'text-error';
};

export const getTrendIcon = (trend: number) => {
  return trend >= 0 ? 'TrendingUp' : 'TrendingDown';
};