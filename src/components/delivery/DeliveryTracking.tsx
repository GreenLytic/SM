import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DeliveryOrder } from '../../types/delivery';
import { Search, FileText, Truck, Clock, CheckCircle, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from '../Modal';
import DeliveryDetails from './DeliveryDetails';
import DeliveryCompletionForm from '../DeliveryCompletionForm';
import { toast } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DeliveryReportPDF from '../DeliveryReportPDF';
import DeliveryNoteDocument from './documents/DeliveryNoteDocument';
import ProformaInvoiceDocument from './documents/ProformaInvoiceDocument';
import LogisticLabelDocument from './documents/LogisticLabelDocument';
import QualityCertificateDocument from './documents/QualityCertificateDocument';

export default function DeliveryTracking() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'note' | 'invoice' | 'label' | 'certificate'>('note');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    // Créer la requête de base
    let deliveriesQuery = query(
      collection(db, 'deliveryOrders'),
      orderBy('deliveryDate', 'desc')
    );

    // Ajouter le filtre de statut si nécessaire
    if (filterStatus !== 'all') {
      deliveriesQuery = query(
        collection(db, 'deliveryOrders'),
        where('status', '==', filterStatus),
        orderBy('deliveryDate', 'desc')
      );
    }

    const unsubscribe = onSnapshot(deliveriesQuery, (snapshot) => {
      const deliveryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deliveryDate: doc.data().deliveryDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      })) as DeliveryOrder[];
      setDeliveries(deliveryData);
    });

    return () => unsubscribe();
  }, [filterStatus]);

  const handleStatusChange = async (delivery: DeliveryOrder, newStatus: 'in-progress' | 'completed') => {
    if (!delivery.id) return;

    try {
      if (newStatus === 'completed') {
        setSelectedDelivery(delivery);
        setIsCompletionModalOpen(true);
      } else {
        // Update delivery status to in-progress
        await updateDoc(doc(db, 'deliveryOrders', delivery.id), {
          status: newStatus,
          trackingUpdates: [
            ...delivery.trackingUpdates,
            {
              timestamp: new Date(),
              status: newStatus === 'in-progress' ? 'Livraison en cours' : 'Livraison terminée',
              location: delivery.deliveryAddress
            }
          ]
        });
        toast.success('Statut de la livraison mis à jour');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleCancelDelivery = async (delivery: DeliveryOrder) => {
    if (!delivery.id) return;

    try {
      // Libérer les réservations des stocks et remettre les quantités des lots
      for (const product of delivery.products) {
        // Libérer la réservation
        const reservationsQuery = query(
          collection(db, 'stockReservations'),
          where('deliveryOrderId', '==', delivery.id),
          where('itemId', '==', product.stockId)
        );
        
        const reservationSnapshot = await getDocs(reservationsQuery);
        const deletePromises = reservationSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        // Remettre le stock en statut disponible
        await updateDoc(doc(db, 'stocks', product.stockId), {
          status: 'available'
        });
        
        // Si c'est un stock faisant partie d'un lot, restaurer la quantité du lot
        if (product.lotId) {
          const stockGroupsQuery = query(
            collection(db, 'stockGroups'),
            where('name', '==', product.lotId),
            where('archived', '==', false)
          );
          const stockGroupsSnapshot = await getDocs(stockGroupsQuery);
          
          if (!stockGroupsSnapshot.empty) {
            const stockGroupDoc = stockGroupsSnapshot.docs[0];
            const stockGroupData = stockGroupDoc.data();
            
            // Restaurer la quantité dans le lot
            const newTotalQuantity = stockGroupData.totalQuantity + product.quantity;
            const newTotalBags = stockGroupData.totalBags + (product.bagCount || 0);
            
            await updateDoc(stockGroupDoc.ref, {
              totalQuantity: newTotalQuantity,
              totalBags: newTotalBags
            });
            
            console.log(`Restored stock group ${product.lotId}: quantity ${stockGroupData.totalQuantity} -> ${newTotalQuantity}, bags ${stockGroupData.totalBags} -> ${newTotalBags}`);
          }
        }
      }
      
      // Annuler la livraison
      await updateDoc(doc(db, 'deliveryOrders', delivery.id), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      
      toast.success('Livraison annulée et stocks libérés');
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      toast.error('Erreur lors de l\'annulation de la livraison');
    }
  };

  const handleViewDocument = (delivery: DeliveryOrder, type: 'note' | 'invoice' | 'label' | 'certificate') => {
    setSelectedDelivery(delivery);
    setDocumentType(type);
    setIsDocumentModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'À venir';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-yellow-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">À venir</p>
            <p className="text-2xl font-semibold text-gray-900">
              {deliveries.filter(d => d.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">En cours</p>
            <p className="text-2xl font-semibold text-gray-900">
              {deliveries.filter(d => d.status === 'in-progress').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Terminées</p>
            <p className="text-2xl font-semibold text-gray-900">
              {deliveries.filter(d => d.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Volume total livré</p>
            <p className="text-2xl font-semibold text-gray-900">
              {deliveries
                .filter(d => d.status === 'completed')
                .reduce((sum, d) => sum + d.totalWeight, 0)
                .toFixed(2)} tonnes
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Suivi des livraisons</h2>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes</option>
                  <option value="pending">À venir</option>
                  <option value="in-progress">En cours</option>
                  <option value="completed">Terminées</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par acheteur ou numéro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Livraison
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acheteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Poids (t)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aucune livraison trouvée
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(delivery.deliveryDate, 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {delivery.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {delivery.buyerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {delivery.destination || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {delivery.totalWeight.toFixed(2)}
                      {delivery.partialDelivery && (
                        <span className="ml-1 text-xs text-yellow-600">(partiel)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                        {getStatusText(delivery.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewDocument(delivery, 'note')}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Bon de livraison"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDocument(delivery, 'invoice')}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Facture proforma"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDocument(delivery, 'label')}
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                          title="Étiquette logistique"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDocument(delivery, 'certificate')}
                          className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                          title="Certificat de qualité"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setIsDetailsModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Détails</span>
                        </button>
                        
                        {delivery.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(delivery, 'in-progress')}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Démarrer</span>
                          </button>
                        )}
                        
                        {delivery.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(delivery, 'completed')}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Terminer</span>
                          </button>
                        )}
                        
                        {delivery.status === 'completed' && (
                          <PDFDownloadLink
                            document={<DeliveryReportPDF delivery={delivery} />}
                            fileName={`rapport_livraison_${delivery.orderNumber}.pdf`}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                          >
                            {({ loading }) => (
                              <>
                                <Download className="w-4 h-4" />
                                <span>{loading ? 'Génération...' : 'Rapport'}</span>
                              </>
                            )}
                          </PDFDownloadLink>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pour les détails de livraison */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDelivery(null);
        }}
        size="lg"
      >
        {selectedDelivery && (
          <DeliveryDetails 
            delivery={selectedDelivery} 
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedDelivery(null);
            }}
          />
        )}
      </Modal>

      {/* Modal pour la finalisation de livraison */}
      <Modal 
        isOpen={isCompletionModalOpen} 
        onClose={() => {
          setIsCompletionModalOpen(false);
          setSelectedDelivery(null);
        }}
      >
        {selectedDelivery && (
          <DeliveryCompletionForm
            onClose={() => {
              setIsCompletionModalOpen(false);
              setSelectedDelivery(null);
            }}
            delivery={selectedDelivery}
          />
        )}
      </Modal>

      {/* Modal pour les documents */}
      <Modal 
        isOpen={isDocumentModalOpen} 
        onClose={() => {
          setIsDocumentModalOpen(false);
          setSelectedDelivery(null);
        }}
        size="lg"
      >
        {selectedDelivery && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {documentType === 'note' && 'Bon de livraison'}
                {documentType === 'invoice' && 'Facture proforma'}
                {documentType === 'label' && 'Étiquette logistique'}
                {documentType === 'certificate' && 'Certificat de qualité'}
              </h2>
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {documentType === 'note' && (
                <DeliveryNoteDocument delivery={selectedDelivery} />
              )}
              {documentType === 'invoice' && (
                <ProformaInvoiceDocument delivery={selectedDelivery} />
              )}
              {documentType === 'label' && (
                <LogisticLabelDocument delivery={selectedDelivery} />
              )}
              {documentType === 'certificate' && (
                <QualityCertificateDocument delivery={selectedDelivery} />
              )}
            </div>

            <div className="flex justify-end mt-6">
              <PDFDownloadLink
                document={
                  documentType === 'note' ? 
                    <DeliveryNoteDocument delivery={selectedDelivery} /> :
                  documentType === 'invoice' ? 
                    <ProformaInvoiceDocument delivery={selectedDelivery} /> :
                  documentType === 'label' ? 
                    <LogisticLabelDocument delivery={selectedDelivery} /> :
                    <QualityCertificateDocument delivery={selectedDelivery} />
                }
                fileName={
                  documentType === 'note' ? 
                    `bon_livraison_${selectedDelivery.orderNumber}.pdf` :
                  documentType === 'invoice' ? 
                    `facture_proforma_${selectedDelivery.orderNumber}.pdf` :
                  documentType === 'label' ? 
                    `etiquette_${selectedDelivery.orderNumber}.pdf` :
                    `certificat_qualite_${selectedDelivery.orderNumber}.pdf`
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {({ loading }) => (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{loading ? 'Génération...' : 'Télécharger'}</span>
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}