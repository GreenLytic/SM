import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockEntry, StockGroup } from '../../types/stock';
import { Search, Plus, Layers, Eye, Trash2, Download, FileText, Package, X } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StockGroupPDF from './StockGroupPDF';
import StockGroupLabelPDF from './StockGroupLabelPDF';
import Modal from '../Modal';
import StockGroupForm from './StockGroupForm';
import StockGroupDetails from './StockGroupDetails';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StockCombinedTab() {
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'partially_delivered' | 'delivered'>('all');
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StockGroup | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to track active listeners so we can unsubscribe properly
  const groupsListenerRef = useRef<() => void | null>(null);
  const stocksListenerRef = useRef<() => void | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const create = params.get('create');
    const stocksParam = params.get('stocks');
    
    if (tab === 'combined' && create === 'true' && stocksParam) {
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
        setIsGroupFormOpen(true);
        
        // Clear URL parameters
        navigate('/stocks', { replace: true });
      };
      
      fetchSelectedStocks();
    }
  }, [location]);

  // Listen for stock update events from delivery completions
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log('Stock update event received, refreshing stock groups data');
      
      // Re-fetch data
      if (groupsListenerRef.current) {
        groupsListenerRef.current(); // Unsubscribe from current listener
      }
      if (stocksListenerRef.current) {
        stocksListenerRef.current(); // Unsubscribe from current listener
      }
      
      // Set up new listeners
      setTimeout(() => {
        setupGroupsListener();
        setupStocksListener();
      }, 100);
    };
    
    window.addEventListener('stockUpdate', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, []);

  // Function to set up the stock groups listener
  const setupGroupsListener = () => {
    // Fetch stock groups
    const groupsQuery = query(
      collection(db, 'stockGroups'), 
      where('archived', '==', false)
    );
    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as StockGroup[];
      
      // Sort in memory instead of using orderBy to avoid index requirement
      const sortedGroups = groupsData.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      setStockGroups(sortedGroups);
    });
    
    groupsListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  // Function to set up the stocks listener
  const setupStocksListener = () => {
    // Fetch all stocks
    const stocksQuery = query(collection(db, 'stocks'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(stocksQuery, (snapshot) => {
      const stocksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as StockEntry[];
      setStocks(stocksData);
      
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
    // Set up initial listeners
    const unsubscribeGroups = setupGroupsListener();
    const unsubscribeStocks = setupStocksListener();

    return () => {
      unsubscribeGroups();
      unsubscribeStocks();
    };
  }, []);

  const handleCreateGroup = async (name: string, notes?: string) => {
    try {
      if (selectedStocks.length < 2) {
        toast.error('Veuillez sélectionner au moins deux stocks');
        return;
      }

      // Calculate total quantity and bags
      const totalQuantity = selectedStocks.reduce((sum, stock) => sum + stock.quantity, 0);
      const totalBags = selectedStocks.reduce((sum, stock) => sum + (stock.bagCount || 0), 0);

      // Get unique warehouse IDs and producer IDs
      const warehouseIds = [...new Set(selectedStocks.map(stock => stock.warehouseId).filter(Boolean))];
      const producerIds = [...new Set(selectedStocks.map(stock => stock.producerId))];

      // Create stock group
      const stockGroupData: Omit<StockGroup, 'id'> = {
        name,
        stockIds: selectedStocks.map(stock => stock.id!),
        totalQuantity,
        totalBags,
        warehouseIds,
        producerIds,
        createdAt: new Date(),
        notes,
        archived: false
      };

      const groupRef = await addDoc(collection(db, 'stockGroups'), stockGroupData);
      
      // Update all selected stocks with the group ID
      for (const stock of selectedStocks) {
        if (stock.id) {
          // Vérifier que le stock n'est pas déjà dans un groupe
          if (stock.isGrouped) {
            console.warn(`Stock ${stock.id} is already in a group, skipping`);
            continue;
          }
          
          await updateDoc(doc(db, 'stocks', stock.id), {
            isGrouped: true,
            groupId: name // Use the lot name instead of the ID
          });
        }
      }

      toast.success('Groupe de stocks créé avec succès');
      setIsGroupFormOpen(false);
      setSelectedStocks([]);
    } catch (error) {
      console.error('Error creating stock group:', error);
      toast.error('Erreur lors de la création du groupe de stocks');
    }
  };

  const handleViewDetails = (group: StockGroup) => {
    setSelectedGroup(group);
    setIsGroupDetailsOpen(true);
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      // Mark the group as archived
      await updateDoc(doc(db, 'stockGroups', groupId), {
        archived: true,
        archivedAt: new Date()
      });
      
      // Get the group's stocks
      const group = stockGroups.find(g => g.id === groupId);
      if (group) {
        // Update all stocks in the group to remove the group association
        for (const stockId of group.stockIds) {
          await updateDoc(doc(db, 'stocks', stockId), {
            isGrouped: false,
            groupId: null
          });
        }
      }
      
      toast.success('Groupe dissocié avec succès');
      setIsGroupDetailsOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error archiving group:', error);
      toast.error('Erreur lors de la dissociation du groupe');
    }
  };

  const filteredGroups = stockGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === 'all' || (() => {
      // Calculate actual status based on quantities
      const deliveredQuantity = group.deliveredQuantity || 0;
      const remainingQuantity = group.remainingQuantity !== undefined 
        ? group.remainingQuantity 
        : group.totalQuantity - deliveredQuantity;
      
      let actualStatus = 'available';
      if (remainingQuantity <= 0.001) {
        actualStatus = 'delivered';
      } else if (deliveredQuantity > 0.001) {
        actualStatus = 'partially_delivered';
      }
      
      // Apply filter based on actual status
      return statusFilter === actualStatus;
    })())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Lots combinés
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponibles</option>
              <option value="partially_delivered">Partiellement livrés</option>
              <option value="delivered">Livrés</option>
            </select>
            <button
              onClick={() => setIsGroupFormOpen(true)}
              className="btn-primary"
              disabled={stocks.filter(s => !s.isGrouped).length < 2}
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau lot</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lot combiné</h3>
            <p className="text-gray-500 mb-4">
              Vous n'avez pas encore créé de lots combinés. Utilisez l'onglet "Stocks individuels" 
              et le bouton "Combiner stocks" pour créer votre premier lot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              // Get the actual stock objects for this group
              const groupStocks = stocks.filter(stock => group.stockIds.includes(stock.id!));
              
              // Get unique producer names
              const producers = [...new Set(group.producerIds.map(id => producerNames[id] || 'Producteur inconnu'))];
              
              // Get warehouse names
              const warehouses = group.warehouseIds.map(id => warehouseNames[id] || 'Magasin inconnu');
              
              // Calculate current quantities using the correct properties
              const deliveredQuantity = group.deliveredQuantity || 0;
              const deliveredBags = group.deliveredBags || 0;
              
              // Use remainingQuantity if it exists, otherwise calculate it
              const currentQuantity = group.remainingQuantity !== undefined 
                ? group.remainingQuantity 
                : Math.max(0, group.totalQuantity - deliveredQuantity);
              const currentBags = group.remainingBags !== undefined 
                ? group.remainingBags 
                : Math.max(0, group.totalBags - deliveredBags);
              
              // Calculate actual status for display and logic
              const actualStatus = (() => {
                if (currentQuantity <= 0.001) return 'delivered';
                if (deliveredQuantity > 0.001) return 'partially_delivered';
                return 'available';
              })();
              
              // Check if group should be locked - corrected logic
              const isLocked = group.locked === true || deliveredQuantity > 0.001;
              
              // Get status info
              const getStatusInfo = () => {
                switch (actualStatus) {
                  case 'delivered':
                    return { text: 'Livré', color: 'bg-gray-100 text-gray-700' };
                  case 'partially_delivered':
                    return { text: 'Partiellement livré', color: 'bg-orange-100 text-orange-800' };
                  default:
                    return { text: 'Disponible', color: 'bg-green-100 text-green-800' };
                }
              };
              
              const statusInfo = getStatusInfo();

              return (
                <div key={group.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Lot #{group.name}</h4>
                        <p className="text-sm text-gray-500">Créé le {group.createdAt.toLocaleDateString()}</p>
                        {group.locked && (
                          <p className="text-xs text-blue-600 font-medium">🔒 Verrouillé (utilisé en livraison)</p>
                        )}
                        {actualStatus === 'delivered' && (
                          <p className="text-xs text-gray-600 font-medium">📦 Entièrement livré</p>
                        )}
                        {actualStatus === 'partially_delivered' && (
                          <p className="text-xs text-orange-600 font-medium">🚛 Partiellement livré</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>

                    {/* Debug info - remove in production */}
                    <div className="text-xs text-gray-400 mb-2">
                      Debug: total={group.totalQuantity}, delivered={deliveredQuantity}, current={currentQuantity}, totalBags={group.totalBags}, deliveredBags={deliveredBags}
                    </div>
                        {statusInfo.text}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Quantité</p>
                        <p className="font-medium">
                          {currentQuantity.toFixed(2)} / {(group.totalQuantity || 0).toFixed(2)} tonnes
                        </p>
                        {deliveredQuantity > 0.001 && (
                          <p className="text-xs text-orange-600">
                            Livré: {deliveredQuantity.toFixed(2)} tonnes
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sacs</p>
                        <p className="font-medium">{currentBags} / {group.totalBags || 0}</p>
                        {deliveredBags > 0 && (
                          <p className="text-xs text-orange-600">
                            Livré: {deliveredBags} sacs
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Stocks</p>
                        <p className="font-medium">{group.stockIds.length} stocks</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Producteurs</p>
                        <p className="font-medium">
                          {producers.length > 3 
                            ? `${producers.slice(0, 3).join(', ')} +${producers.length - 3}`
                            : producers.join(', ')}
                        </p>
                      </div>
                      {warehouses.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Magasins</p>
                          <p className="font-medium">
                            {warehouses.length > 2
                              ? `${warehouses.slice(0, 2).join(', ')} +${warehouses.length - 2}`
                              : warehouses.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleViewDetails(group)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Détails</span>
                      </button>
                      
                      <PDFDownloadLink
                        document={
                          <StockGroupPDF 
                            group={group} 
                            stocks={groupStocks} 
                            producerNames={producerNames}
                            warehouseNames={warehouseNames}
                          />
                        }
                        fileName={`lot_${group.name.replace(/\s+/g, '_').toLowerCase()}.pdf`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                      >
                        {({ loading }) => (
                          <>
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span>PDF</span>
                          </>
                        )}
                      </PDFDownloadLink>
                      
                      <PDFDownloadLink
                        document={<StockGroupLabelPDF group={group} />}
                        fileName={`etiquette_lot_${group.name.replace(/\s+/g, '_').toLowerCase()}.pdf`}
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
                      
                      {!isLocked && actualStatus !== 'delivered' ? (
                        <button
                          onClick={() => handleArchiveGroup(group.id!)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded-md hover:bg-red-50 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Dissocier</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 px-2 py-1 border border-gray-200 rounded-md ml-auto">
                          <Trash2 className="w-4 h-4" />
                          <span>
                            {actualStatus === 'delivered' ? 'Entièrement livré' : 
                             group.locked === true ? 'Verrouillé' : 'Utilisé en livraison'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isGroupFormOpen} 
        onClose={() => {
          setIsGroupFormOpen(false);
          setSelectedStocks([]);
        }}
      >
        <StockGroupForm
          onClose={() => {
            setIsGroupFormOpen(false);
            setSelectedStocks([]);
          }}
          onSubmit={handleCreateGroup}
          selectedStocks={selectedStocks}
          availableStocks={stocks.filter(s => !s.isGrouped)}
          producerNames={producerNames}
        />
      </Modal>

      <Modal 
        isOpen={isGroupDetailsOpen} 
        onClose={() => {
          setIsGroupDetailsOpen(false);
          setSelectedGroup(null);
        }}
        size="lg"
      >
        {selectedGroup && (
          <StockGroupDetails
            group={selectedGroup}
            stocks={stocks.filter(s => selectedGroup.stockIds.includes(s.id!))}
            producerNames={producerNames}
            warehouseNames={warehouseNames}
            onClose={() => {
              setIsGroupDetailsOpen(false);
              setSelectedGroup(null);
            }}
            onDisassociate={() => handleArchiveGroup(selectedGroup.id!)}
          />
        )}
      </Modal>
    </div>
  );
}