import React, { useState } from 'react';
import { Lock, Database, FileText, Link } from 'lucide-react';

export default function SystemSettings() {
  const [accessSettings, setAccessSettings] = useState({
    userManagement: true,
    financialAccess: true,
    stockManagement: true,
    reportingAccess: true
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: '30',
    backupLocation: 'cloud'
  });

  const [loggingSettings, setLoggingSettings] = useState({
    activityLogging: true,
    errorLogging: true,
    logRetention: '90',
    detailedLogs: true
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    apiEnabled: true,
    webhooksEnabled: false,
    smsProvider: 'default',
    emailProvider: 'smtp'
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          Permissions et contrôles d'accès
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={accessSettings.userManagement}
              onChange={(e) => setAccessSettings({...accessSettings, userManagement: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Gestion des utilisateurs</label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={accessSettings.financialAccess}
              onChange={(e) => setAccessSettings({...accessSettings, financialAccess: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Accès aux données financières</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Sauvegarde et récupération
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fréquence de sauvegarde</label>
            <select
              value={backupSettings.backupFrequency}
              onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="hourly">Toutes les heures</option>
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Période de rétention (jours)</label>
            <input
              type="number"
              value={backupSettings.retentionPeriod}
              onChange={(e) => setBackupSettings({...backupSettings, retentionPeriod: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Journalisation et suivi
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={loggingSettings.activityLogging}
              onChange={(e) => setLoggingSettings({...loggingSettings, activityLogging: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Journal d'activité</label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={loggingSettings.errorLogging}
              onChange={(e) => setLoggingSettings({...loggingSettings, errorLogging: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Journal des erreurs</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-blue-600" />
          Intégrations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fournisseur SMS</label>
            <select
              value={integrationSettings.smsProvider}
              onChange={(e) => setIntegrationSettings({...integrationSettings, smsProvider: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="default">Par défaut</option>
              <option value="twilio">Twilio</option>
              <option value="nexmo">Nexmo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fournisseur Email</label>
            <select
              value={integrationSettings.emailProvider}
              onChange={(e) => setIntegrationSettings({...integrationSettings, emailProvider: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}