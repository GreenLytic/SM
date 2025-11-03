import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Producer } from '../types/producer';
import { toast } from 'react-hot-toast';
import { UserPlus, Edit2 } from 'lucide-react';
import LocationPicker from './LocationPicker';

interface ProducerFormProps {
  onClose: () => void;
  producer?: Producer | null;
}

export default function ProducerForm({ onClose, producer }: ProducerFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    cni: '',
    email: '',
    phone: '',
    address: '',
    cultivatedArea: 0,
    estimatedProduction: 0,
  });
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (producer) {
      setFormData({
        fullName: producer.fullName,
        cni: producer.cni || '',
        email: producer.email,
        phone: producer.phone,
        address: producer.address,
        cultivatedArea: producer.cultivatedArea,
        estimatedProduction: producer.estimatedProduction,
      });
      setAcceptPolicy(true);
    }
  }, [producer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptPolicy && !producer) {
      toast.error('Veuillez accepter la politique de suppression');
      return;
    }

    if (!coordinates) {
      toast.error('Veuillez sélectionner une localisation sur la carte');
      return;
    }

    try {
      const producerData = {
        ...formData,
        coordinates,
        joinDate: producer?.joinDate || new Date(),
        technicalRecommendations: producer?.technicalRecommendations || [],
        inputs: producer?.inputs || [],
        rating: producer?.rating || 0,
        status: producer?.status || 'active',
      };

      if (producer?.id) {
        await updateDoc(doc(db, 'producers', producer.id), {
          ...producerData,
          updatedAt: new Date(),
        });
        toast.success('Producteur mis à jour avec succès!');
      } else {
        await addDoc(collection(db, 'producers'), producerData);
        toast.success('Producteur ajouté avec succès!');
      }
      onClose();
    } catch (error) {
      toast.error(producer?.id ? 
        'Erreur lors de la mise à jour du producteur' : 
        'Erreur lors de l\'ajout du producteur'
      );
    }
  };

  const handleLocationChange = (address: string, coords: [number, number]) => {
    setFormData(prev => ({ ...prev, address }));
    setCoordinates(coords);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        {producer ? (
          <Edit2 className="h-6 w-6 text-blue-600" />
        ) : (
          <UserPlus className="h-6 w-6 text-green-600" />
        )}
        <h2 className="text-xl font-semibold text-gray-800">
          {producer ? 'Modifier le producteur' : 'Ajouter un nouveau producteur'}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro CNI</label>
          <input
            type="text"
            required
            placeholder="Entrez le numéro de la carte nationale d'identité"
            value={formData.cni}
            onChange={(e) => setFormData({...formData, cni: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Surface cultivée (ha)</label>
          <input
            type="number"
            required
            min="0"
            value={formData.cultivatedArea}
            onChange={(e) => setFormData({...formData, cultivatedArea: Number(e.target.value)})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Production estimée (t)</label>
          <input
            type="number"
            required
            min="0"
            value={formData.estimatedProduction}
            onChange={(e) => setFormData({...formData, estimatedProduction: Number(e.target.value)})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
          <LocationPicker
            value={formData.address}
            onChange={handleLocationChange}
          />
        </div>
      </div>

      {!producer && (
        <div className="mt-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={acceptPolicy}
              onChange={(e) => setAcceptPolicy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label className="ml-2 block text-sm text-gray-700">
              En cochant cette case, je comprends et j'accepte qu'après l'ajout d'un producteur, 
              il sera impossible de le supprimer de la base de données. Je pourrai uniquement 
              modifier son statut (actif/inactif).
            </label>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {producer ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}