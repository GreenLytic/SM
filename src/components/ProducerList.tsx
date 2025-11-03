import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Producer } from '../types/producer';
import { Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, Edit2, MoreVertical } from 'lucide-react';
import Modal from './Modal';
import ProducerForm from './ProducerForm';
import ProducerStats from './ProducerStats';
import { toast } from 'react-hot-toast';
import { calculateProducerPerformance, rankProducers, getBadgeColor } from '../utils/producerRanking';

type SortField = 'fullName' | 'cultivatedArea' | 'estimatedProduction' | 'joinDate';
type SortOrder = 'asc' | 'desc';

export default function ProducerList() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  useEffect(() => {
    const q = query(collection(db, 'producers'), orderBy(sortField, sortOrder));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const producerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate()
      })) as Producer[];
      setProducers(producerData);
    });

    return () => unsubscribe();
  }, [sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-primary" /> : 
      <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const toggleStatus = async (producer: Producer) => {
    if (!producer.id) return;
    
    try {
      const newStatus = producer.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'producers', producer.id), {
        status: newStatus
      });
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
    setShowActions(null);
  };

  const handleEdit = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsModalOpen(true);
    setShowActions(null);
  };

  const filteredProducers = producers.filter(producer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      producer.fullName.toLowerCase().includes(searchLower) ||
      producer.phone.toLowerCase().includes(searchLower) ||
      producer.email.toLowerCase().includes(searchLower) ||
      (producer.cni && producer.cni.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">Producteurs</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeTab === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeTab === 'stats'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Statistiques
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedProducer(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un producteur</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, email ou CNI..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {activeTab === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('fullName')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Nom
                      {getSortIcon('fullName')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CNI
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('cultivatedArea')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Surface (ha)
                      {getSortIcon('cultivatedArea')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('estimatedProduction')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Production (t)
                      {getSortIcon('estimatedProduction')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('joinDate')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Date d'inscription
                      {getSortIcon('joinDate')}
                    </button>
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
                {filteredProducers.map((producer) => (
                  <tr key={producer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producer.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{producer.phone}</div>
                      <div className="text-sm text-gray-500">{producer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {producer.cni || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producer.cultivatedArea}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producer.estimatedProduction}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producer.joinDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        producer.status === 'active' 
                          ? 'bg-success-light text-success-dark' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {producer.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setShowActions(showActions === producer.id ? null : producer.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      
                      {showActions === producer.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleEdit(producer)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </button>
                            <button
                              onClick={() => toggleStatus(producer)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {producer.status === 'active' ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ProducerStats producers={producers} />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setSelectedProducer(null);
      }}>
        <ProducerForm 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProducer(null);
          }} 
          producer={selectedProducer} 
        />
      </Modal>
    </div>
  );
}