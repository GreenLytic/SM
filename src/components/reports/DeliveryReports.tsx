import React, { useState } from 'react';
import { FileText, Truck } from 'lucide-react';
import DeliveryReportsList from './DeliveryReportsList';
import RouteReportsList from './RouteReportsList';

export default function DeliveryReports() {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'routes'>('deliveries');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Rapports</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'deliveries'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Livraisons</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'routes'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Tournées</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'deliveries' ? (
            <DeliveryReportsList />
          ) : (
            <RouteReportsList />
          )}
        </div>
      </div>
    </div>
  );
}