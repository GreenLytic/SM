import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Warehouse } from '../types/warehouse';
import { toast } from 'react-hot-toast';
import { Building2, Calculator, Info, Archive, AlertTriangle } from 'lucide-react';

interface WarehouseFormProps {
  onClose: () => void;
  warehouse?: Warehouse | null;
}

export default function WarehouseForm({ onClose, warehouse }: WarehouseFormProps) {
  const [formData, setFormData] = useState<Omit<Warehouse, 'id' | 'currentStock'>>({
    name: '',
    location: '',
    capacity: 0,
    status: 'active',
    notes: ''
  });
  const [showCapacityHelp, setShowCapacityHelp] = useState(false);

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        location: warehouse.location,
        capacity: warehouse.capacity,
        status: warehouse.status,
        notes: warehouse.notes || ''
      });
    }
  }, [warehouse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if trying to archive a warehouse that's not at full capacity
    if (warehouse && 
        formData.status === 'inactive' && 
        warehouse.status === 'active' && 
        warehouse.currentStock > 0) {
      toast.error('Impossible d\'archiver un magasin contenant du stock');
      return;
    }

    try {
      if (warehouse?.id) {
        await updateDoc(doc(db, 'warehouses', warehouse.id), {
          ...formData,
          currentStock: warehouse.currentStock // Conserver le stock actuel
        });
        toast.success('Magasin mis à jour avec succès');
      } else {
        await addDoc(collection(db, 'warehouses'), {
          ...formData,
          currentStock: 0 // Nouveau magasin commence avec un stock de 0
        });
        toast.success('Magasin créé avec succès');
      }
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Building2 className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          {warehouse ? 'Modifier le magasin' : 'Nouveau magasin'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom du magasin</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Localisation</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Capacité (tonnes)</label>
            <button 
              type="button" 
              onClick={() => setShowCapacityHelp(!showCapacityHelp)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              {showCapacityHelp ? <Info className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
              {showCapacityHelp ? 'Masquer l\'aide' : 'Calculer la capacité'}
            </button>
          </div>
          <input
            type="number"
            required
            min="0"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {showCapacityHelp && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Comment calculer la capacité d'un magasin</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>1. Calculer le volume utilisable</strong></p>
              <p className="ml-4">Volume brut (m³) = Longueur (m) × Largeur (m) × Hauteur utile (m)</p>
              <p className="ml-4">Volume utilisable (m³) = Volume brut × 0,65 (coefficient d'utilisation tenant compte des allées et espaces)</p>
              
              <p><strong>2. Calculer la capacité en tonnes</strong></p>
              <p className="ml-4">Pour le cacao en sacs de 60 kg:</p>
              <p className="ml-4">• Densité moyenne: ~500 kg/m³</p>
              <p className="ml-4">• Capacité (tonnes) = Volume utilisable (m³) × 0,5</p>
              
              <p><strong>3. Contraintes importantes</strong></p>
              <p className="ml-4">• Hauteur maximale d'empilement: 4,5 mètres</p>
              <p className="ml-4">• Charge au sol maximale: ~1000-1500 kg/m²</p>
              <p className="ml-4">• Espaces de ventilation: 0,5-1m des murs, 1m entre les piles</p>
              
              <p><strong>Exemple:</strong> Un magasin de 20m × 10m × 6m (hauteur utile 4,5m)</p>
              <p className="ml-4">Volume brut = 20 × 10 × 4,5 = 900 m³</p>
              <p className="ml-4">Volume utilisable = 900 × 0,65 = 585 m³</p>
              <p className="ml-4">Capacité = 585 × 0,5 = 292,5 tonnes</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Statut</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="status-active"
                name="status"
                value="active"
                checked={formData.status === 'active'}
                onChange={() => setFormData({...formData, status: 'active'})}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="status-active" className="text-sm text-gray-700">
                Actif
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="status-inactive"
                name="status"
                value="inactive"
                checked={formData.status === 'inactive'}
                onChange={() => setFormData({...formData, status: 'inactive'})}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="status-inactive" className="text-sm text-gray-700">
                Archivé
              </label>
            </div>
          </div>
          
          {warehouse && formData.status === 'inactive' && warehouse.status === 'active' && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Archivage de magasin</p>
                <p className="text-xs text-amber-700">
                  L'archivage d'un magasin empêchera l'assignation de nouveaux stocks.
                  {warehouse.currentStock > 0 && (
                    <span className="font-medium"> Ce magasin contient actuellement du stock et ne peut pas être archivé.</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Informations supplémentaires..."
          />
        </div>
        
        {warehouse && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-blue-800">Informations actuelles</h4>
              {warehouse.currentStock === 0 && warehouse.status === 'active' && (
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <Archive className="w-3 h-3" />
                  <span>Magasin vide - peut être archivé</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Stock actuel</p>
                <p className="text-lg font-semibold text-blue-900">{warehouse.currentStock.toFixed(1)} tonnes</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Taux d'occupation</p>
                <p className="text-lg font-semibold text-blue-900">
                  {((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
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
          {warehouse ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  );
}