import React from 'react';
import { Warehouse } from '../../types/warehouse';
import { Building2, Package, AlertTriangle, Archive, Edit } from 'lucide-react';

interface WarehouseInfoDisplayProps {
  warehouses: Warehouse[];
  totalStockValue?: number;
  onEditWarehouse?: (warehouse: Warehouse) => void;
}

export default function WarehouseInfoDisplay({ warehouses, totalStockValue, onEditWarehouse }: WarehouseInfoDisplayProps) {
  // Calculate total capacity and usage
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
  const totalUsed = warehouses.reduce((sum, w) => sum + w.currentStock, 0);
  const usagePercentage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  
  // Get active warehouses
  const activeWarehouses = warehouses.filter(w => w.status === 'active');
  
  // Find warehouses with critical capacity (>90%)
  const criticalWarehouses = warehouses.filter(w => 
    w.status === 'active' && (w.currentStock / w.capacity) * 100 >= 90
  );

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Magasins
        </h3>
        <div className="text-sm text-gray-500">
          {activeWarehouses.length} actif{activeWarehouses.length > 1 ? 's' : ''} / {warehouses.length} total
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Capacité totale</p>
          <p className="text-xl font-semibold text-gray-900">{totalCapacity.toFixed(1)} tonnes</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Stock actuel</p>
          <p className="text-xl font-semibold text-gray-900">{totalUsed.toFixed(1)} tonnes</p>
        </div>

        {totalStockValue !== undefined && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Valeur totale du stock</p>
            <p className="text-xl font-semibold text-gray-900">
              {totalStockValue.toLocaleString()} FCFA
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Taux d'occupation</p>
          <p className="text-xl font-semibold text-gray-900">{usagePercentage.toFixed(1)}%</p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${getCapacityColor(usagePercentage)} transition-all`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Critical warehouses warning */}
      {criticalWarehouses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Magasins presque pleins</p>
            <ul className="mt-1 text-sm text-red-700 space-y-1">
              {criticalWarehouses.map(warehouse => (
                <li key={warehouse.id}>
                  {warehouse.name} - {((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}% occupé
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Warehouses list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map(warehouse => {
          const usagePercentage = (warehouse.currentStock / warehouse.capacity) * 100;
          return (
            <div 
              key={warehouse.id} 
              className={`border rounded-lg p-4 ${
                warehouse.status === 'active' ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{warehouse.name}</h4>
                  <p className="text-sm text-gray-500">{warehouse.location}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  warehouse.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {warehouse.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Capacité utilisée</span>
                  <span className="font-medium text-gray-900">
                    {warehouse.currentStock.toFixed(1)} / {warehouse.capacity} tonnes
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCapacityColor(usagePercentage)} transition-all`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {usagePercentage.toFixed(1)}% utilisé
                </p>
                
                {/* Management buttons */}
                {onEditWarehouse && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => onEditWarehouse(warehouse)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Gérer</span>
                    </button>
                    
                    {warehouse.currentStock === 0 && warehouse.status === 'active' && (
                      <button
                        onClick={() => onEditWarehouse(warehouse)}
                        className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800"
                      >
                        <Archive className="w-4 h-4" />
                        <span>Archiver</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {warehouse.notes && (
                <p className="text-sm text-gray-500 mt-2 border-t border-gray-100 pt-2">{warehouse.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}