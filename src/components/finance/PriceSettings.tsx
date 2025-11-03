import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PriceSettings as PriceSettingsType } from '../../types/finance';
import { Plus, Edit2 } from 'lucide-react';
import Modal from '../Modal';
import PriceSettingsForm from './PriceSettingsForm';
import { updateStockValue } from '../../services/financeService';
import { InvoiceService } from '../InvoiceService';
import { toast } from 'react-hot-toast';

export default function PriceSettings() {
  const [settings, setSettings] = useState<PriceSettingsType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<PriceSettingsType | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'priceSettings'), orderBy('effectiveDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const settingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data().effectiveDate?.toDate()
      })) as PriceSettingsType[];
      setSettings(settingsData);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (settingId: string, newStatus: 'active' | 'inactive') => {
    try {
      const batch = writeBatch(db);

      if (newStatus === 'active') {
        settings.forEach(setting => {
          if (setting.id && setting.id !== settingId) {
            batch.update(doc(db, 'priceSettings', setting.id), { status: 'inactive' });
          }
        });
      }

      batch.update(doc(db, 'priceSettings', settingId), { status: newStatus });
      
      // If activating a price setting, update all stock values and invoices
      if (newStatus === 'active') {
        // Wait for batch to commit first
        await batch.commit();
        
        // Then update stock values and invoices
        await updateStockValue();
        await InvoiceService.ensureInvoicesForAllStocks();
      } else {
        await batch.commit();
      }
      
      await batch.commit();
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Configuration des prix</h3>
        <button
          onClick={() => {
            setSelectedSetting(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className={`bg-white rounded-lg border ${
              setting.status === 'active' ? 'border-success' : 'border-gray-200'
            } p-4 shadow-card hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-medium text-gray-900">
                  Prix de base: {setting.basePrice} FCFA/kg
                </h4>
                <p className="text-sm text-gray-500">
                  En vigueur depuis le {setting.effectiveDate.toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                setting.status === 'active'
                  ? 'bg-success-light text-success-dark'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {setting.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Primes qualité</h5>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(setting.qualityPremiums).map(([quality, premium]) => (
                    <div key={quality} className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">{quality}</div>
                      <div className="text-sm text-gray-500">+{premium} FCFA</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Certifications</h5>
                <div className="space-y-2">
                  {setting.certifications.map((cert, index) => (
                    <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-900">{cert.name}</span>
                      <span className="text-gray-500">+{cert.premium} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedSetting(setting);
                    setIsModalOpen(true);
                  }}
                  className="text-primary hover:text-primary-dark"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {setting.status === 'inactive' ? (
                  <button
                    onClick={() => handleStatusChange(setting.id!, 'active')}
                    className="text-success hover:text-success-dark"
                  >
                    Activer
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(setting.id!, 'inactive')}
                    className="text-error hover:text-error-dark"
                  >
                    Désactiver
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setSelectedSetting(null);
      }}>
        <PriceSettingsForm
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSetting(null);
          }}
          settings={selectedSetting}
          existingSettings={settings}
        />
      </Modal>
    </div>
  );
}