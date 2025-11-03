import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockEntry } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { AlertTriangle, Droplets, ThermometerSun, Check, Info, Sun, CloudRain } from 'lucide-react';
import { WeatherService } from '../../services/weatherService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StockMonitoringTab() {
  const [highHumidityStocks, setHighHumidityStocks] = useState<StockEntry[]>([]);
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  // Use a ref to track active listeners so we can unsubscribe properly
  const stocksListenerRef = useRef<() => void | null>(null);

  // Function to set up the high humidity stocks listener
  const setupStocksListener = () => {
    // Fetch stocks with high humidity (>= 8%)
    const stocksQuery = query(
      collection(db, 'stocks'),
      where('humidity', '>=', 8),
      orderBy('humidity', 'desc')
    );
    
    const unsubscribe = onSnapshot(stocksQuery, (snapshot) => {
      const stocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        lastDryingConfirmation: doc.data().lastDryingConfirmation?.toDate(),
        lastNotification: doc.data().lastNotification?.toDate()
      })) as StockEntry[];
      
      setHighHumidityStocks(stocksData);
      
      // Collect unique producer IDs and warehouse IDs
      const producerIds = [...new Set(stocksData.map(stock => stock.producerId))];
      const warehouseIds = [...new Set(stocksData.map(stock => stock.warehouseId).filter(Boolean))];
      
      // Fetch producer names
      producerIds.forEach(async (id) => {
        if (!producerNames[id]) {
          try {
            const producerDoc = await getDoc(doc(db, 'producers', id));
            if (producerDoc.exists()) {
              setProducerNames(prev => ({
                ...prev,
                [id]: producerDoc.data().fullName
              }));
            }
          } catch (error) {
            console.error(`Error fetching producer ${id}:`, error);
          }
        }
      });
      
      // Fetch warehouse names
      warehouseIds.forEach(async (id) => {
        if (!warehouseNames[id]) {
          try {
            const warehouseDoc = await getDoc(doc(db, 'warehouses', id));
            if (warehouseDoc.exists()) {
              setWarehouseNames(prev => ({
                ...prev,
                [id]: warehouseDoc.data().name
              }));
            }
          } catch (error) {
            console.error(`Error fetching warehouse ${id}:`, error);
          }
        }
      });
      
      setIsLoading(false);
    });
    
    stocksListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  useEffect(() => {
    // Set up initial listener
    const unsubscribeStocks = setupStocksListener();
    
    // Fetch weather data
    const fetchWeatherData = async () => {
      try {
        const weather = await WeatherService.getCurrentWeather(5.9309666, -4.2143906);
        const forecastData = await WeatherService.getForecast(5.9309666, -4.2143906);
        
        setWeatherData(weather);
        setForecast(forecastData);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };
    
    fetchWeatherData();

    return () => {
      unsubscribeStocks();
    };
  }, []);

  const confirmDrying = async (stockId: string) => {
    try {
      setIsProcessing(prev => ({ ...prev, [stockId]: true }));
      
      const stockRef = doc(db, 'stocks', stockId);
      await updateDoc(stockRef, {
        lastDryingConfirmation: new Date(),
        humidity: 7,
        lastNotification: new Date()
      });
      
      toast.success('Séchage confirmé avec succès');
    } catch (error) {
      console.error('Error confirming stock drying:', error);
      toast.error('Erreur lors de la confirmation du séchage');
    } finally {
      setIsProcessing(prev => ({ ...prev, [stockId]: false }));
    }
  };

  const getWeatherIcon = () => {
    if (!weatherData) return <Sun className="w-6 h-6 text-yellow-500" />;
    
    const precipitation = weatherData.precipitation > 0;
    const highHumidity = weatherData.humidity > 85;
    
    if (precipitation) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (highHumidity) return <Droplets className="w-6 h-6 text-blue-500" />;
    return <Sun className="w-6 h-6 text-yellow-500" />;
  };

  const getWeatherCondition = () => {
    if (!weatherData) return "Données météo non disponibles";
    
    const precipitation = weatherData.precipitation > 0;
    const highHumidity = weatherData.humidity > 85;
    
    if (precipitation) return "Précipitations en cours";
    if (highHumidity) return "Humidité élevée";
    return "Conditions favorables au séchage";
  };

  const isDryingRecommended = () => {
    if (!weatherData) return false;
    
    const precipitation = weatherData.precipitation > 0;
    const highHumidity = weatherData.humidity > 85;
    
    return !precipitation && !highHumidity;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stocks à surveiller
          </h3>
          
          {weatherData && (
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">{Math.round(weatherData.temperature)}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{weatherData.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                {getWeatherIcon()}
                <span className="text-sm font-medium">{getWeatherCondition()}</span>
              </div>
            </div>
          )}
        </div>

        {isDryingRecommended() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Sun className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Conditions favorables au séchage</p>
              <p className="text-sm text-green-700 mt-1">
                Les conditions météorologiques actuelles sont idéales pour le séchage des fèves de cacao.
                Température: {Math.round(weatherData.temperature)}°C, Humidité: {weatherData.humidity}%.
              </p>
            </div>
          </div>
        )}

        {!isDryingRecommended() && weatherData && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Conditions défavorables au séchage</p>
              <p className="text-sm text-amber-700 mt-1">
                Les conditions météorologiques actuelles ne sont pas idéales pour le séchage des fèves de cacao.
                {weatherData.precipitation > 0 ? ' Précipitations en cours.' : ''}
                {weatherData.humidity > 85 ? ' Taux d\'humidité atmosphérique élevé.' : ''}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : highHumidityStocks.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stock à surveiller</h3>
            <p className="text-gray-500">
              Tous les stocks ont un taux d'humidité acceptable (moins de 8%).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highHumidityStocks.map((stock) => (
              <div key={stock.id} className="bg-white border border-amber-200 rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Stock #{stock.stockNumber}</h4>
                    <p className="text-sm text-gray-500">{producerNames[stock.producerId] || 'Chargement...'}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                    {stock.humidity}% d'humidité
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantité:</span>
                    <span className="text-sm font-medium">{stock.quantity.toFixed(2)} tonnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Magasin:</span>
                    <span className="text-sm font-medium">
                      {stock.warehouseId ? warehouseNames[stock.warehouseId] || 'Chargement...' : 'Non assigné'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date d'entrée:</span>
                    <span className="text-sm font-medium">{format(stock.date, 'dd/MM/yyyy')}</span>
                  </div>
                  {stock.lastDryingConfirmation && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dernier séchage:</span>
                      <span className="text-sm font-medium">{format(stock.lastDryingConfirmation, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-3 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">Recommandation</p>
                      <p className="text-xs text-amber-700">
                        Ce stock nécessite un séchage supplémentaire pour atteindre un taux d'humidité inférieur à 7.5%.
                        {isDryingRecommended() 
                          ? ' Les conditions météorologiques actuelles sont favorables au séchage.'
                          : ' Attendez des conditions météorologiques plus favorables si possible.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => confirmDrying(stock.id!)}
                  disabled={isProcessing[stock.id!]}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing[stock.id!] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmer le séchage</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}