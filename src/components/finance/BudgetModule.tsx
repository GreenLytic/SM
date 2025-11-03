import React, { useState } from 'react';
import { FileText, BarChart, DollarSign } from 'lucide-react';
import BudgetDashboard from './budget/BudgetDashboard';
import BudgetPlanning from './budget/BudgetPlanning';
import BudgetGuide from './budget/BudgetGuide';

export default function BudgetModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planning' | 'guide'>('dashboard');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Budget</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('planning')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'planning'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Planification</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'guide'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Guide</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <BudgetDashboard />}
          {activeTab === 'planning' && <BudgetPlanning />}
          {activeTab === 'guide' && <BudgetGuide />}
        </div>
      </div>
    </div>
  );
}