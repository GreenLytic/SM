import React, { useState, useEffect } from 'react';
import { DeliveryOrder } from '../../types/delivery';
import { StockEntry } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Truck, Calendar, MapPin, Package, User, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DeliveryReportPDF from '../DeliveryReportPDF';
import DeliveryNoteDocument from './documents/DeliveryNoteDocument';
import ProformaInvoiceDocument from './documents/ProformaInvoiceDocument';
import LogisticLabelDocument from './documents/LogisticLabelDocument';
import QualityCertificateDocument from './documents/QualityCertificateDocument';

interface DeliveryDetailsProps {
  delivery: DeliveryOrder;
  onClose: () => void;
}

export default function DeliveryDetails({ delivery, onClose }: DeliveryDetailsProps) {
  const [stocks, setStocks] = useState<Record<string, StockEntry>>({});
  const [warehouses, setWarehouses] = useState<Record<string, Warehouse>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'tracking'>('details');

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        // Récupérer les stocks associés
        const stockPromises = delivery.products.map(async (product) => {
          const stockDoc = await getDoc(doc(db, 'stocks', product.stockId));
          if (stockDoc.exists()) {
            return {
              id: stockDoc.id,
              ...stockDoc.data(),
              date: stockDoc.data().date?.toDate()
            } as StockEntry;
          }
          return null;
        });
        
        const stockResults = await Promise.all(stockPromises);
        const stocksMap: Record<string, StockEntry> = {};
        stockResults.filter(Boolean).forEach(stock => {
          if (stock) stocksMap[stock.id!] = stock;
        });
        setStocks(stocksMap);

        // Récupérer les magasins associés
        const warehousePromises = delivery.warehouseIds.map(async (warehouseId) => {
          const warehouseDoc = await getDoc(doc(db, 'warehouses', warehouseId));
          if (warehouseDoc.exists()) {
            return {
              id: warehouseDoc.id,
              ...warehouseDoc.data()
            } as Warehouse;
          }
          return null;
        });
        
        const warehouseResults = await Promise.all(warehousePromises);
        const warehousesMap: Record<string, Warehouse> = {};
        warehouseResults.filter(Boolean).forEach(warehouse => {
          if (warehouse) warehousesMap[warehouse.id!] = warehouse;
        });
        setWarehouses(warehousesMap);
      } catch (error) {
        console.error('Error fetching related data:', error);
      }
    };

    fetchRelatedData();
  }, [delivery]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Livraison #{delivery.orderNumber}
          </h2>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
          {getStatusText(delivery.status)}
        </span>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'details' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          DÉTAILS
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'documents' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          DOCUMENTS
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'tracking' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          SUIVI
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informations générales</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date de livraison</p>
                    <p className="text-sm text-gray-500">
                      {format(delivery.deliveryDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Acheteur</p>
                    <p className="text-sm text-gray-500">{delivery.buyerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Destination</p>
                    <p className="text-sm text-gray-500">{delivery.destination || 'Non spécifié'}</p>
                    <p className="text-sm text-gray-500">{delivery.deliveryAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Transport</p>
                    <p className="text-sm text-gray-500">Véhicule: {delivery.vehicleInfo}</p>
                    <p className="text-sm text-gray-500">Chauffeur: {delivery.driverInfo}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Détails de la cargaison</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Poids total</p>
                    <p className="text-sm text-gray-500">{delivery.totalWeight.toFixed(2)} tonnes</p>
                    {delivery.buyerWeight && (
                      <p className="text-sm text-gray-500">
                        Poids acheteur: {delivery.buyerWeight.toFixed(2)} tonnes
                        {delivery.weightLoss && delivery.weightLoss > 0 && (
                          <span className="text-red-500 ml-2">
                            (Perte: {delivery.weightLoss.toFixed(2)} tonnes)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Magasins source</p>
                    <div className="space-y-1 mt-1">
                      {delivery.warehouseIds.map((warehouseId) => (
                        <p key={warehouseId} className="text-sm text-gray-500">
                          {warehouses[warehouseId]?.name || 'Magasin inconnu'}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {delivery.partialDelivery && (
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Livraison partielle</p>
                      <p className="text-sm text-yellow-600">
                        Cette livraison contient des stocks partiellement livrés
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Produits livrés</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock/Lot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qualité</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {delivery.products.map((product, index) => {
                    const stock = stocks[product.stockId];
                    const warehouse = warehouses[product.warehouseId];
                    
                    return (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {stock?.stockNumber || product.stockId.substring(0, 8)}
                          {product.lotId && (
                            <span className="ml-2 text-xs text-blue-600">
                              (Lot)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {warehouse?.name || 'Inconnu'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.quality === 'A' ? 'bg-green-100 text-green-800' :
                            product.quality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Qualité {product.quality}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product.quantity.toFixed(2)} tonnes
                          {product.isPartial && product.originalQuantity && (
                            <span className="text-xs text-gray-500 ml-1">
                              / {product.originalQuantity.toFixed(2)} tonnes
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {product.isPartial ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Partiel
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Complet
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {delivery.costs && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Aspects financiers</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Revenus</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Prix de vente:</span>
                        <span className="text-sm font-medium">{delivery.costs.sellingPrice.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remboursement client:</span>
                        <span className="text-sm font-medium">{delivery.costs.buyerReimbursement.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dépenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Frais de route:</span>
                        <span className="text-sm">{delivery.costs.roadFees.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Carburant:</span>
                        <span className="text-sm">{delivery.costs.fuelCost.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Location véhicule:</span>
                        <span className="text-sm">{delivery.costs.vehicleRental.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Autres frais:</span>
                        <span className="text-sm">
                          {(delivery.costs.loadingCost + delivery.costs.unloadingCost + delivery.costs.otherCosts).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Bénéfice total:</span>
                    <span className={`text-sm font-medium ${delivery.costs.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {delivery.costs.profit.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {delivery.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{delivery.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Documents disponibles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Bon de livraison</h4>
                </div>
                <PDFDownloadLink
                  document={<DeliveryNoteDocument delivery={delivery} />}
                  fileName={`bon_livraison_${delivery.orderNumber}.pdf`}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{loading ? '...' : 'PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <p className="text-sm text-gray-500">
                Résumé officiel avec liste des lots/stocks, quantités, destination, date, signature
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Facture proforma</h4>
                </div>
                <PDFDownloadLink
                  document={<ProformaInvoiceDocument delivery={delivery} />}
                  fileName={`facture_proforma_${delivery.orderNumber}.pdf`}
                  className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{loading ? '...' : 'PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <p className="text-sm text-gray-500">
                Facture générée à partir des prix de vente actifs
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Étiquette logistique</h4>
                </div>
                <PDFDownloadLink
                  document={<LogisticLabelDocument delivery={delivery} />}
                  fileName={`etiquette_${delivery.orderNumber}.pdf`}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-800 px-2 py-1 border border-purple-200 rounded-md hover:bg-purple-50"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{loading ? '...' : 'PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <p className="text-sm text-gray-500">
                Étiquette avec code QR, nom de la coopérative, poids, date
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h4 className="font-medium text-gray-900">Certificat de qualité</h4>
                </div>
                <PDFDownloadLink
                  document={<QualityCertificateDocument delivery={delivery} />}
                  fileName={`certificat_qualite_${delivery.orderNumber}.pdf`}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-800 px-2 py-1 border border-amber-200 rounded-md hover:bg-amber-50"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{loading ? '...' : 'PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <p className="text-sm text-gray-500">
                Certificat détaillant la qualité des lots livrés
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow md:col-span-2">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Rapport complet de livraison</h4>
                </div>
                <PDFDownloadLink
                  document={<DeliveryReportPDF delivery={delivery} />}
                  fileName={`rapport_livraison_${delivery.orderNumber}.pdf`}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{loading ? '...' : 'PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <p className="text-sm text-gray-500">
                Rapport complet incluant tous les détails de la livraison, les aspects financiers et les signatures
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Historique de suivi</h3>
          
          <div className="relative">
            {/* Ligne verticale de progression */}
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6 relative">
              {/* Étape initiale */}
              <div className="flex gap-4">
                <div className="relative z-10">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">Livraison planifiée</h4>
                      <p className="text-sm text-gray-500">
                        {format(delivery.deliveryDate, 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mises à jour de suivi */}
              {delivery.trackingUpdates.map((update, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative z-10">
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{update.status}</h4>
                        <p className="text-sm text-gray-500">
                          {format(update.timestamp, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                        {update.location && (
                          <p className="text-sm text-gray-500 mt-1">
                            Localisation: {update.location}
                          </p>
                        )}
                        {update.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {update.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Étape finale pour les livraisons terminées */}
              {delivery.status === 'completed' && delivery.completedAt && (
                <div className="flex gap-4">
                  <div className="relative z-10">
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">Livraison terminée</h4>
                        <p className="text-sm text-gray-500">
                          {format(delivery.completedAt, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                        {delivery.buyerWeight && (
                          <p className="text-sm text-gray-500 mt-1">
                            Poids acheteur: {delivery.buyerWeight.toFixed(2)} tonnes
                            {delivery.weightLoss && delivery.weightLoss > 0 && (
                              <span className="text-red-500 ml-2">
                                (Perte: {delivery.weightLoss.toFixed(2)} tonnes)
                              </span>
                            )}
                          </p>
                        )}
                        {delivery.costs && (
                          <p className={`text-sm font-medium mt-1 ${delivery.costs.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Bénéfice: {delivery.costs.profit.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}