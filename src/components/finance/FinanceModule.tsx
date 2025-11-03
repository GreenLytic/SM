import React, { useState } from 'react';
import { Coins, Receipt, BarChart, Wallet, FileText } from 'lucide-react';
import PriceSettings from './PriceSettings';
import PaymentManagement from './PaymentManagement';
import FinancialReports from './FinancialReports'; 
import BudgetModule from './BudgetModule';

const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prices' | 'payments' | 'reports' | 'budget'>('prices');

  const tabs = [
    { id: 'prices', label: 'Prix et Primes', icon: Coins },
    { id: 'payments', label: 'Paiements', icon: Receipt },
    { id: 'reports', label: 'Rapports', icon: BarChart },
    { id: 'budget', label: 'Budget', icon: Wallet }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Finance</h2>
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'prices' && <PriceSettings />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'reports' && <FinancialReports />}
          {activeTab === 'budget' && <BudgetModule />}
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;