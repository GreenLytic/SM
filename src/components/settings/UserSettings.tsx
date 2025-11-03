import React, { useState } from 'react';
import { User, Bell, Globe, Palette } from 'lucide-react';

export default function UserSettings() {
  const [profileSettings, setProfileSettings] = useState({
    displayName: 'Admin',
    email: 'admin@smartcoop.com',
    phone: '+237 123456789',
    timezone: 'Africa/Douala'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    stockAlerts: true,
    paymentAlerts: true,
    deliveryUpdates: true
  });

  const [localeSettings, setLocaleSettings] = useState({
    language: 'fr',
    region: 'CM',
    dateFormat: 'DD/MM/YYYY',
    currency: 'XAF'
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    colorScheme: 'blue',
    reducedMotion: false
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Profil et préférences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom d'affichage</label>
            <input
              type="text"
              value={profileSettings.displayName}
              onChange={(e) => setProfileSettings({...profileSettings, displayName: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profileSettings.email}
              onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Notifications et alertes
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Notifications par email</label>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={notificationSettings.smsNotifications}
              onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="text-sm text-gray-700">Notifications par SMS</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Langue et région
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Langue</label>
            <select
              value={localeSettings.language}
              onChange={(e) => setLocaleSettings({...localeSettings, language: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Format de date</label>
            <select
              value={localeSettings.dateFormat}
              onChange={(e) => setLocaleSettings({...localeSettings, dateFormat: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-600" />
          Thème et apparence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Thème</label>
            <select
              value={themeSettings.theme}
              onChange={(e) => setThemeSettings({...themeSettings, theme: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="system">Système</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Taille de police</label>
            <select
              value={themeSettings.fontSize}
              onChange={(e) => setThemeSettings({...themeSettings, fontSize: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="small">Petite</option>
              <option value="medium">Moyenne</option>
              <option value="large">Grande</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}