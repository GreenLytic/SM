import { useEffect } from 'react';
import { StockEntry } from '../types/stock';
import { StockMonitoringService } from '../services/stockMonitoringService';

export const useStockMonitoring = (stocks: StockEntry[], lat: number, lon: number) => {
  useEffect(() => {
    const cleanup = StockMonitoringService.startMonitoring(stocks, lat, lon);
    return cleanup;
  }, [stocks, lat, lon]);
};