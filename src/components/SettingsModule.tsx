import React, { useState } from 'react';
import { Settings, Server, Shield, Zap, Users, Bell, Globe, Palette, Lock, Database, FileText, Link } from 'lucide-react';
import TechnicalSettings from './settings/TechnicalSettings';
import UserSettings from './settings/UserSettings';
import SystemSettings from './settings/SystemSettings';

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState<'technical' | 'user' | 'system'>('technical');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Paramètres</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'technical'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span>Technique</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'user'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Utilisateur</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'system'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Système</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'technical' && <TechnicalSettings />}
          {activeTab === 'user' && <UserSettings />}
          {activeTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}