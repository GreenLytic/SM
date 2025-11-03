import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockGroup } from '../../types/stock';
import { Search, Archive, FileText, Eye } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StockGroupPDF from './StockGroupPDF';
import Modal from '../Modal';
import StockGroupDetails from './StockGroupDetails';

export default function StockArchivedTab() {
  const [archivedGroups, setArchivedGroups] = useState<StockGroup[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [producerNames, setProducerNames] = useState<Record<string, string>>({});
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<StockGroup | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use a ref to track active listeners so we can unsubscribe properly
  const groupsListenerRef = useRef<() => void | null>(null);

  // Listen for stock update events from delivery completions
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log('Stock update event received, refreshing archived groups data');
      
      // Re-fetch data
      if (groupsListenerRef.current) {
        groupsListenerRef.current(); // Unsubscribe from current listener
      }
      
      // Set up new listener
      setupGroupsListener();
    };
    
    window.addEventListener('stockUpdate', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, []);

  // Function to set up the archived stock groups listener
  const setupGroupsListener = () => {
    // Fetch archived stock groups
    const groupsQuery = query(
      collection(db, 'stockGroups'),
      where('archived', '==', true),
    );
    
    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        archivedAt: doc.data().archivedAt?.toDate()
      })) as StockGroup[];
      
      // Sort in memory instead of using orderBy to avoid index requirement
      const sortedGroups = groupsData.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      setArchivedGroups(groupsData);
      
      // Collect all stock IDs from all groups
      const allStockIds = groupsData.flatMap(group => group.stockIds);
      
      // Collect all producer and warehouse IDs
      const allProducerIds = [...new Set(groupsData.flatMap(group => group.producerIds))];
      const allWarehouseIds = [...new Set(groupsData.flatMap(group => group.warehouseIds))];
      
      // Fetch producer names
      allProducerIds.forEach(async (id) => {
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
      allWarehouseIds.forEach(async (id) => {
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
      
      // Fetch all stocks referenced in any group
      if (allStockIds.length > 0) {
        const fetchStocks = async () => {
          const stocksData: any[] = [];
          
          // Fetch in batches of 10 to avoid large queries
          for (let i = 0; i < allStockIds.length; i += 10) {
            const batch = allStockIds.slice(i, i + 10);
            for (const stockId of batch) {
              try {
                const stockDoc = await getDoc(doc(db, 'stocks', stockId));
                if (stockDoc.exists()) {
                  stocksData.push({
                    id: stockDoc.id,
                    ...stockDoc.data(),
                    date: stockDoc.data().date?.toDate()
                  });
                }
              } catch (error) {
                console.error(`Error fetching stock ${stockId}:`, error);
              }
            }
          }
          
          setStocks(stocksData);
          setIsLoading(false);
        };
        
        fetchStocks();
      } else {
        setIsLoading(false);
      }
    });
    
    groupsListenerRef.current = unsubscribe;
    return unsubscribe;
  };

  useEffect(() => {
    // Set up initial listener
    const unsubscribeGroups = setupGroupsListener();

    return () => {
      unsubscribeGroups();
    };
  }, []);

  const filteredGroups = archivedGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (group: StockGroup) => {
    setSelectedGroup(group);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-600" />
            Lots dissociés
          </h3>
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lot dissocié</h3>
            <p className="text-gray-500">
              Les lots dissociés apparaîtront ici pour référence historique.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              // Get the actual stock objects for this group
              const groupStocks = stocks.filter(stock => group.stockIds.includes(stock.id));
              
              // Get unique producer names
              const producers = [...new Set(group.producerIds.map(id => producerNames[id] || 'Producteur inconnu'))];
              
              // Get warehouse names
              const warehouses = group.warehouseIds.map(id => warehouseNames[id] || 'Magasin inconnu');

              return (
                <div key={group.id} className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Lot #{group.name}</h4>
                        <p className="text-sm text-gray-500">Dissocié le {group.archivedAt?.toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                        Archivé
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Quantité totale</p>
                        <p className="font-medium">{group.totalQuantity.toFixed(2)} tonnes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nombre de sacs</p>
                        <p className="font-medium">{group.totalBags}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Producteurs</p>
                        <p className="font-medium">
                          {producers.length > 3 
                            ? `${producers.slice(0, 3).join(', ')} +${producers.length - 3}`
                            : producers.join(', ')}
                        </p>
                      </div>
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
                        fileName={`lot_archive_${group.name.replace(/\s+/g, '_').toLowerCase()}.pdf`}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedGroup(null);
        }}
        size="lg"
      >
        {selectedGroup && (
          <StockGroupDetails
            group={selectedGroup}
            stocks={stocks.filter(s => selectedGroup.stockIds.includes(s.id))}
            producerNames={producerNames}
            warehouseNames={warehouseNames}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedGroup(null);
            }}
            isArchived={true}
          />
        )}
      </Modal>
    </div>
  );
}