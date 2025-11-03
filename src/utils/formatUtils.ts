export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatCurrency = (value: number): string => {
  return `${value.toLocaleString()} FCFA`;
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatWeight = (value: number, unit: 'kg' | 'tonnes' = 'tonnes'): string => {
  if (unit === 'kg') {
    return `${Math.round(value * 1000).toLocaleString()} kg`;
  }
  return `${value.toFixed(2)} tonnes`;
};