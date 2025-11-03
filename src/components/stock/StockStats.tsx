import React from 'react';
import { Package, DollarSign, Building2 } from 'lucide-react';
import { StockEntry } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';

interface StockStatsProps {
  stocks: StockEntry[];
  warehouses: Warehouse[];
  totalStockValue?: number;
}

export default function StockStats({ stocks, warehouses, totalStockValue }: StockStatsProps) {
  const totalStockWeight = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
  const totalValue = totalStockValue || stocks.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
  const totalWarehouseStock = warehouses.reduce((sum, w) => sum + (w.currentStock || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
        <div className="text-primary">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Stock total</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalStockWeight.toFixed(2)} <span className="text-sm text-gray-500">tonnes</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
        <div className="text-success">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Valeur totale</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalValue.toLocaleString()} <span className="text-sm text-gray-500">FCFA</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
        <div className="text-info">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Stock en magasin</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-gray-900">
              {totalWarehouseStock.toFixed(2)}
            </p>
            <span className="text-sm text-gray-500">tonnes</span>
          </div>
        </div>
      </div>
    </div>
  );
}