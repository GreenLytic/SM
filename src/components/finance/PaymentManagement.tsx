import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockEntry } from '../../types/stock';
import { Producer } from '../../types/producer'; 
import { Search, CreditCard, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Modal from '../Modal';
import StockPaymentForm from '../StockPaymentForm';
import { toast } from 'react-hot-toast';
import PaymentStats from '../PaymentStats';
import { onSnapshot } from 'firebase/firestore';
import { InvoiceService } from '../InvoiceService';

type SortField = 'date' | 'totalCost' | 'amountPaid';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'partial' | 'completed';

const PaymentManagement: React.FC = () => {
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ensure all stocks have invoices
        await InvoiceService.ensureInvoicesForAllStocks();
        
        // Fetch producers
        const producersQuery = query(collection(db, 'producers'));
        const producersSnapshot = await getDocs(producersQuery);
        const producersData = producersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate()
        })) as Producer[];
        
        setProducers(producersData);
        
        // Create producer names lookup
        const names: Record<string, string> = {};
        producersData.forEach(producer => {
          if (producer.id) {
            names[producer.id] = producer.fullName;
          }
        });
        
        setProducerNames(names); 
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        // Don't set loading to false here, it will be set when stocks are loaded
      }
    };
    
    fetchData();
    
    // Use onSnapshot to listen for real-time updates to stocks
    setIsLoading(true);
    const stocksQuery = query(
      collection(db, 'stocks'), 
      orderBy(sortField, sortOrder)
    );
    
    const unsubscribe = onSnapshot(stocksQuery, (snapshot) => {
      const stocksData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        }))
        .filter(stock => !stock.isCombined && !stock.combinedIntoStock) as StockEntry[];
      
      setStocks(stocksData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to stocks:', error);
      toast.error('Erreur lors du chargement des stocks');
      setIsLoading(false);
    });
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Non payé';
      case 'partial': return 'Partiellement payé';
      case 'completed': return 'Payé';
      default: return status;
    }
  };

  const handlePayment = (stock: StockEntry) => {
    setSelectedStock(stock);
    setIsPaymentModalOpen(true);
  };

  const filteredStocks = stocks.filter(stock => {
    // Filter by search query
    const producerName = producerNames[stock.producerId] || '';
    const matchesSearch = 
      producerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.stockNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by payment status
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === stock.paymentStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PaymentStats />

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Paiements des stocks</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">Non payés</option>
                <option value="partial">Partiellement payés</option>
                <option value="completed">Payés</option>
              </select>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par producteur ou n° stock..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Date
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('totalCost')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Montant total
                    {getSortIcon('totalCost')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('amountPaid')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Montant payé
                    {getSortIcon('amountPaid')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reste à payer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    Aucun stock trouvé
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.date?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.stockNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producerNames[stock.producerId] || 'Chargement...'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.quantity?.toFixed(2)} tonnes
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.totalCost ? stock.totalCost.toLocaleString() : '0'} FCFA
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stock.amountPaid ? stock.amountPaid.toLocaleString() : '0'} FCFA
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">
                      {((stock.totalCost || 0) - (stock.amountPaid || 0)).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stock.paymentStatus)}`}>
                        {getStatusText(stock.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {stock.paymentStatus !== 'completed' && (
                        <button
                          onClick={() => handlePayment(stock)}
                          className="flex items-center gap-1 px-2 py-1 border border-green-200 rounded-md text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Paiement</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => {
        setIsPaymentModalOpen(false);
        setSelectedStock(null);
      }}>
        <StockPaymentForm
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedStock(null);
          }}
          entry={selectedStock}
          producerName={selectedStock ? producerNames[selectedStock.producerId] || 'Chargement...' : ''}
        />
      </Modal>
    </div>
  );
};

export default PaymentManagement;