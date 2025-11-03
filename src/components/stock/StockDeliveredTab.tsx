import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockEntry } from '../../types/stock';
import { Search, Package, Download, FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StockPDF from '../StockPDF';
import StockLabelPDF from '../StockLabelPDF';
import { format } from 'date-fns';

export default function StockDeliveredTab() {
  const [deliveredStocks, setDeliveredStocks] = useState<StockEntry[]>([]);
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to track active listeners so we can unsubscribe properly
  const stocksListenerRef = useRef<() => void | null>(null);

  // Listen for stock update events from delivery completions
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log('Stock update event received, refreshing delivered stocks data');
      
      // Re-fetch data
      if (stocksListenerRef.current) {
        stocksListenerRef.current(); // Unsubscribe from current listener
      }
      
      // Set up new listener
      setupStocksListener();
    };
    
    window.addEventListener('stockUpdate', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, []);

  // Function to set up the delivered stocks listener
  const setupStocksListener = () => {
    // Fetch all stocks and filter in memory to avoid composite index
    const stocksQuery = collection(db, 'stocks');
    
    const unsubscribe = onSnapshot(stocksQuery, (snapshot) => {
      const allStocks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate()
      })) as StockEntry[];
      
      // Filter for delivered stocks and sort by deliveredAt in memory
      const stocksData = allStocks
        .filter(stock => stock.status === 'delivered')
        .sort((a, b) => {
          if (!a.deliveredAt && !b.deliveredAt) return 0;
          if (!a.deliveredAt) return 1;
          if (!b.deliveredAt) return -1;
          return b.deliveredAt.getTime() - a.deliveredAt.getTime();
        });
      
      setDeliveredStocks(stocksData);
      
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

    return () => {
      unsubscribeStocks();
    };
  }, []);

  const filteredStocks = deliveredStocks.filter(stock => {
    const producerName = producerNames[stock.producerId] || '';
    const warehouseName = stock.warehouseId ? warehouseNames[stock.warehouseId] || '' : '';
    
    return (
      producerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.stockNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getGradeColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Stocks livrés
          </h3>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stock livré</h3>
            <p className="text-gray-500">
              Les stocks livrés apparaîtront ici automatiquement après livraison.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date de livraison</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité livrée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.deliveredAt ? format(stock.deliveredAt, 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.stockNumber}
                      {stock.isGrouped && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Lot
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producerNames[stock.producerId] || 'Chargement...'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.deliveredQuantity?.toFixed(2) || stock.quantity.toFixed(2)} tonnes
                    </td>
                    <td className="px-6 py-4">
                      {stock.calculatedGrade ? (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getGradeColor(stock.quality)}`}>
                          {stock.calculatedGrade}
                        </span>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getGradeColor(stock.quality)}`}>
                          Qualité {stock.quality}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.warehouseId ? warehouseNames[stock.warehouseId] || 'Chargement...' : 'Non assigné'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <PDFDownloadLink
                          document={<StockPDF stock={stock} producerName={producerNames[stock.producerId] || 'Producteur'} />}
                          fileName={`stock_${stock.stockNumber}.pdf`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                        >
                          {({ loading }) => (
                            <>
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              <span>Fiche</span>
                            </>
                          )}
                        </PDFDownloadLink>
                        
                        <PDFDownloadLink
                          document={<StockLabelPDF stock={stock} />}
                          fileName={`etiquette_${stock.stockNumber}.pdf`}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 px-2 py-1 border border-purple-200 rounded-md hover:bg-purple-50"
                        >
                          {({ loading }) => (
                            <>
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Package className="w-4 h-4" />
                              )}
                              <span>Étiquette</span>
                            </>
                          )}
                        </PDFDownloadLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}