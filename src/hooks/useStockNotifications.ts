import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockEntry } from '../types/stock';
import { WeatherService } from '../services/weatherService';
import { Producer } from '../types/producer';
import { analyzeDryingConditions } from '../services/stock/stockMonitoring';
import { validateStockData, validateDryingConfirmation } from '../services/stock/stockValidation';
import { toast } from 'react-hot-toast';
import { useNotificationSound } from './useNotificationSound';

interface StockAlert {
  stockId: string;
  stockNumber: string;
  humidity: number;
  recommendations?: string[];
  producerName: string;
  lastNotification?: Date;
  confirmed: boolean;
}

export const useStockNotifications = () => {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { playNotificationSound } = useNotificationSound();
  const [processedStocks, setProcessedStocks] = useState<Set<string>>(new Set());

  // Function to mark all alerts as viewed
  const markAllAlertsAsViewed = useCallback(() => {
    setStockAlerts([]);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'stocks'), where('humidity', '>=', 8));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        setIsProcessing(true);
        const alerts: StockAlert[] = [];
        let hasNewAlerts = false;

        for (const stockDoc of snapshot.docs) {
          try {
            const stock = { id: stockDoc.id, ...stockDoc.data() } as StockEntry;

            // Skip if we've already processed this stock in this session
            if (processedStocks.has(stock.id!)) continue;

            if (!validateStockData(stock)) continue;
            if (!validateDryingConfirmation(stock)) continue;

            // Add to processed stocks
            setProcessedStocks(prev => new Set(prev).add(stock.id!));

            // Get producer name
            let producerName = "Producteur inconnu";
            try {
              const producerDoc = await getDoc(doc(db, 'producers', stock.producerId));
              if (producerDoc.exists()) {
                const producer = producerDoc.data() as Producer;
                producerName = producer.fullName;
              }
            } catch (error) {
              console.error('Error fetching producer:', error);
            }

            // Get weather conditions
            let recommendations: string[] = [];
            try {
              const [weather, forecast] = await Promise.all([
                WeatherService.getCurrentWeather(5.9309666, -4.2143906),
                WeatherService.getForecast(5.9309666, -4.2143906)
              ]);

              const dryingConditions = analyzeDryingConditions(weather, forecast);

              if (dryingConditions.canDry) {
                recommendations = [
                  ...dryingConditions.recommendations,
                  dryingConditions.optimalHours
                    ? `Période optimale: ${dryingConditions.optimalHours.start.toLocaleTimeString()} - ${dryingConditions.optimalHours.end.toLocaleTimeString()}`
                    : undefined
                ].filter(Boolean) as string[];

                // Check if this is a new alert
                if (!stock.lastNotification ||
                    new Date(stock.lastNotification).getTime() < Date.now() - 30 * 60 * 1000) {
                  hasNewAlerts = true;
                }
              }
            } catch (error) {
              console.error('Error getting weather data:', error);
            }

            alerts.push({
              stockId: stock.id!,
              stockNumber: stock.stockNumber,
              humidity: stock.humidity,
              producerName,
              lastNotification: stock.lastNotification ? new Date(stock.lastNotification) : undefined,
              confirmed: false,
              recommendations
            });
          } catch (error) {
            console.error('Error processing individual stock:', error);
          }
        }

        setStockAlerts(alerts);

        // Play sound if there are new alerts
        if (hasNewAlerts && alerts.length > 0) {
          await playNotificationSound();
        }
      } catch (error) {
        console.error('Error processing stocks:', error);
      } finally {
        setIsProcessing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const confirmStockDrying = async (stockId: string) => {
    try {
      const stockRef = doc(db, 'stocks', stockId);
      await updateDoc(stockRef, {
        lastDryingConfirmation: new Date(),
        humidity: 7,
        lastNotification: new Date()
      });
      
      // Remove from alerts
      setStockAlerts(prev => prev.filter(alert => alert.stockId !== stockId));
      
      toast.success('Séchage confirmé avec succès');
    } catch (error) {
      console.error('Error confirming stock drying:', error);
      toast.error('Erreur lors de la confirmation du séchage');
    }
  };

  return {
    stockAlerts,
    confirmStockDrying,
    isProcessing,
    markAllAlertsAsViewed
  };
};