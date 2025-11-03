import React, { useState } from 'react';
import { Package, Layers, Archive, Truck, AlertTriangle } from 'lucide-react';
import StockIndividualTab from './StockIndividualTab';
import StockCombinedTab from './StockCombinedTab';
import StockArchivedTab from './StockArchivedTab';
import StockDeliveredTab from './StockDeliveredTab';
import StockMonitoringTab from './StockMonitoringTab';

export default function StockModule() {
  const [activeTab, setActiveTab] = useState<'individual' | 'combined' | 'archived' | 'delivered' | 'monitoring'>('individual');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestion des stocks</h2>
          <div className="flex flex-wrap mt-2 gap-1">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Stocks individuels</span>
            </button>
            <button
              onClick={() => setActiveTab('combined')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'combined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Stocks combinés</span>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'archived'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Stocks dissociés</span>
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'delivered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Stocks livrés</span>
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'monitoring'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Stocks à surveiller</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'individual' && <StockIndividualTab />}
      {activeTab === 'combined' && <StockCombinedTab />}
      {activeTab === 'archived' && <StockArchivedTab />}
      {activeTab === 'delivered' && <StockDeliveredTab />}
      {activeTab === 'monitoring' && <StockMonitoringTab />}
    </div>
  );
}