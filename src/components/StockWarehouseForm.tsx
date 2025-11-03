import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockEntry } from '../types/stock';
import { Warehouse } from '../types/warehouse';
import { Producer } from '../types/producer';
import { Building2 } from 'lucide-react'; 
import { updateStockValue } from '../services/financeService';

interface StockWarehouseFormProps {
  onClose: () => void;
  onSubmit: (stockEntry: StockEntry, warehouseId: string) => void;
  stockEntry: StockEntry | null;
  warehouses: Warehouse[];
  producerName: string;
}

export default function StockWarehouseForm({
  onClose,
  onSubmit,
  stockEntry,
  warehouses,
  producerName
}: StockWarehouseFormProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(stockEntry?.warehouseId || '');
  const [producer, setProducer] = useState<Producer | null>(null);

  useEffect(() => {
    const fetchProducer = async () => {
      if (stockEntry?.producerId) {
        const producerDoc = await getDoc(doc(db, 'producers', stockEntry.producerId));
        if (producerDoc.exists()) {
          setProducer({ id: producerDoc.id, ...producerDoc.data() } as Producer);
        }
      }
    };
    fetchProducer();
  }, [stockEntry]);

  if (!stockEntry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;
    onSubmit(stockEntry, selectedWarehouseId); 
    
    // Update financial data after warehouse assignment
    updateStockValue().catch(error => {
      console.error('Error updating financial data:', error);
    });
  };

  const getWarehouseAvailableSpace = (warehouse: Warehouse) => {
    if (stockEntry.warehouseId === warehouse.id) {
      return warehouse.capacity - (warehouse.currentStock - stockEntry.quantity);
    } else if (warehouse.status === 'inactive') {
      return 0; // Inactive warehouses have no available space
    }
    return warehouse.capacity - warehouse.currentStock;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Building2 className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Attribution du magasin
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Producteur</label>
          <p className="mt-1 text-sm text-gray-900">{producer?.fullName || 'Chargement...'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité</label>
            <p className="mt-1 text-sm text-gray-900">{stockEntry.quantity} tonnes</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de sacs</label>
            <p className="mt-1 text-sm text-gray-900">{stockEntry.bagCount || 'Non spécifié'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Magasin</label>
          <select
            required
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sélectionner un magasin</option>
            {warehouses.map((warehouse) => {
              const availableSpace = getWarehouseAvailableSpace(warehouse);
              const canStore = availableSpace >= stockEntry.quantity && warehouse.status === 'active';
              return (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                  disabled={!canStore}
                >
                  {warehouse.name} ({warehouse.status === 'active' ? `${availableSpace.toFixed(1)} tonnes disponibles` : 'Inactif'})
                </option>
              );
            })}
          </select>
        </div>

        {selectedWarehouseId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Informations sur le magasin</h4>
            {(() => {
              const warehouse = warehouses.find(w => w.id === selectedWarehouseId);
              if (!warehouse) return null;
              const availableSpace = getWarehouseAvailableSpace(warehouse);
              return (
                <div className="space-y-2 text-sm">
                  <p>Localisation: {warehouse.location}</p>
                  <p>Capacité totale: {warehouse.capacity} tonnes</p>
                  <p>Espace disponible: {availableSpace.toFixed(1)} tonnes ({((availableSpace / warehouse.capacity) * 100).toFixed(1)}%)</p>
                  <p>Statut: {warehouse.status === 'active' ? 'Actif' : 'Inactif'}</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all ${
                        (warehouse.currentStock / warehouse.capacity) * 100 >= 90 ? 'bg-red-600' :
                        (warehouse.currentStock / warehouse.capacity) * 100 >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{
                        width: `${((warehouse.capacity - availableSpace) / warehouse.capacity) * 100}%`
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!selectedWarehouseId}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Attribuer le magasin
        </button>
      </div>
    </form>
  );
}