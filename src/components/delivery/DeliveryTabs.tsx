import React, { useState } from 'react';
import { Truck, ClipboardList, Archive } from 'lucide-react';
import DeliveryPlanner from './DeliveryPlanner';
import DeliveryTracking from './DeliveryTracking';
import DeliveryArchives from './DeliveryArchives';

export default function DeliveryTabs() {
  const [activeTab, setActiveTab] = useState<'plan' | 'track' | 'archive'>('plan');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Livraisons</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'plan'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Planifier</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('track')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'track'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>Suivi</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'archive'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  <span>Archives</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'plan' && <DeliveryPlanner />}
          {activeTab === 'track' && <DeliveryTracking />}
          {activeTab === 'archive' && <DeliveryArchives />}
        </div>
      </div>
    </div>
  );
}