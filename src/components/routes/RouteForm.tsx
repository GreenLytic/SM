import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CollectionRoute, RouteStop } from '../../types/route';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { toast } from 'react-hot-toast';
import { MapPin, Plus, Trash2, Users } from 'lucide-react';
import RouteMap from './RouteMap';

interface RouteFormProps {
  onClose: () => void;
  route?: CollectionRoute | null;
  producers: Producer[];
}

export default function RouteForm({ onClose, route, producers }: RouteFormProps) {
  const [formData, setFormData] = useState<Omit<CollectionRoute, 'id'>>({
    name: '',
    date: new Date(),
    startTime: '08:00',
    endTime: '18:00',
    driver: '',
    participants: [],
    status: 'planned',
    stops: [],
    notes: '',
    startLocation: '',
    endLocation: '',
    useCooperativeAsStart: true,
    useCooperativeAsEnd: true
  });

  const [cooperative, setCooperative] = useState<CooperativeInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');
  const activeProducers = producers.filter(p => p.status === 'active');

  useEffect(() => {
    const fetchCooperative = async () => {
      const docRef = doc(db, 'cooperativeInfo', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const coopData = docSnap.data() as CooperativeInfo;
        setCooperative(coopData);
        
        // Si c'est une nouvelle route, initialiser les emplacements de départ/fin
        if (!route) {
          setFormData(prev => ({
            ...prev,
            startLocation: coopData.location,
            endLocation: coopData.location
          }));
        }
      }
    };

    fetchCooperative();

    if (route) {
      setFormData({
        name: route.name,
        date: route.date,
        startTime: route.startTime,
        endTime: route.endTime || '18:00',
        driver: route.driver,
        participants: route.participants || [],
        status: route.status,
        stops: route.stops,
        notes: route.notes || '',
        startLocation: route.startLocation || '',
        endLocation: route.endLocation || '',
        useCooperativeAsStart: route.useCooperativeAsStart !== false,
        useCooperativeAsEnd: route.useCooperativeAsEnd !== false
      });
    }
  }, [route]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (formData.stops.length === 0) {
        toast.error('Veuillez ajouter au moins un arrêt');
        return;
      }

      // Assurez-vous que les emplacements de départ et de fin sont définis
      const routeData = {
        ...formData,
        date: new Date(formData.date),
        startLocation: formData.useCooperativeAsStart && cooperative ? cooperative.location : formData.startLocation,
        endLocation: formData.useCooperativeAsEnd && cooperative ? cooperative.location : formData.endLocation
      };

      if (route?.id) {
        await updateDoc(doc(db, 'routes', route.id), routeData);
        toast.success('Tournée mise à jour avec succès');
      } else {
        await addDoc(collection(db, 'routes'), routeData);
        toast.success('Tournée créée avec succès');
      }
      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStop = (producerId: string) => {
    if (!producerId) return;

    const producer = activeProducers.find(p => p.id === producerId);
    if (!producer) return;

    const newStop: RouteStop = {
      producerId,
      location: producer.address,
      status: 'pending'
    };

    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }));
  };

  const handleRemoveStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  const handleAddParticipant = () => {
    if (!newParticipant.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant.trim()]
    }));
    setNewParticipant('');
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const getProducerName = (producerId: string) => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.fullName || 'Producteur inconnu';
  };

  const selectedProducers = activeProducers.filter(p => 
    formData.stops.some(stop => stop.producerId === p.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <MapPin className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          {route ? 'Modifier la tournée' : 'Nouvelle tournée'}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom de la tournée</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ex: Tournée Nord - Lundi"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              required
              value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Heure de départ</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Chauffeur</label>
            <input
              type="text"
              required
              value={formData.driver}
              onChange={(e) => setFormData({...formData, driver: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nom du chauffeur"
            />
          </div>
        </div>

        {/* Points de départ et d'arrivée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Point de départ</label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.useCooperativeAsStart}
                  onChange={(e) => setFormData({...formData, useCooperativeAsStart: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Utiliser le siège de la coopérative</span>
              </div>
              
              {!formData.useCooperativeAsStart && (
                <input
                  type="text"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Adresse de départ"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Point d'arrivée</label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.useCooperativeAsEnd}
                  onChange={(e) => setFormData({...formData, useCooperativeAsEnd: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Utiliser le siège de la coopérative</span>
              </div>
              
              {!formData.useCooperativeAsEnd && (
                <input
                  type="text"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Adresse d'arrivée"
                />
              )}
            </div>
          </div>
        </div>

        {/* Participants section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Accompagnants</h3>
          </div>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nom de l'accompagnant"
            />
            <button
              type="button"
              onClick={handleAddParticipant}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ajouter
            </button>
          </div>

          {formData.participants.length > 0 ? (
            <div className="space-y-2">
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{participant}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Aucun accompagnant ajouté</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Points d'arrêt</label>
            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => handleAddStop(e.target.value)}
                className="block w-64 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Ajouter un producteur</option>
                {activeProducers
                  .filter(p => !formData.stops.some(s => s.producerId === p.id))
                  .map(producer => (
                    <option key={producer.id} value={producer.id}>
                      {producer.fullName}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {formData.stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{getProducerName(stop.producerId)}</p>
                  <p className="text-sm text-gray-500">{stop.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStop(index)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {formData.stops.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun arrêt ajouté
              </div>
            )}
          </div>
        </div>

        {cooperative && selectedProducers.length > 0 && (
          <div>
            <RouteMap 
              producers={selectedProducers}
              cooperative={cooperative}
              showRoute={false}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {route ? 'Mettre à jour' : 'Créer la tournée'}
        </button>
      </div>
    </form>
  );
}