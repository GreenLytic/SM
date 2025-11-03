import React, { useState } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CollectionRoute, RouteStop } from '../../types/route';
import { Producer } from '../../types/producer';
import { MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import RouteCompletionForm from './RouteCompletionForm';

interface RouteActionsProps {
  route: CollectionRoute;
  onEdit: () => void;
  producers: Producer[];
}

export default function RouteActions({ route, onEdit, producers }: RouteActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const handleRouteCompletion = async (updatedStops: RouteStop[]) => {
    if (!route.id || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // Validate that all stops have a status
      const invalidStops = updatedStops.filter(stop => 
        stop.status !== 'completed' && stop.status !== 'cancelled'
      );
      
      if (invalidStops.length > 0) {
        toast.error('Tous les arrêts doivent être complétés ou annulés');
        return;
      }

      // Update route status and stops
      await updateDoc(doc(db, 'routes', route.id), {
        status: 'completed',
        completedAt: new Date(),
        stops: updatedStops
      });

      toast.success('Tournée terminée avec succès');
      setShowCompletionForm(false);
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Une erreur est survenue lors de la mise à jour de la tournée');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: CollectionRoute['status']) => {
    if (!route.id || isProcessing) return;

    try {
      setIsProcessing(true);

      if (newStatus === 'completed') {
        setShowCompletionForm(true);
      } else {
        await updateDoc(doc(db, 'routes', route.id), {
          status: newStatus
        });
        toast.success('Statut de la tournée mis à jour');
      }

      setShowMenu(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={isProcessing}
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button
                onClick={onEdit}
                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Modifier
              </button>
              {route.status === 'planned' && (
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  disabled={isProcessing}
                >
                  Démarrer la tournée
                </button>
              )}
              {route.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  disabled={isProcessing}
                >
                  Terminer la tournée
                </button>
              )}
              {route.status !== 'cancelled' && route.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                  disabled={isProcessing}
                >
                  Annuler la tournée
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={showCompletionForm} 
        onClose={() => setShowCompletionForm(false)}
      >
        <RouteCompletionForm
          route={route}
          producers={producers}
          onClose={() => setShowCompletionForm(false)}
          onSubmit={handleRouteCompletion}
        />
      </Modal>
    </>
  );
}