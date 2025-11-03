import React, { useState } from 'react';
import { Collection } from '../types/collection';
import { Producer } from '../types/producer';
import { doc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Truck, Users, Calendar, Scale, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import QualityAssessmentForm from './QualityAssessmentForm';
import CollectionQualityCard from './CollectionQualityCard';
import { toast } from 'react-hot-toast';

interface CollectionDetailsProps {
  collection: Collection;
  producer: Producer | undefined;
  onClose: () => void;
}

export default function CollectionDetails({ collection, producer, onClose }: CollectionDetailsProps) {
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  const handleQualityAssessment = async (updatedData: Partial<Collection>) => {
    if (!collection.id) return;
    
    try {
      // Update collection with quality assessment data
      await updateDoc(doc(db, 'collections', collection.id), {
        ...updatedData,
        // Update quality based on calculated grade
        quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
      });
      
      // If this collection is linked to a stock, update the stock as well
      if (collection.stockId) {
        await updateDoc(doc(db, 'stocks', collection.stockId), {
          ...updatedData,
          // Update quality based on calculated grade
          quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                  updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
        });
      } else {
        // If no direct stockId link, try to find stocks that include this collection
        const stocksQuery = query(
          collection(db, 'stocks'), 
          where('collections', 'array-contains', collection.id)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        
        if (!stocksSnapshot.empty) {
          // Update each stock that contains this collection
          for (const stockDoc of stocksSnapshot.docs) {
            await updateDoc(doc(db, 'stocks', stockDoc.id), {
              ...updatedData,
              // Update quality based on calculated grade
              quality: updatedData.calculatedGrade === 'Grade I' ? 'A' : 
                      updatedData.calculatedGrade === 'Grade II' ? 'B' : 'C'
            });
          }
        }
      }
      
      toast.success('Évaluation de qualité enregistrée');
      setIsQualityModalOpen(false);
    } catch (error) {
      console.error('Error updating quality assessment:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'évaluation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Détails de la collecte
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Informations générales</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Date de collecte</p>
                <p className="text-sm text-gray-500">
                  {format(collection.date, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Producteur</p>
                <p className="text-sm text-gray-500">{producer?.fullName || 'Inconnu'}</p>
                {producer && (
                  <p className="text-xs text-gray-500 mt-1">{producer.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Quantité</p>
                <p className="text-sm text-gray-500">{collection.quantity} tonnes</p>
                <p className="text-sm text-gray-500">{collection.bagCount || 'N/A'} sacs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Droplets className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Humidité</p>
                <p className="text-sm text-gray-500">{collection.humidity}%</p>
                {collection.humidity > 7.5 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Taux d'humidité trop élevé. Séchage recommandé.
                  </p>
                )}
              </div>
            </div>
          </div>

          {collection.notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{collection.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <CollectionQualityCard 
            collection={collection}
            onAssessQuality={() => setIsQualityModalOpen(true)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>

      <Modal isOpen={isQualityModalOpen} onClose={() => setIsQualityModalOpen(false)}>
        <QualityAssessmentForm<Collection>
          data={collection}
          onSave={handleQualityAssessment}
          onClose={() => setIsQualityModalOpen(false)}
        />
      </Modal>
    </div>
  );
}