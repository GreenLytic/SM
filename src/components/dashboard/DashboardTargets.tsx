import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Target, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TargetData {
  producers: number;
  production: number;
}

interface DashboardTargetsProps {
  onClose?: () => void;
  standalone?: boolean;
}

export default function DashboardTargets({ onClose, standalone = false }: DashboardTargetsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [targets, setTargets] = useState<TargetData>({
    producers: 0,
    production: 0
  });
  const [newTargets, setNewTargets] = useState<TargetData>({
    producers: 0,
    production: 0
  });

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const targetDoc = await getDoc(doc(db, 'targets', 'current'));
        if (targetDoc.exists()) {
          const data = targetDoc.data() as TargetData;
          setTargets(data);
          setNewTargets(data);
        } else {
          const defaultTargets = {
            producers: 100,
            production: 1000
          };
          await setDoc(doc(db, 'targets', 'current'), defaultTargets);
          setTargets(defaultTargets);
          setNewTargets(defaultTargets);
        }
      } catch (error) {
        console.error('Error fetching targets:', error);
        toast.error('Erreur lors du chargement des objectifs');
      }
    };

    fetchTargets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newTargets.producers < 0 || newTargets.production < 0) {
        toast.error('Les valeurs doivent être positives');
        return;
      }

      await setDoc(doc(db, 'targets', 'current'), newTargets);
      setTargets(newTargets);
      setIsEditing(false);
      toast.success('Objectifs mis à jour avec succès');
      if (standalone && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating targets:', error);
      toast.error('Erreur lors de la mise à jour des objectifs');
    }
  };

  return (
    <div className={`bg-white rounded-lg p-6 ${!standalone && 'shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-gray-900 font-medium">Objectifs</h3>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isEditing ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de producteurs cible
            </label>
            <input
              type="number"
              min="0"
              value={newTargets.producers}
              onChange={(e) => setNewTargets({ ...newTargets, producers: Math.max(0, parseInt(e.target.value) || 0) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tonnage cible (tonnes)
            </label>
            <input
              type="number"
              min="0"
              value={newTargets.production}
              onChange={(e) => setNewTargets({ ...newTargets, production: Math.max(0, parseInt(e.target.value) || 0) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            {standalone && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fermer
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enregistrer
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Producteurs</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">{targets.producers}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Production</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">{targets.production} tonnes</span>
          </div>

          {standalone && (
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}