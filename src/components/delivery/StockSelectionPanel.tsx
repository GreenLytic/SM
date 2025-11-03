import React, { useState, useEffect } from 'react';
import { StockEntry, StockGroup } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import { StockReservation } from '../../types/delivery';
import { Package, Layers, Search, Plus, Minus, AlertCircle, Archive, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { StockReservationService } from '../../services/delivery/stockReservationService';
import { stockChannelService } from '../../services/websocket/stockChannel';

interface StockSelectionPanelProps {
  stocks: StockEntry[];
  stockGroups: StockGroup[];
  warehouses: Warehouse[];
  selectedProducts: {
    stockId: string;
    warehouseId: string;
    quantity: number;
    maxQuantity: number;
    lotId?: string;
    isPartial?: boolean;
    bagCount?: number;
    stockNumber?: string;
    quality: 'A' | 'B' | 'C';
  }[];
  onSelectProduct: (
    stockId: string,
    warehouseId: string,
    quantity: number,
    maxQuantity: number,
    lotId?: string,
    bagCount?: number,
    stockNumber?: string,
    quality?: 'A' | 'B' | 'C'
  ) => void;
  onRemoveProduct: (stockId: string) => void;
}

export default function StockSelectionPanel({
  stocks,
  stockGroups,
  warehouses,
  selectedProducts,
  onSelectProduct,
  onRemoveProduct
}: StockSelectionPanelProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'lots'>('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchivedLots, setShowArchivedLots] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [showPartialDelivery, setShowPartialDelivery] = useState(false);
  const [partialData, setPartialData] = useState<Record<string, {quantity: number, bagCount: number}>>({});
  const [lotPartialData, setLotPartialData] = useState<Record<string, {quantity: number, bagCount: number}>>({});
  const [reservations, setReservations] = useState<StockReservation[]>([]);

  // Listen to reservations in real-time
  useEffect(() => {
    // Nettoyer les réservations expirées au montage
    StockReservationService.cleanupExpiredReservations();
    
    const unsubscribe = StockReservationService.subscribeToReservations(setReservations);
    return unsubscribe;
  }, []);

  // Listen to WebSocket events
  useEffect(() => {
    const unsubscribe = stockChannelService.subscribe((event) => {
      if (event.type === 'reservationUpdate') {
        // Refresh reservations when they change
        StockReservationService.getActiveReservations().then(setReservations);
      }
    });

    return unsubscribe;
  }, []);

  // Get reserved stock IDs and lot IDs
  const reservedStocks = new Set(
    reservations
      .filter(r => r.type === 'stock')
      .map(r => r.itemId)
  );

  const reservedLots = new Set(
    reservations
      .filter(r => r.type === 'lot')
      .map(r => r.itemId)
  );

  // Get lot reservations with quantities
  const lotReservations = reservations
    .filter(r => r.type === 'lot')
    .reduce((acc, r) => {
      acc[r.itemId] = (acc[r.itemId] || 0) + r.quantity;
      return acc;
    }, {} as Record<string, number>);

  // Filter available stocks
  const availableStocks = stocks.filter(stock => 
    {
      // Basic checks
      const hasQuantity = stock.quantity > 0.001;
      const hasWarehouse = !!stock.warehouseId;
      const notGrouped = !stock.isGrouped;
      const notCombined = !stock.combinedIntoStock;
      const notSelected = !selectedProducts.some(p => p.stockId === stock.id);
      const notReserved = !reservedStocks.has(stock.id!);
      const matchesWarehouse = !selectedWarehouse || stock.warehouseId === selectedWarehouse;
      const matchesSearch = !searchQuery || stock.stockNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Debug only problematic stocks
      if (!hasQuantity || !hasWarehouse || !notGrouped || !notCombined || !notSelected || !notReserved) {
        console.log('Stock filtered out:', {
          stockNumber: stock.stockNumber,
          hasQuantity,
          hasWarehouse,
          notGrouped,
          notCombined,
          notSelected,
          notReserved,
          reservedStocks: Array.from(reservedStocks)
        });
      }
      
      return hasQuantity && hasWarehouse && notGrouped && notCombined && notSelected && notReserved && matchesWarehouse && matchesSearch;
    }
  );

  // Filter available lots
  const availableLots = stockGroups.filter(group => 
    // Filter by search
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    // Include lots that still have available quantity
    ((group.remainingQuantity || group.totalQuantity) - (lotReservations[group.id!] || 0)) > 0.001 &&
    // Include archived lots only if requested
    (showArchivedLots || !group.archived) &&
    // Exclude lots with no quantity
    group.totalQuantity > 0.001 &&
    // Include lots that are not fully delivered (check both status and calculated remaining quantity)
    (group.status !== 'delivered' && 
     (!group.deliveredQuantity || 
      (group.remainingQuantity !== undefined ? group.remainingQuantity : group.totalQuantity - group.deliveredQuantity) > 0.001)) &&
    // Exclude lots whose stocks are already selected individually
    !group.stockIds.some(stockId => 
      selectedProducts.some(p => p.stockId === stockId && !p.lotId)
    )
  );

  const getWarehouseName = (warehouseId: string): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'Inconnu';
  };

  const getStockStatus = (stock: StockEntry): { badge: string; color: string } => {
    if (reservedStocks.has(stock.id!)) {
      return { badge: 'Réservé', color: 'bg-red-100 text-red-800' };
    }
    
    if (stock.status === 'partially_delivered') {
      return { badge: 'Partiellement réservé', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { badge: 'Disponible', color: 'bg-green-100 text-green-800' };
  };

  const getLotStatus = (lot: StockGroup): { badge: string; color: string } => {
    const reservedQuantity = lotReservations[lot.id!] || 0;
    const currentQuantity = lot.remainingQuantity !== undefined 
      ? lot.remainingQuantity 
      : (lot.deliveredQuantity ? lot.totalQuantity - lot.deliveredQuantity : lot.totalQuantity);
    const availableQuantity = currentQuantity - reservedQuantity;
    
    // Vérifier si le lot est entièrement livré (par statut ou par calcul)
    if (lot.status === 'delivered' || 
        (lot.deliveredQuantity && lot.deliveredQuantity >= lot.totalQuantity - 0.001)) {
      return { badge: 'Livré', color: 'bg-gray-100 text-gray-700' };
    }
    
    // Vérifier si le lot est partiellement livré
    if (lot.status === 'partially_delivered' || 
        (lot.deliveredQuantity && lot.deliveredQuantity > 0.001)) {
      if (availableQuantity <= 0.001) {
        return { badge: 'Entièrement réservé', color: 'bg-red-100 text-red-800' };
      }
      return { badge: 'Partiellement livré', color: 'bg-orange-100 text-orange-800' };
    }
    
    if (availableQuantity <= 0.001) {
      return { badge: 'Entièrement réservé', color: 'bg-red-100 text-red-800' };
    }
    
    if (reservedQuantity > 0.001) {
      return { badge: 'Partiellement réservé', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (lot.archived) {
      return { badge: 'Dissocié', color: 'bg-gray-100 text-gray-700' };
    }

    return { badge: 'Disponible', color: 'bg-green-100 text-green-800' };
  };

  const handleStockSelection = (stock: StockEntry, isPartial: boolean = false) => {
    if (!stock.warehouseId) {
      toast.error('Ce stock n\'est pas assigné à un magasin');
      return;
    }

    const data = partialData[stock.id!] || {
      quantity: stock.quantity,
      bagCount: stock.bagCount || 0
    };

    const quantity = isPartial ? data.quantity : stock.quantity;
    const bagCount = isPartial ? data.bagCount : stock.bagCount || 0;

    onSelectProduct(
      stock.id!,
      stock.warehouseId,
      quantity,
      stock.quantity,
      undefined,
      bagCount,
      stock.stockNumber,
      stock.quality
    );
  };

  const handleLotSelection = (lot: StockGroup, isPartial: boolean = false) => {
    // Get stocks in this lot
    const lotStocks = stocks.filter(stock => lot.stockIds.includes(stock.id!));
    
    if (lotStocks.length === 0) {
      toast.error('Aucun stock trouvé dans ce lot');
      return;
    }

    // Check if any stocks in the lot are already selected individually
    const alreadySelectedStocks = lot.stockIds.filter(stockId => 
      selectedProducts.some(p => p.stockId === stockId && !p.lotId)
    );
    
    if (alreadySelectedStocks.length > 0) {
      toast.error('Certains stocks de ce lot sont déjà sélectionnés individuellement');
      return;
    }

    // Calculate available quantity (total - already reserved)
    const reservedQuantity = lotReservations[lot.id!] || 0;
    const availableQuantity = lot.totalQuantity - reservedQuantity;
    const availableBags = Math.round((availableQuantity / lot.totalQuantity) * lot.totalBags);

    const data = lotPartialData[lot.id!] || {
      quantity: availableQuantity,
      bagCount: availableBags
    };

    const quantity = isPartial ? data.quantity : availableQuantity;
    const bagCount = isPartial ? data.bagCount : availableBags;

    // Calculate ratio for proportional distribution based on available quantity
    const ratio = availableQuantity > 0 ? quantity / availableQuantity : 0;

    // Add each stock in the lot
    lotStocks.forEach(stock => {
      if (!stock.warehouseId) return;

      // Calculate stock's available quantity (considering its current quantity)
      const stockAvailableQuantity = stock.quantity * (availableQuantity / lot.totalQuantity);
      const stockQuantity = stockAvailableQuantity * ratio;
      const stockBagCount = stock.bagCount ? Math.round(stock.bagCount * ratio) : 0;

      onSelectProduct(
        stock.id!,
        stock.warehouseId,
        stockQuantity,
        stockAvailableQuantity, // Use available quantity as max
        lot.name, // Use lot name as lotId
        stockBagCount,
        stock.stockNumber,
        stock.quality
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'stocks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stocks individuels</span>
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'lots'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lots combinés</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Rechercher un ${activeTab === 'stocks' ? 'stock' : 'lot'}...`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'stocks' && (
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les magasins</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="partial-delivery"
          checked={showPartialDelivery}
          onChange={() => setShowPartialDelivery(!showPartialDelivery)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="partial-delivery" className="text-sm text-gray-700">
          Permettre les livraisons partielles
        </label>
      </div>

      {activeTab === 'lots' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-archived-lots"
            checked={showArchivedLots}
            onChange={() => setShowArchivedLots(!showArchivedLots)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="show-archived-lots" className="text-sm text-gray-700 flex items-center gap-1">
            <Archive className="w-4 h-4 text-gray-500" />
            Inclure les lots dissociés
          </label>
        </div>
      )}

      {/* Available stocks/lots list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">
            {activeTab === 'stocks' ? 'Stocks disponibles' : 'Lots disponibles'}
          </h3>
        </div>

        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {activeTab === 'stocks' && availableStocks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun stock disponible</p>
            </div>
          )}

          {activeTab === 'lots' && availableLots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun lot disponible</p>
            </div>
          )}

          {activeTab === 'stocks' && availableStocks.map((stock) => {
            const status = getStockStatus(stock);
            
            return (
              <div key={stock.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Stock #{stock.stockNumber}</h4>
                    <p className="text-sm text-gray-500">
                      {getWarehouseName(stock.warehouseId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.badge}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stock.quality === 'A' ? 'bg-green-100 text-green-800' :
                      stock.quality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Qualité {stock.quality}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-600">
                    {stock.quantity.toFixed(2)} tonnes • {stock.bagCount || 0} sacs
                  </span>
                  
                  {showPartialDelivery ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const data = partialData[stock.id!] || {
                            quantity: stock.quantity,
                            bagCount: stock.bagCount || 0
                          };
                          
                          const newQty = Math.max(0.1, data.quantity - 0.1);
                          const bagsPerTon = stock.bagCount && stock.quantity ? stock.bagCount / stock.quantity : 0;
                          const newBagCount = bagsPerTon > 0 ? Math.round(newQty * bagsPerTon) : data.bagCount;
                          
                          setPartialData({
                            ...partialData,
                            [stock.id!]: { quantity: newQty, bagCount: newBagCount }
                          });
                        }}
                        className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          min="0.1"
                          max={stock.quantity}
                          step="0.1"
                          value={partialData[stock.id!]?.quantity || stock.quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value > 0 && value <= stock.quantity) {
                              const bagsPerTon = stock.bagCount && stock.quantity ? stock.bagCount / stock.quantity : 0;
                              const newBagCount = bagsPerTon > 0 ? Math.round(value * bagsPerTon) : partialData[stock.id!]?.bagCount || stock.bagCount || 0;
                              
                              setPartialData({
                                ...partialData,
                                [stock.id!]: { quantity: value, bagCount: newBagCount }
                              });
                            }
                          }}
                          className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-xs"
                          placeholder="tonnes"
                        />
                        <input
                          type="number"
                          min="1"
                          max={stock.bagCount || 999}
                          step="1"
                          value={partialData[stock.id!]?.bagCount || stock.bagCount || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              const bagsPerTon = stock.bagCount && stock.quantity ? stock.bagCount / stock.quantity : 0;
                              const newQuantity = bagsPerTon > 0 ? value / bagsPerTon : partialData[stock.id!]?.quantity || stock.quantity;
                              
                              setPartialData({
                                ...partialData,
                                [stock.id!]: { quantity: newQuantity, bagCount: value }
                              });
                            }
                          }}
                          className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-xs"
                          placeholder="sacs"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const data = partialData[stock.id!] || {
                            quantity: stock.quantity,
                            bagCount: stock.bagCount || 0
                          };
                          
                          const newQty = Math.min(stock.quantity, data.quantity + 0.1);
                          const bagsPerTon = stock.bagCount && stock.quantity ? stock.bagCount / stock.quantity : 0;
                          const newBagCount = bagsPerTon > 0 ? Math.round(newQty * bagsPerTon) : data.bagCount;
                          
                          setPartialData({
                            ...partialData,
                            [stock.id!]: { quantity: newQty, bagCount: newBagCount }
                          });
                        }}
                        className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleStockSelection(stock, true)}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStockSelection(stock, false)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {activeTab === 'lots' && availableLots.map((lot) => {
            const status = getLotStatus(lot);
            const reservedQuantity = lotReservations[lot.id!] || 0;
            const currentQuantity = lot.remainingQuantity || lot.totalQuantity;
            const availableQuantity = currentQuantity - reservedQuantity;
            const currentBags = lot.remainingBags || lot.totalBags;
            const availableBags = Math.round((availableQuantity / currentQuantity) * currentBags);
            
            return (
              <div key={lot.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Lot #{lot.name}</h4>
                    <p className="text-sm text-gray-500">
                      {lot.stockIds.length} stocks • {availableQuantity.toFixed(2)} / {currentQuantity.toFixed(2)} tonnes
                    </p>
                    {lot.status === 'partially_delivered' && (
                      <p className="text-xs text-orange-600">
                        {(lot.deliveredQuantity || 0).toFixed(2)} tonnes déjà livrées
                      </p>
                    )}
                    {reservedQuantity > 0 && (
                      <p className="text-xs text-amber-600">
                        {reservedQuantity.toFixed(2)} tonnes réservées
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                    {status.badge}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-600">
                    {availableBags} / {currentBags} sacs disponibles
                  </span>
                  
                  {showPartialDelivery ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const data = lotPartialData[lot.id!] || { 
                            quantity: availableQuantity, 
                            bagCount: availableBags 
                          };
                          const newQty = Math.max(0.1, data.quantity - 0.1);
                          const bagsPerTon = availableBags / availableQuantity;
                          const newBagCount = Math.round(newQty * bagsPerTon);
                          
                          setLotPartialData({
                            ...lotPartialData,
                            [lot.id!]: { quantity: newQty, bagCount: newBagCount }
                          });
                        }}
                        className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          min="0.1"
                          max={availableQuantity}
                          step="0.1"
                          value={lotPartialData[lot.id!]?.quantity || availableQuantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value > 0 && value <= availableQuantity) {
                              const bagsPerTon = availableBags / availableQuantity;
                              const newBagCount = Math.round(value * bagsPerTon);
                              
                              setLotPartialData({
                                ...lotPartialData,
                                [lot.id!]: { quantity: value, bagCount: newBagCount }
                              });
                            }
                          }}
                          className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-xs"
                          placeholder="tonnes"
                        />
                        <input
                          type="number"
                          min="1"
                          max={availableBags}
                          step="1"
                          value={lotPartialData[lot.id!]?.bagCount || availableBags}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0 && value <= availableBags) {
                              const bagsPerTon = availableBags / availableQuantity;
                              const newQuantity = value / bagsPerTon;
                              
                              setLotPartialData({
                                ...lotPartialData,
                                [lot.id!]: { quantity: newQuantity, bagCount: value }
                              });
                            }
                          }}
                          className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-xs"
                          placeholder="sacs"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const data = lotPartialData[lot.id!] || { 
                            quantity: availableQuantity, 
                            bagCount: availableBags 
                          };
                          const newQty = Math.min(availableQuantity, data.quantity + 0.1);
                          const bagsPerTon = availableBags / availableQuantity;
                          const newBagCount = Math.round(newQty * bagsPerTon);
                          
                          setLotPartialData({
                            ...lotPartialData,
                            [lot.id!]: { quantity: newQty, bagCount: newBagCount }
                          });
                        }}
                        className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleLotSelection(lot, true)}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLotSelection(lot, false)}
                      disabled={availableQuantity <= 0}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Ajouter le lot
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected products list */}
      {selectedProducts.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">
              Produits sélectionnés pour la livraison
            </h3>
          </div>

          <div className="p-4 space-y-3">
            {selectedProducts.map((product) => {
              const isLot = product.lotId !== undefined;
              
              return (
                <div key={product.stockId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {isLot ? `Lot #${product.lotId}` : `Stock #${product.stockNumber}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {getWarehouseName(product.warehouseId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.isPartial && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Partiel
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Réservé
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(product.stockId)}
                        className="p-1 bg-red-100 rounded-full hover:bg-red-200"
                      >
                        <Minus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {product.quantity.toFixed(2)} / {product.maxQuantity.toFixed(2)} tonnes
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {product.bagCount || 0} sacs
                    </span>
                    
                    {product.isPartial && (
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(product.quantity / product.maxQuantity) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}