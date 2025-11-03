import { StockEntry } from '../../types/stock';

export const validateStockData = (stock: StockEntry): boolean => {
  return !!(
    stock.id &&
    stock.stockNumber &&
    stock.producerId &&
    typeof stock.humidity === 'number' &&
    stock.humidity >= 0
  );
};

export const validateDryingConfirmation = (stock: StockEntry): boolean => {
  if (!stock.lastDryingConfirmation) return true;
  
  const confirmationTime = new Date(stock.lastDryingConfirmation);
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  return confirmationTime <= thirtyMinutesAgo;
};