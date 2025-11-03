import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PriceSettings } from '../../types/finance';
import { toast } from 'react-hot-toast';
import { Coins } from 'lucide-react';
import { updateStockValue } from '../../services/financeService';

interface PriceSettingsFormProps {
  onClose: () => void;
  settings: PriceSettings | null;
  existingSettings: PriceSettings[];
}

const PriceSettingsForm: React.FC<PriceSettingsFormProps> = ({
  onClose,
  settings,
  existingSettings
}) => {
  const [formData, setFormData] = useState<Omit<PriceSettings, 'id'>>({
    basePrice: 0,
    qualityPremiums: {
      A: 0,
      B: 0,
      C: 0
    },
    certifications: [],
    effectiveDate: new Date(),
    status: 'active'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        basePrice: settings.basePrice,
        qualityPremiums: settings.qualityPremiums,
        certifications: settings.certifications,
        effectiveDate: settings.effectiveDate,
        status: settings.status
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const batch = writeBatch(db);

      if (settings?.id) {
        // Mise à jour d'une configuration existante
        await updateDoc(doc(db, 'priceSettings', settings.id), formData);
        
        // Update all stock values based on new price settings
        await updateStockValue();
        
        // Ensure all stocks have invoices with updated prices
        await InvoiceService.ensureInvoicesForAllStocks();
        
        toast.success('Configuration mise à jour avec succès');
      } else {
        // Désactiver toutes les configurations existantes
        existingSettings.forEach(setting => {
          if (setting.id) {
            batch.update(doc(db, 'priceSettings', setting.id), { status: 'inactive' });
          }
        });

        // Créer la nouvelle configuration comme active
        const newData = { ...formData, status: 'active' };
        await addDoc(collection(db, 'priceSettings'), newData);
        await batch.commit();
        
        // Update all stock values based on new price settings
        await updateStockValue();
        
        // Ensure all stocks have invoices with updated prices
        await InvoiceService.ensureInvoicesForAllStocks();
        
        toast.success('Configuration créée avec succès');
      }
      onClose();
    } catch (error) {
      console.error('Error saving price settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', premium: 0 }]
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: 'name' | 'premium', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Coins className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          {settings ? 'Modifier la configuration' : 'Nouvelle configuration'}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix de base (FCFA/kg)</label>
          <input
            type="number"
            required
            min="0"
            value={formData.basePrice}
            onChange={(e) => setFormData({...formData, basePrice: Number(e.target.value)})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Primes qualité (FCFA/kg)</h3>
          <div className="grid grid-cols-3 gap-4">
            {(['A', 'B', 'C'] as const).map((quality) => (
              <div key={quality}>
                <label className="block text-sm text-gray-600">Qualité {quality}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.qualityPremiums[quality]}
                  onChange={(e) => setFormData({
                    ...formData,
                    qualityPremiums: {
                      ...formData.qualityPremiums,
                      [quality]: Number(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Certifications</h3>
            <button
              type="button"
              onClick={addCertification}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Nom de la certification"
                    value={cert.name}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Prime (FCFA/kg)"
                    value={cert.premium}
                    onChange={(e) => updateCertification(index, 'premium', Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date d'effet</label>
          <input
            type="date"
            required
            value={formData.effectiveDate.toISOString().split('T')[0]}
            onChange={(e) => setFormData({...formData, effectiveDate: new Date(e.target.value)})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {settings ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default PriceSettingsForm;