import React, { useState } from 'react';
import { Server, Shield, Zap, RefreshCw } from 'lucide-react';

export default function TechnicalSettings() {
  const [databaseConfig, setDatabaseConfig] = useState({
    host: 'localhost',
    port: '5432',
    name: 'smartcoop_db',
    maxConnections: '100'
  });

  const [securityConfig, setSecurityConfig] = useState({
    sessionTimeout: '30',
    maxLoginAttempts: '3',
    passwordExpiration: '90',
    twoFactorAuth: true
  });

  const [performanceConfig, setPerformanceConfig] = useState({
    cacheEnabled: true,
    cacheDuration: '3600',
    maxRequestSize: '10',
    compressionEnabled: true
  });

  const [versionConfig, setVersionConfig] = useState({
    currentVersion: '1.0.0',
    autoUpdate: true,
    updateChannel: 'stable',
    backupBeforeUpdate: true
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          Configuration du serveur et base de données
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hôte</label>
            <input
              type="text"
              value={databaseConfig.host}
              onChange={(e) => setDatabaseConfig({...databaseConfig, host: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Port</label>
            <input
              type="text"
              value={databaseConfig.port}
              onChange={(e) => setDatabaseConfig({...databaseConfig, port: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Protocoles de sécurité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Délai d'expiration de session (min)</label>
            <input
              type="number"
              value={securityConfig.sessionTimeout}
              onChange={(e) => setSecurityConfig({...securityConfig, sessionTimeout: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tentatives de connexion max</label>
            <input
              type="number"
              value={securityConfig.maxLoginAttempts}
              onChange={(e) => setSecurityConfig({...securityConfig, maxLoginAttempts: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Performances et optimisation
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={performanceConfig.cacheEnabled}
              onChange={(e) => setPerformanceConfig({...performanceConfig, cacheEnabled: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Activer le cache</label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={performanceConfig.compressionEnabled}
              onChange={(e) => setPerformanceConfig({...performanceConfig, compressionEnabled: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Activer la compression</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Gestion des versions
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Version actuelle</label>
            <input
              type="text"
              value={versionConfig.currentVersion}
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={versionConfig.autoUpdate}
              onChange={(e) => setVersionConfig({...versionConfig, autoUpdate: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Mises à jour automatiques</label>
          </div>
        </div>
      </div>
    </div>
  );
}