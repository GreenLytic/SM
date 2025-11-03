import React, { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DeliveryOrder, DeliveryProduct } from '../../types/delivery';
import { StockEntry, StockGroup } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { toast } from 'react-hot-toast';
import { Truck, Plus, Calendar, User, MapPin, Package, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import StockSelectionPanel from './StockSelectionPanel';
import { StockReservationService } from '../../services/delivery/stockReservationService';
import { stockChannelService } from '../../services/websocket/stockChannel';

export default function DeliveryPlanner() {
  const [formData, setFormData] = useState<Omit<DeliveryOrder, 'id'>>({
    orderNumber: `LIV-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    buyerName: '',
    deliveryDate: new Date(),
    status: 'pending',
    products: [],
    totalWeight: 0,
    deliveryAddress: '',
    vehicleInfo: '',
    driverInfo: '',
    notes: '',
    trackingUpdates: [],
    warehouseIds: [],
    destination: 'Abidjan',
    partialDelivery: false,
    createdAt: new Date(),
    buyerWeight: null,
    weightLoss: null,
    costs: null,
    completedAt: null,
    updatedAt: null,
    qualityCertificateGenerated: false,
    deliveryNoteGenerated: false,
    proformaInvoiceGenerated: false,
    logisticLabelGenerated: false
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{
    stockId: string;
    warehouseId: string;
    quantity: number;
    maxQuantity: number;
    lotId?: string;
    isPartial?: boolean;
    bagCount?: number;
    stockNumber?: string;
    quality: 'A' | 'B' | 'C';
  }[]>([]);
  const [reservationIds, setReservationIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Nettoyer les réservations expirées au chargement
        await StockReservationService.cleanupExpiredReservations();
        
        // Fetch warehouses
        const warehousesQuery = query(collection(db, 'warehouses'), where('status', '==', 'active'));
        const warehousesSnapshot = await getDocs(warehousesQuery);
        const warehouseData = warehousesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Warehouse[];
        setWarehouses(warehouseData);

        // Fetch stocks
        const stocksQuery = query(collection(db, 'stocks'));
        const stocksSnapshot = await getDocs(stocksQuery);
        const stockData = stocksSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate()
          }))
          .filter(stock => {
            console.log('Loading stock:', {
              id: stock.id,
              stockNumber: stock.stockNumber,
              quantity: stock.quantity,
              warehouseId: stock.warehouseId,
              combinedIntoStock: stock.combinedIntoStock
            });
            return true; // Load all stocks for debugging
          }) as StockEntry[];
        
        console.log('Total stocks loaded:', stockData.length);
        setStocks(stockData);

        // Fetch stock groups
        const stockGroupsQuery = query(collection(db, 'stockGroups'), where('archived', '==', false));
        const stockGroupsSnapshot = await getDocs(stockGroupsQuery);
        const stockGroupData = stockGroupsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
          .filter(group => group.totalQuantity > 0.001) as StockGroup[];
        setStockGroups(stockGroupData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    fetchData();

    // Listen to stock updates via WebSocket
    const unsubscribe = stockChannelService.subscribe((event) => {
      if (event.type === 'stockUpdate' || event.type === 'reservationUpdate') {
        // Refresh data when stocks are updated
        fetchData();
      }
    });

    // Cleanup expired reservations on mount
    const cleanupInterval = setInterval(() => {
      StockReservationService.cleanupExpiredReservations();
    }, 60000); // Nettoyer toutes les minutes

    return () => {
      unsubscribe();
      // Release all reservations on unmount
      releaseAllReservations();
      clearInterval(cleanupInterval);
    };
  }, []);

  const releaseAllReservations = async () => {
    for (const product of selectedProducts) {
      if (product.lotId) {
        await StockReservationService.release(product.lotId, 'lot');
      } else {
        await StockReservationService.release(product.stockId, 'stock');
      }
    }
  };

  const handleProductSelection = async (
    stockId: string,
    warehouseId: string,
    quantity: number,
    maxQuantity: number,
    lotId?: string,
    bagCount?: number,
    stockNumber?: string,
    quality: 'A' | 'B' | 'C' = 'A'
  ) => {
    try {
      // Reserve the stock/lot
      const reservationId = await StockReservationService.reserve(
        lotId || stockId,
        lotId ? 'lot' : 'stock',
        quantity
      );

      if (!reservationId) {
        toast.error('Impossible de réserver ce stock');
        return;
      }

      const isPartial = quantity < maxQuantity;

      setSelectedProducts(prev => {
        const existingIndex = prev.findIndex(p => p.stockId === stockId);
        
        if (existingIndex >= 0) {
          // Update existing product
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity,
            isPartial,
            bagCount: bagCount || updated[existingIndex].bagCount
          };
          return updated;
        } else {
          // Add new product
          return [...prev, {
            stockId,
            warehouseId,
            quantity,
            maxQuantity,
            lotId,
            isPartial,
            bagCount: bagCount || 0,
            stockNumber: stockNumber || stockId,
            quality
          }];
        }
      });

      setReservationIds(prev => [...prev, reservationId]);

      // Update warehouse IDs
      if (!formData.warehouseIds.includes(warehouseId)) {
        setFormData(prev => ({
          ...prev,
          warehouseIds: [...prev.warehouseIds, warehouseId]
        }));
      }
    } catch (error) {
      console.error('Error selecting product:', error);
      toast.error('Erreur lors de la sélection du produit');
    }
  };

  const handleRemoveProduct = async (stockId: string) => {
    const product = selectedProducts.find(p => p.stockId === stockId);
    if (product) {
      // Release reservation
      if (product.lotId) {
        await StockReservationService.release(product.lotId, 'lot');
      } else {
        await StockReservationService.release(stockId, 'stock');
      }
    }

    setSelectedProducts(prev => prev.filter(p => p.stockId !== stockId));

    // Update warehouse IDs if necessary
    const productWarehouseId = selectedProducts.find(p => p.stockId === stockId)?.warehouseId;
    if (productWarehouseId) {
      const remainingProductsFromWarehouse = selectedProducts.filter(
        p => p.warehouseId === productWarehouseId && p.stockId !== stockId
      );

      if (remainingProductsFromWarehouse.length === 0) {
        setFormData(prev => ({
          ...prev,
          warehouseIds: prev.warehouseIds.filter(id => id !== productWarehouseId)
        }));
      }
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const errors: string[] = [];

    switch (stepNumber) {
      case 1:
        if (selectedProducts.length === 0) {
          errors.push('Veuillez sélectionner au moins un stock ou lot');
        }
        break;
      case 2:
        if (!formData.buyerName.trim()) {
          errors.push('Le nom de l\'acheteur est requis');
        }
        if (!formData.deliveryAddress.trim()) {
          errors.push('L\'adresse de livraison est requise');
        }
        if (!formData.vehicleInfo.trim()) {
          errors.push('Les informations du véhicule sont requises');
        }
        if (!formData.driverInfo.trim()) {
          errors.push('Les informations du chauffeur sont requises');
        }
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const calculateTotalWeight = () => {
    return selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
  };

  const calculateTotalBags = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.bagCount || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateStep(step)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Create delivery products
      const products: DeliveryProduct[] = selectedProducts.map(product => ({
        stockId: product.stockId,
        warehouseId: product.warehouseId,
        quantity: product.quantity,
        originalQuantity: product.maxQuantity,
        quality: product.quality,
        lotId: product.lotId || null,
        isPartial: product.isPartial || false,
        bagCount: product.bagCount || 0,
        stockNumber: product.stockNumber || product.stockId
      }));

      // Calculate total weight
      const totalWeight = calculateTotalWeight();

      // Create delivery order
      const deliveryData: Omit<DeliveryOrder, 'id'> = {
        ...formData,
        products,
        totalWeight,
        status: 'pending',
        trackingUpdates: [{
          timestamp: new Date(),
          location: 'Coopérative',
          status: 'Livraison planifiée',
          notes: 'Livraison créée et en attente de démarrage'
        }],
        partialDelivery: selectedProducts.some(p => p.isPartial),
        createdAt: new Date()
      };

      // Save to database
      const deliveryRef = await addDoc(collection(db, 'deliveryOrders'), deliveryData);

      // Confirm all reservations
      for (const reservationId of reservationIds) {
        await StockReservationService.confirm(reservationId, deliveryRef.id);
      }

      // Update stock quantities and statuses
      for (const product of selectedProducts) {
        const stockRef = doc(db, 'stocks', product.stockId);
        const stockDoc = await getDoc(stockRef);

        if (stockDoc.exists()) {
          const stockData = stockDoc.data();
          const newQuantity = stockData.quantity - product.quantity;
          const newBagCount = Math.max(0, (stockData.bagCount || 0) - (product.bagCount || 0));

          let newStatus: string;
          if (newQuantity <= 0.001) {
            newStatus = 'delivered';
          } else {
            newStatus = 'partially_delivered';
          }

          await updateDoc(stockRef, {
            quantity: Math.max(0, newQuantity),
            bagCount: newBagCount,
            status: newStatus,
            updatedAt: new Date()
          });

          // Emit WebSocket event
          stockChannelService.emitQuantityUpdate(
            product.stockId,
            'stock',
            Math.max(0, newQuantity),
            newStatus
          );

          // Update lot quantities if applicable
          if (product.lotId) {
            const lotQuery = query(
              collection(db, 'stockGroups'),
              where('name', '==', product.lotId),
              where('archived', '==', false)
            );
            const lotSnapshot = await getDocs(lotQuery);

            if (!lotSnapshot.empty) {
              const lotDoc = lotSnapshot.docs[0];
              const lotData = lotDoc.data();

              const newLotQuantity = Math.max(0, lotData.totalQuantity - product.quantity);
              const newLotBags = Math.max(0, lotData.totalBags - (product.bagCount || 0));

              await updateDoc(lotDoc.ref, {
                totalQuantity: newLotQuantity,
                totalBags: newLotBags,
                updatedAt: new Date()
              });

              // Emit WebSocket event for lot
              stockChannelService.emitQuantityUpdate(
                product.lotId,
                'lot',
                newLotQuantity,
                newLotQuantity <= 0.001 ? 'delivered' : 'partially_delivered'
              );
            }
          }
        }
      }

      // Update warehouse stock levels
      const warehouseUpdates = new Map<string, number>();
      for (const product of selectedProducts) {
        const currentReduction = warehouseUpdates.get(product.warehouseId) || 0;
        warehouseUpdates.set(product.warehouseId, currentReduction + product.quantity);
      }

      for (const [warehouseId, quantityReduced] of warehouseUpdates) {
        const warehouseRef = doc(db, 'warehouses', warehouseId);
        const warehouseDoc = await getDoc(warehouseRef);

        if (warehouseDoc.exists()) {
          const warehouseData = warehouseDoc.data();
          const newCurrentStock = Math.max(0, warehouseData.currentStock - quantityReduced);

          await updateDoc(warehouseRef, {
            currentStock: newCurrentStock,
            updatedAt: new Date()
          });
        }
      }

      toast.success('Livraison planifiée avec succès');

      // Reset form
      setFormData({
        orderNumber: `LIV-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        buyerName: '',
        deliveryDate: new Date(),
        status: 'pending',
        products: [],
        totalWeight: 0,
        deliveryAddress: '',
        vehicleInfo: '',
        driverInfo: '',
        notes: '',
        trackingUpdates: [],
        warehouseIds: [],
        destination: 'Abidjan',
        partialDelivery: false,
        createdAt: new Date()
      });
      setSelectedProducts([]);
      setReservationIds([]);
      setStep(1);
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Erreur lors de la création de la livraison');

      // Release all reservations on error
      await releaseAllReservations();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Planifier une nouvelle livraison
          </h2>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await StockReservationService.forceCleanupAllReservations();
                  toast.success('Toutes les réservations ont été supprimées');
                  // Recharger les données
                  window.location.reload();
                } catch (error) {
                  console.error('Error:', error);
                  toast.error('Erreur lors du nettoyage');
                }
              }}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
            >
              🗑️ Supprimer toutes réservations
            </button>
            <button
              type="button"
              onClick={async () => {
                await StockReservationService.cleanupExpiredReservations();
                toast.success('Réservations expirées nettoyées');
                // Recharger les données
                window.location.reload();
              }}
              className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
            >
              🔄 Nettoyer expirées
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } mr-2`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } mx-2`}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } ml-2`}>
              {step > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Sélection des stocks</span>
            <span>Informations de livraison</span>
            <span>Validation</span>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-medium text-red-800">Erreurs de validation</h3>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Stock Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Sélection des stocks à livrer</h3>
              
              <StockSelectionPanel
                stocks={stocks}
                stockGroups={stockGroups}
                warehouses={warehouses}
                selectedProducts={selectedProducts}
                onSelectProduct={handleProductSelection}
                onRemoveProduct={handleRemoveProduct}
              />

              {selectedProducts.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé de la sélection</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-blue-700">Produits sélectionnés</p>
                      <p className="text-lg font-semibold text-blue-900">{selectedProducts.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Poids total</p>
                      <p className="text-lg font-semibold text-blue-900">{calculateTotalWeight().toFixed(2)} tonnes</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Nombre de sacs</p>
                      <p className="text-lg font-semibold text-blue-900">{calculateTotalBags()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Livraison partielle</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {selectedProducts.some(p => p.isPartial) ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Informations de livraison</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      N° de livraison
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    readOnly
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date de livraison
                    </div>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, deliveryDate: new Date(e.target.value)})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Acheteur *
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buyerName}
                    onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Nom de l'acheteur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </div>
                  </label>
                  <select
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value as any})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="San Pedro">Port de San Pedro</option>
                    <option value="Abidjan">Port d'Abidjan</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Adresse de livraison *
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Adresse complète de livraison"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Véhicule *
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo}
                    onChange={(e) => setFormData({...formData, vehicleInfo: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Type et immatriculation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Chauffeur *
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.driverInfo}
                    onChange={(e) => setFormData({...formData, driverInfo: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Nom du chauffeur"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes ou instructions spéciales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Instructions spéciales, remarques..."
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Validation */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Validation de la livraison</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Informations générales</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">N° de livraison:</span>
                        <span className="text-sm font-medium">{formData.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date de livraison:</span>
                        <span className="text-sm font-medium">{formData.deliveryDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Acheteur:</span>
                        <span className="text-sm font-medium">{formData.buyerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Destination:</span>
                        <span className="text-sm font-medium">{formData.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Transport</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Véhicule:</span>
                        <span className="text-sm font-medium">{formData.vehicleInfo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Chauffeur:</span>
                        <span className="text-sm font-medium">{formData.driverInfo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Poids total:</span>
                        <span className="text-sm font-medium">{calculateTotalWeight().toFixed(2)} tonnes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nombre de sacs:</span>
                        <span className="text-sm font-medium">{calculateTotalBags()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Produits sélectionnés</h4>
                  <div className="max-h-60 overflow-y-auto pr-2">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock/Lot</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedProducts.map((product) => {
                          const warehouse = warehouses.find(w => w.id === product.warehouseId);
                          
                          return (
                            <tr key={product.stockId} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {product.lotId ? `Lot #${product.lotId}` : `Stock #${product.stockNumber}`}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {warehouse?.name || 'Inconnu'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {product.quantity.toFixed(2)} tonnes • {product.bagCount || 0} sacs
                              </td>
                              <td className="px-4 py-2 text-sm">
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

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Documents générés automatiquement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Bon de livraison</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">Facture proforma</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-700">Étiquette logistique</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-gray-700">Certificat de qualité</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Planification...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Planifier la livraison</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}