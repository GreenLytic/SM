import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockEntry } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, Building2, FileText, AlertTriangle, Layers } from 'lucide-react';
import Modal from '../Modal';
import StockTable from './StockTable';
import StockWarehouseForm from '../StockWarehouseForm';
import QualityAssessmentForm from '../QualityAssessmentForm';
import StockCreationForm from '../StockCreationForm';
import { toast } from 'react-hot-toast';
import StockStats from './StockStats';
import WarehouseInfoDisplay from './WarehouseInfoDisplay';
import WarehouseForm from '../WarehouseForm';
import { useLocation, useNavigate } from 'react-router-dom';

type SortField = 'date' | 'stockNumber' | 'quantity' | 'humidity' | 'pricePerTon' | 'totalCost' | 'paymentStatus' | 'calculatedGrade';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'available' | 'assigned' | 'partially_delivered' | 'delivered';

export default function StockIndividualTab() {
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isStockCreationModalOpen, setIsStockCreationModalOpen] = useState(false);
  const [isWarehouseFormOpen, setIsWarehouseFormOpen] = useState(false);
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('available');
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStocks, setSelectedStocks] = useState<StockEntry[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  
  // Use a ref to track active listeners so we can unsubscribe properly
  const stocksListenerRef = useRef<() => void | null>(null);
  const warehousesListenerRef = useRef<() => void | null>(null);
  const collectionsListenerRef = useRef<() => void | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for stock update events from delivery completions
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log('Stock update event received, refreshing stock data');
      
      // Re-fetch data
      if (stocksListenerRef.current) {
        stocksListenerRef.current(); // Unsubscribe from current listener
      }
      if (warehousesListenerRef.current) {
        warehousesListenerRef.current(); // Unsubscribe from current listener
      }
      
      // Set up new listeners
      setTimeout(() => {
        setupStocksListener();
        setupWarehousesListener();
      }, 100);
    };
    
    window.addEventListener('stockUpdate', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, []);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const combine = params.get('combine');
    const stocksParam = params.get('stocks');
    
    if (tab === 'individual' && combine === 'true' && stocksParam) {
      const stockIds = stocksParam.split(',');
      // Fetch the selected stocks
      const fetchSelectedStocks = async () => {
        const selectedStocksData: StockEntry[] = [];
        for (const id of stockIds) {
          const stockDoc = await getDoc(doc(db, 'stocks', id));
          if (stockDoc.exists()) {
            selectedStocksData.push({
              id: stockDoc.id,
              ...stockDoc.data(),
              date: stockDoc.data().date?.toDate()
            } as StockEntry);
          }
        }
        setSelectedStocks(selectedStocksData);
        setIsCombineModalOpen(true);
        
        // Clear URL parameters
        navigate('/stocks', { replace: true });
      };
      
      fetchSelectedStocks();
    }
  }, [location]);

  // Function to set up the stocks listener
  const setupStocksListener = () => {
    // Create a simple query without composite index requirements
    const stocksQuery = query(collection(db, 'stocks'));
    
    const unsubscribe = onSnapshot(stocksQuery, (snapshot) => {
      const stocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        lastDryingConfirmation: doc.data().lastDryingConfirmation?.toDate(),
        lastNotification: doc.data().lastNotification?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate()
      })) as StockEntry[];
      
      // Filter and sort in memory instead of in the query
      const filteredStocksData = stocksData.filter(stock => {
        // Filter out stocks that have been combined into other stocks
        return stock.combinedIntoStock === null || stock.combinedIntoStock === undefined;
      }).sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc' 
            ? a.date.getTime() - b.date.getTime()
            : b.date.getTime() - a.date.getTime();
        } else if (sortField === 'stockNumber') {
          return sortOrder === 'asc'
            ? a.stockNumber.localeCompare(b.stockNumber)
            : b.stockNumber.localeCompare(a.stockNumber);
        } else if (sortField === 'quantity') {
          return sortOrder === 'asc'
            ? a.quantity - b.quantity
            : b.quantity - a.quantity;
        } else if (sortField === 'humidity') {
          return sortOrder === 'asc'
            ? a.humidity - b.humidity
            : b.humidity - a.humidity;
        } else if (sortField === 'pricePerTon') {
          const aPrice = a.pricePerTon || 0;
          const bPrice = b.pricePerTon || 0;
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        } else if (sortField === 'totalCost') {
          const aCost = a.totalCost || 0;
          const bCost = b.totalCost || 0;
          return sortOrder === 'asc' ? aCost - bCost : bCost - aCost;
        } else if (sortField === 'paymentStatus') {
          return sortOrder === 'asc'
            ? a.paymentStatus.localeCompare(b.paymentStatus)
            : b.paymentStatus.localeCompare(a.paymentStatus);
        } else if (sortField === 'calculatedGrade') {
          const aGrade = a.calculatedGrade || '';
          const bGrade = b.calculatedGrade || '';
          return sortOrder === 'asc'
            ? aGrade.localeCompare(bGrade)
            : bGrade.localeCompare(aGrade);
        }
        return 0;
      });
      
      // Calculate total stock value
      const totalValue = filteredStocksData.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
      setTotalStockValue(totalValue);
      
      // Collect unique producer IDs
      const producerIds = [...new Set(filteredStocksData.map(stock => stock.producerId))];
      
      // Fetch producer names if not already in state
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
      
      setStocks(filteredStocksData);
      setIsLoading(false);
    });
    
    stocksListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  // Function to set up the warehouses listener
  const setupWarehousesListener = () => {
    const warehousesQuery = query(collection(db, 'warehouses'));
    
    const unsubscribe = onSnapshot(warehousesQuery, (snapshot) => {
      const warehousesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Warehouse[];
      
      setWarehouses(warehousesData);
    });
    
    warehousesListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  // Function to set up the collections listener
  const setupCollectionsListener = () => {
    const collectionsQuery = query(
      collection(db, 'collections'),
      where('processedToStock', '==', false)
    );
    
    const unsubscribe = onSnapshot(collectionsQuery, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }));
      
      setCollections(collectionsData);
    });
    
    collectionsListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  useEffect(() => {
    // Set up initial listeners
    const unsubscribeStocks = setupStocksListener();
    const unsubscribeWarehouses = setupWarehousesListener();
    const unsubscribeCollections = setupCollectionsListener();

    return () => {
      unsubscribeStocks();
      unsubscribeWarehouses();
      unsubscribeCollections();
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleAssignWarehouse = (stock: StockEntry) => {
    setSelectedStock(stock);
    setIsWarehouseModalOpen(true);
  };

  const handleQualityAssessment = (stock: StockEntry) => {
    setSelectedStock(stock);
    setIsQualityModalOpen(true);
  };

  const handleCreateStock = () => {
    setIsStockCreationModalOpen(true);
  };

  const handleCreateWarehouse = () => {
    setSelectedWarehouse(null);
    setIsWarehouseFormOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsWarehouseFormOpen(true);
  };

  const handleCombineStocks = () => {
    if (selectedStocks.length < 2) {
      toast.error('Veuillez sélectionner au moins deux stocks');
      return;
    }
    
    // Navigate to the combined tab with selected stock IDs
    const stockIds = selectedStocks.map(stock => stock.id).join(',');
    navigate(`/stocks?tab=combined&create=true&stocks=${stockIds}`);
  };

  const handleAssignWarehouseSubmit = async (stock: StockEntry, warehouseId: string) => {
    if (!stock.id) return;
    
    try {
      // Get the warehouse
      const warehouseRef = doc(db, 'warehouses', warehouseId);
      const warehouseDoc = await getDoc(warehouseRef);
      
      if (!warehouseDoc.exists()) {
        throw new Error('Warehouse not found');
      }
      
      const warehouse = warehouseDoc.data() as Warehouse;
      
      // Calculate new stock in warehouse
      let newStock = warehouse.currentStock;
      
      // If stock was already in a warehouse, subtract it from that warehouse
      if (stock.warehouseId) {
        const oldWarehouseRef = doc(db, 'warehouses', stock.warehouseId);
        const oldWarehouseDoc = await getDoc(oldWarehouseRef);
        
        if (oldWarehouseDoc.exists()) {
          const oldWarehouse = oldWarehouseDoc.data() as Warehouse;
          await updateDoc(oldWarehouseRef, {
            currentStock: Math.max(0, oldWarehouse.currentStock - stock.quantity)
          });
        }
      }
      
      // Add stock to new warehouse
      newStock += stock.quantity;
      
      // Update warehouse
      await updateDoc(warehouseRef, {
        currentStock: newStock
      });
      
      // Update stock
      await updateDoc(doc(db, 'stocks', stock.id), {
        warehouseId
      });
      
      toast.success('Stock assigné au magasin avec succès');
      setIsWarehouseModalOpen(false);
      setSelectedStock(null);
    } catch (error) {
      console.error('Error assigning warehouse:', error);
      toast.error('Erreur lors de l\'assignation du magasin');
    }
  };

  const handleQualityAssessmentSubmit = async (updatedData: Partial<StockEntry>) => {
    if (!selectedStock?.id) return;
    
    try {
      await updateDoc(doc(db, 'stocks', selectedStock.id), updatedData);
      toast.success('Évaluation de qualité enregistrée');
      setIsQualityModalOpen(false);
      setSelectedStock(null);
    } catch (error) {
      console.error('Error updating quality assessment:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'évaluation');
    }
  };

  const handleStockCreation = async (selectedCollections: any[]) => {
    // This is handled in StockCreationForm component
    setIsStockCreationModalOpen(false);
  };

  const handleToggleStockSelection = (stock: StockEntry) => {
    if (selectedStocks.some(s => s.id === stock.id)) {
      setSelectedStocks(prev => prev.filter(s => s.id !== stock.id));
    } else {
      setSelectedStocks(prev => [...prev, stock]);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    // Filter by search query
    const producerName = producerNames[stock.producerId] || '';
    const matchesSearch = 
      producerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.stockNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'available' ? (!stock.status || stock.status === 'available') :
      filterStatus === 'assigned' ? stock.status === 'assigned' :
      filterStatus === 'partially_delivered' ? stock.status === 'partially_delivered' :
      filterStatus === 'delivered' ? stock.status === 'delivered' :
      true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <StockStats 
        stocks={stocks.filter(s => !s.status || s.status !== 'delivered')} 
        warehouses={warehouses}
        totalStockValue={totalStockValue}
      />

      <WarehouseInfoDisplay 
        warehouses={warehouses} 
        totalStockValue={totalStockValue}
        onEditWarehouse={handleEditWarehouse}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Stocks individuels</h2>
            <div className="flex gap-2">
              <button 
                onClick={handleCreateStock}
                className="btn-primary"
                disabled={collections.length === 0}
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau stock</span>
              </button>
              <button 
                onClick={handleCreateWarehouse}
                className="btn-secondary"
              >
                <Building2 className="w-5 h-5" />
                <span>Nouveau magasin</span>
              </button>
              {selectedStocks.length >= 2 && (
                <button 
                  onClick={handleCombineStocks}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Layers className="w-5 h-5" />
                  <span>Combiner {selectedStocks.length} stocks</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par producteur ou n° stock..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="available">Disponibles</option>
                <option value="assigned">Assignés</option>
                <option value="partially_delivered">Partiellement livrés</option>
                <option value="delivered">Livrés</option>
              </select>
            </div>
          </div>
        </div>

        <StockTable 
          stocks={filteredStocks}
          producerNames={producerNames}
          warehouses={warehouses}
          onAssignWarehouse={handleAssignWarehouse}
          onQualityAssessment={handleQualityAssessment}
          onSort={handleSort}
          sortConfig={{ key: sortField, direction: sortOrder }}
          selectionMode={true}
          selectedStocks={selectedStocks}
          onToggleSelection={handleToggleStockSelection}
        />
      </div>

      <Modal isOpen={isWarehouseModalOpen} onClose={() => {
        setIsWarehouseModalOpen(false);
        setSelectedStock(null);
      }}>
        <StockWarehouseForm
          onClose={() => {
            setIsWarehouseModalOpen(false);
            setSelectedStock(null);
          }}
          onSubmit={handleAssignWarehouseSubmit}
          stockEntry={selectedStock}
          warehouses={warehouses}
          producerName={selectedStock ? producerNames[selectedStock.producerId] || 'Chargement...' : ''}
        />
      </Modal>

      <Modal isOpen={isQualityModalOpen} onClose={() => {
        setIsQualityModalOpen(false);
        setSelectedStock(null);
      }}>
        {selectedStock && (
          <QualityAssessmentForm<StockEntry>
            data={selectedStock}
            onSave={handleQualityAssessmentSubmit}
            onClose={() => {
              setIsQualityModalOpen(false);
              setSelectedStock(null);
            }}
          />
        )}
      </Modal>

      <Modal isOpen={isStockCreationModalOpen} onClose={() => setIsStockCreationModalOpen(false)}>
        <StockCreationForm
          onClose={() => setIsStockCreationModalOpen(false)}
          onSubmit={handleStockCreation}
          collections={collections}
          producerName={(id) => producerNames[id] || 'Chargement...'}
        />
      </Modal>

      <Modal isOpen={isWarehouseFormOpen} onClose={() => {
        setIsWarehouseFormOpen(false);
        setSelectedWarehouse(null);
      }}>
        <WarehouseForm
          onClose={() => {
            setIsWarehouseFormOpen(false);
            setSelectedWarehouse(null);
          }}
          warehouse={selectedWarehouse}
        />
      </Modal>
    </div>
  );
}