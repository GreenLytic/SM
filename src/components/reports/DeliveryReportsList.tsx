import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DeliveryOrder } from '../../types/delivery';
import { FileText, TrendingUp, DollarSign, Download, Eye, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { pdf } from '@react-pdf/renderer';
import DeliveryReportPDF from '../DeliveryReportPDF';
import Modal from '../Modal';

interface DeliveryStats {
  totalDeliveries: number;
  totalRevenue: number;
  totalProfit: number;
}

export default function DeliveryReportsList() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date();
        
        if (selectedPeriod === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (selectedPeriod === 'quarter') {
          startDate.setMonth(startDate.getMonth() - 3);
        } else {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Use a simple query first to avoid composite index requirements
        const q = query(
          collection(db, 'deliveryOrders'),
          where('status', '==', 'completed')
        );

        const snapshot = await getDocs(q);
        const deliveryData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            deliveryDate: doc.data().deliveryDate?.toDate(),
            completedAt: doc.data().completedAt?.toDate()
          })) as DeliveryOrder[];

        // Filter by date in memory
        const filteredDeliveries = deliveryData
          .filter(delivery => delivery.completedAt && delivery.completedAt >= startDate)
          .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

        setDeliveries(filteredDeliveries);

        // Calculate stats
        const calculatedStats = filteredDeliveries.reduce((acc, delivery) => {
          const costs = delivery.costs || { sellingPrice: 0, profit: 0 };
          return {
            totalDeliveries: acc.totalDeliveries + 1,
            totalRevenue: acc.totalRevenue + (costs.sellingPrice || 0),
            totalProfit: acc.totalProfit + (costs.profit || 0)
          };
        }, {
          totalDeliveries: 0,
          totalRevenue: 0,
          totalProfit: 0
        });

        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
        toast.error('Erreur lors du chargement des rapports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [selectedPeriod]);

  const handlePreviewReport = (delivery: DeliveryOrder) => {
    setSelectedDelivery(delivery);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total livraisons</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalDeliveries}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalRevenue.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Bénéfice total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalProfit.toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Rapports de livraison</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Dernier mois</option>
              <option value="quarter">Dernier trimestre</option>
              <option value="year">Dernière année</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-500">Chargement des données...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune livraison pour la période sélectionnée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéfice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(delivery.completedAt!, 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {delivery.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {delivery.buyerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(delivery.costs?.sellingPrice || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={(delivery.costs?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {(delivery.costs?.profit || 0).toLocaleString()} FCFA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handlePreviewReport(delivery)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Aperçu</span>
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              pdf(<DeliveryReportPDF delivery={delivery} />)
                                .toBlob()
                                .then(blob => {
                                  const url = URL.createObjectURL(blob);
                                  link.href = url;
                                  link.download = `rapport_livraison_${delivery.orderNumber}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                });
                            }}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                          >
                            <FileDown className="w-4 h-4" />
                            <span>PDF</span>
                          </button>
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

      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)}
        size="lg"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Aperçu du rapport de livraison
            </h2>
            <div className="flex gap-3">
              {selectedDelivery && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    pdf(<DeliveryReportPDF delivery={selectedDelivery} />)
                      .toBlob()
                      .then(blob => {
                        const url = URL.createObjectURL(blob);
                        link.href = url;
                        link.download = `rapport_livraison_${selectedDelivery.orderNumber}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Télécharger PDF</span>
                </button>
              )}
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>

          {selectedDelivery && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Commande N° {selectedDelivery.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Livré le {format(selectedDelivery.completedAt!, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Terminée
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Informations client</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Client:</span> {selectedDelivery.buyerName}</p>
                    <p className="text-sm"><span className="font-medium">Adresse:</span> {selectedDelivery.deliveryAddress}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Informations livraison</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Véhicule:</span> {selectedDelivery.vehicleInfo}</p>
                    <p className="text-sm"><span className="font-medium">Chauffeur:</span> {selectedDelivery.driverInfo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Produits livrés</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qualité</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDelivery.products && selectedDelivery.products.map((product, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">Stock #{product.stockId.substring(0, 8)}</td>
                            <td className="px-4 py-2 text-sm">Qualité {product.quality}</td>
                            <td className="px-4 py-2 text-sm">{(product.quantity * 1000).toLocaleString()} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedDelivery.costs && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Aspects financiers</h4>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Revenus</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Prix de vente:</span>
                          <span className="text-sm font-medium">{selectedDelivery.costs.sellingPrice.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Remboursement client:</span>
                          <span className="text-sm font-medium">{selectedDelivery.costs.buyerReimbursement.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dépenses</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Frais de route:</span>
                          <span className="text-sm">{selectedDelivery.costs.roadFees.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Carburant:</span>
                          <span className="text-sm">{selectedDelivery.costs.fuelCost.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Location véhicule:</span>
                          <span className="text-sm">{selectedDelivery.costs.vehicleRental.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Autres frais:</span>
                          <span className="text-sm">{(selectedDelivery.costs.loadingCost + selectedDelivery.costs.unloadingCost + selectedDelivery.costs.otherCosts).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-3 border-t border-gray-200 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Bénéfice total:</span>
                        <span className={`text-sm font-medium ${selectedDelivery.costs.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedDelivery.costs.profit.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}