import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeliveryOrder, DeliveryCosts } from '../types/delivery';
import { StockEntry } from '../types/stock';
import { toast } from 'react-hot-toast'; 
import { Truck, DollarSign } from 'lucide-react';
import { updateStockValue } from '../services/financeService';

interface DeliveryCompletionFormProps {
  onClose: () => void;
  delivery: DeliveryOrder;
}

export default function DeliveryCompletionForm({ onClose, delivery }: DeliveryCompletionFormProps) {
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [buyerWeight, setBuyerWeight] = useState<number>(delivery.totalWeight);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'tonnes'>('kg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costs, setCosts] = useState<DeliveryCosts>({
    roadFees: 0,
    fuelCost: 0,
    vehicleRental: 0,
    loadingCost: 0,
    unloadingCost: 0,
    otherCosts: 0,
    totalCost: 0,
    sellingPrice: 0,
    profit: 0,
    buyerReimbursement: 0,
    notes: ''
  });
  const [purchaseCost, setPurchaseCost] = useState(0);

  useEffect(() => {
    const fetchPurchasePrice = async () => {
      try {
        // Fetch active price settings
        const priceQuery = query(
          collection(db, 'priceSettings'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(priceQuery);
        if (!snapshot.empty) {
          const settings = snapshot.docs[0].data();
          const basePrice = settings.basePrice || 0;
          const qualityPremium = settings.qualityPremiums?.[delivery.quality] || 0;
          const certificationPremiums = settings.certifications?.reduce(
            (sum: number, cert: { premium: number }) => sum + (cert.premium || 0),
            0
          ) || 0;

          const totalPricePerKg = basePrice + qualityPremium + certificationPremiums;
          setPurchaseCost(delivery.totalWeight * totalPricePerKg * 1000); // Convert to total cost
        }
      } catch (error) {
        console.error('Error fetching purchase price:', error);
      }
    };

    fetchPurchasePrice();
  }, [delivery.totalWeight, delivery.quality]);

  useEffect(() => {
    // Calculate selling price whenever price per kg or buyer weight changes
    const sellingPrice = pricePerKg * (buyerWeight * 1000); // Convert tonnes to kg
    
    // Calculate total delivery costs
    const totalDeliveryCosts = 
      costs.roadFees +
      costs.fuelCost +
      costs.vehicleRental +
      costs.loadingCost +
      costs.unloadingCost +
      costs.otherCosts;

    // Calculate profit
    const profit = sellingPrice - purchaseCost + costs.buyerReimbursement - totalDeliveryCosts;

    setCosts(prev => ({
      ...prev,
      sellingPrice,
      totalCost: totalDeliveryCosts,
      profit
    }));
  }, [pricePerKg, buyerWeight, costs.roadFees, costs.fuelCost, costs.vehicleRental, 
      costs.loadingCost, costs.unloadingCost, costs.otherCosts, costs.buyerReimbursement, purchaseCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!delivery.id) {
        throw new Error('ID de livraison manquant');
      }

      const weightLoss = delivery.totalWeight - buyerWeight;

      await updateDoc(doc(db, 'deliveryOrders', delivery.id), {
        status: 'completed',
        completedAt: new Date(),
        buyerWeight,
        weightLoss,
        costs
      });

      // Process each product in the delivery
      for (const product of delivery.products) {
        // Get the current stock data
        const stockRef = doc(db, 'stocks', product.stockId);
        const stockDoc = await getDoc(stockRef);
        
        if (stockDoc.exists()) {
          const stockData = stockDoc.data() as StockEntry;
          // Pour la finalisation, on ne change que le statut et les dates
          // La quantité a déjà été mise à jour lors de la planification
          
          let newStatus: 'delivered' | 'available' = 'delivered';
          
          // Si le stock a encore de la quantité, il reste disponible
          if (stockData.quantity > 0.001) {
            newStatus = 'available';
          }
          
          // Mettre à jour seulement le statut et les dates de livraison
          await updateDoc(stockRef, {
            status: newStatus,
            deliveredAt: new Date(),
            deliveredQuantity: (stockData.deliveredQuantity || 0) + product.quantity
          });
          
          // If this stock is part of a group (lot), update the group's total quantities
          if (stockData.isGrouped && stockData.groupId) {
            try {
              // Find the stock group by name (groupId contains the lot name)
              const stockGroupsQuery = query(
                collection(db, 'stockGroups'),
                where('name', '==', stockData.groupId),
                where('archived', '==', false)
              );
              const stockGroupsSnapshot = await getDocs(stockGroupsQuery);
              
              if (!stockGroupsSnapshot.empty) {
                const stockGroupDoc = stockGroupsSnapshot.docs[0];
                const stockGroupData = stockGroupDoc.data();
                
                // Calculate the proportion of this stock in the total group
                const stockProportion = product.quantity / stockData.quantity;
                
                // Update group quantities proportionally
                const newTotalQuantity = Math.max(0, stockGroupData.totalQuantity - product.quantity);
                const newTotalBags = Math.max(0, stockGroupData.totalBags - Math.round((product.bagCount || 0)));
                
                await updateDoc(stockGroupDoc.ref, {
                  totalQuantity: newTotalQuantity,
                  totalBags: newTotalBags
                });
                
                console.log(`Updated stock group ${stockData.groupId}: quantity ${stockGroupData.totalQuantity} -> ${newTotalQuantity}, bags ${stockGroupData.totalBags} -> ${newTotalBags}`);
              }
            } catch (error) {
              console.error(`Error updating stock group for stock ${product.stockId}:`, error);
            }
          }
          
          // Libérer la réservation du stock
          const reservationsQuery = query(
            collection(db, 'stockReservations'),
            where('deliveryOrderId', '==', delivery.id),
            where('itemId', '==', product.stockId)
          );
          
          const reservationSnapshot = await getDocs(reservationsQuery);
          const deletePromises = reservationSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }
      }

      // Update warehouse stock if needed
      // Update warehouse capacities by reducing current stock
      const warehouseUpdates = new Map<string, number>();
      
      // Calculate total quantity delivered per warehouse
      for (const product of delivery.products) {
        const warehouseId = product.warehouseId;
        if (warehouseId) {
          const currentReduction = warehouseUpdates.get(warehouseId) || 0;
          warehouseUpdates.set(warehouseId, currentReduction + product.quantity);
        }
      }
      
      // Update each warehouse's current stock
      for (const [warehouseId, quantityDelivered] of warehouseUpdates) {
        try {
          const warehouseRef = doc(db, 'warehouses', warehouseId);
          const warehouseDoc = await getDoc(warehouseRef);
          
          if (warehouseDoc.exists()) {
            const warehouseData = warehouseDoc.data();
            const currentStock = warehouseData.currentStock || 0;
            const newCurrentStock = Math.max(0, currentStock - quantityDelivered);
            
            await updateDoc(warehouseRef, {
              currentStock: newCurrentStock
            });
            
            console.log(`Updated warehouse ${warehouseId}: ${currentStock} -> ${newCurrentStock} tonnes`);
          }
        } catch (error) {
          console.error(`Error updating warehouse ${warehouseId}:`, error);
        }
      }

      toast.success('Livraison terminée avec succès');
      
      // Update financial data after delivery completion
      await updateStockValue();

      // Dispatch a custom event to notify stock components to refresh
      const stockUpdateEvent = new CustomEvent('stockUpdate', {
        detail: { deliveryId: delivery.id }
      });
      window.dispatchEvent(stockUpdateEvent);
      
      onClose();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Erreur lors de la finalisation de la livraison');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCostChange = (field: keyof DeliveryCosts, value: number) => {
    setCosts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatWeight = (weight: number) => {
    if (weightUnit === 'kg') {
      return `${(weight * 1000).toLocaleString('fr-FR')} kg`;
    }
    return `${weight.toLocaleString('fr-FR')} tonnes`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Truck className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Finalisation de la livraison
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix de vente (FCFA/kg)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Poids acheteur</label>
          <div className="mt-1 flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                required
                min="0"
                step="0.001"
                value={weightUnit === 'kg' ? buyerWeight * 1000 : buyerWeight}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBuyerWeight(weightUnit === 'kg' ? value / 1000 : value);
                }}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'tonnes')}
              className="rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="kg">kg</option>
              <option value="tonnes">tonnes</option>
            </select>
          </div>
          {delivery.totalWeight !== buyerWeight && (
            <p className="mt-1 text-sm text-red-600">
              Perte de poids: {formatWeight(delivery.totalWeight - buyerWeight)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remboursement client (FCFA)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.buyerReimbursement}
              onChange={(e) => handleCostChange('buyerReimbursement', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Frais de route</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.roadFees}
              onChange={(e) => handleCostChange('roadFees', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Carburant</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.fuelCost}
              onChange={(e) => handleCostChange('fuelCost', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location véhicule</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.vehicleRental}
              onChange={(e) => handleCostChange('vehicleRental', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Frais de chargement</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.loadingCost}
              onChange={(e) => handleCostChange('loadingCost', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Frais de déchargement</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.unloadingCost}
              onChange={(e) => handleCostChange('unloadingCost', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Autres frais</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              value={costs.otherCosts}
              onChange={(e) => handleCostChange('otherCosts', Number(e.target.value))}
              className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={costs.notes}
            onChange={(e) => setCosts({ ...costs, notes: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Coût d'achat</p>
              <p className="text-lg font-semibold text-gray-900">
                {purchaseCost.toLocaleString()} FCFA
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Prix de vente total</p>
              <p className="text-lg font-semibold text-gray-900">
                {costs.sellingPrice.toLocaleString()} FCFA
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Remboursement</p>
              <p className="text-lg font-semibold text-blue-600">
                {costs.buyerReimbursement.toLocaleString()} FCFA
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bénéfice estimé</p>
              <p className={`text-lg font-semibold ${costs.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {costs.profit.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Finalisation...</span>
            </>
          ) : (
            <span>Terminer la livraison</span>
          )}
        </button>
      </div>
    </form>
  );
}