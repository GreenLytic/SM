import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Collection } from '../types/collection';
import { Producer } from '../types/producer';
import { Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, FileText, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import CollectionForm from './CollectionForm';
import CollectionStats from './CollectionStats';
import QualityAssessmentForm from './QualityAssessmentForm';
import { toast } from 'react-hot-toast';
import CollectionDetails from './CollectionDetails';

type SortField = 'date' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function CollectionList() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    // Fetch producers first
    const producersQuery = query(collection(db, 'producers'), orderBy('fullName'));
    const producersUnsubscribe = onSnapshot(producersQuery, (snapshot) => {
      const producerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate()
      })) as Producer[];
      setProducers(producerData);
    });

    // Fetch collections
    const collectionsQuery = query(collection(db, 'collections'), orderBy(sortField, sortOrder));
    const collectionsUnsubscribe = onSnapshot(collectionsQuery, (snapshot) => {
      const collectionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as Collection[];
      setCollections(collectionData);
    });

    return () => {
      producersUnsubscribe();
      collectionsUnsubscribe();
    };
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
      <ArrowUp className="w-4 h-4 text-primary" /> : 
      <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const getProducerName = (producerId: string) => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.fullName || 'Producteur inconnu';
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'Grade I': return 'bg-green-100 text-green-800';
      case 'Grade II': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleQualityAssessment = async (updatedData: Partial<Collection>) => {
    if (!selectedCollection?.id) return;
    
    try {
      // Update collection with quality assessment data
      await updateDoc(doc(db, 'collections', selectedCollection.id), {
        ...updatedData,
        // Update quality based on calculated grade
        quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
      });
      
      // If this collection is linked to a stock, update the stock as well
      if (selectedCollection.stockId) {
        await updateDoc(doc(db, 'stocks', selectedCollection.stockId), {
          ...updatedData,
          // Update quality based on calculated grade
          quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                  updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
        });
      } else {
        // If no direct stockId link, try to find stocks that include this collection
        const stocksQuery = query(
          collection(db, 'stocks'), 
          where('collections', 'array-contains', selectedCollection.id)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        
        if (!stocksSnapshot.empty) {
          // Update each stock that contains this collection
          for (const stockDoc of stocksSnapshot.docs) {
            await updateDoc(doc(db, 'stocks', stockDoc.id), {
              ...updatedData,
              // Update quality based on calculated grade
              quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                      updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
            });
          }
        }
      }
      
      toast.success('Évaluation de qualité enregistrée');
      setIsQualityModalOpen(false);
      setSelectedCollection(null);
    } catch (error) {
      console.error('Error updating quality assessment:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'évaluation');
    }
  };

  const getSelectedProducer = (producerId: string) => {
    return producers.find(p => p.id === producerId);
  };

  const filteredCollections = collections.filter(collection => {
    const producerName = getProducerName(collection.producerId).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return producerName.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <CollectionStats collections={collections} />

      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Collecte</h2>
            <button 
              onClick={() => {
                setSelectedCollection(null);
                setIsCollectionModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvelle collecte</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom du producteur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    Producteur
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('quantity')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Quantité (tonnes)
                    {getSortIcon('quantity')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    Nombre de sacs
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    Grade
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    Humidité (%)
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                filteredCollections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {collection.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getProducerName(collection.producerId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {collection.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {collection.bagCount || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {collection.calculatedGrade ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(collection.calculatedGrade)}`}>
                          {collection.calculatedGrade}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Non évalué
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {collection.humidity}%
                      {collection.humidity > 7.5 && (
                        <span className="ml-2 text-xs text-amber-600">⚠️</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCollection(collection);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCollection(collection);
                            setIsCollectionModalOpen(true);
                          }}
                          className="text-primary hover:text-primary-dark"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCollection(collection);
                            setIsQualityModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Qualité
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCollectionModalOpen} onClose={() => {
        setIsCollectionModalOpen(false);
        setSelectedCollection(null);
      }}>
        <CollectionForm 
          onClose={() => {
            setIsCollectionModalOpen(false);
            setSelectedCollection(null);
          }} 
          currentCollection={selectedCollection} 
          producers={producers} 
        />
      </Modal>

      <Modal isOpen={isQualityModalOpen} onClose={() => {
        setIsQualityModalOpen(false);
        setSelectedCollection(null);
      }}>
        {selectedCollection && (
          <QualityAssessmentForm<Collection>
            data={selectedCollection}
            onSave={handleQualityAssessment}
            onClose={() => {
              setIsQualityModalOpen(false);
              setSelectedCollection(null);
            }}
          />
        )}
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => {
        setIsDetailsModalOpen(false);
        setSelectedCollection(null);
      }}>
        {selectedCollection && (
          <CollectionDetails
            collection={selectedCollection}
            producer={getSelectedProducer(selectedCollection.producerId)}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedCollection(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}