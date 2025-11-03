import React from 'react';
import { Collection } from '../types/collection';
import { AlertTriangle, Check, FileText } from 'lucide-react';

interface CollectionQualityCardProps {
  collection: Collection;
  onAssessQuality: () => void;
}

export default function CollectionQualityCard({ collection, onAssessQuality }: CollectionQualityCardProps) {
  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'Grade I': return 'bg-green-100 text-green-800 border-green-200';
      case 'Grade II': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Refusé': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasQualityAssessment = collection.calculatedGrade !== undefined;

  return (
    <div className={`p-4 rounded-lg border ${
      hasQualityAssessment ? getGradeColor(collection.calculatedGrade) : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900">Évaluation de la qualité</h3>
        {hasQualityAssessment && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(collection.calculatedGrade)}`}>
            {collection.calculatedGrade}
          </span>
        )}
      </div>

      {hasQualityAssessment ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Fèves moisies:</p>
              <p className="font-medium">{collection.mouldyBeans?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Fèves plates:</p>
              <p className="font-medium">{collection.flatBeans?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Fèves germées:</p>
              <p className="font-medium">{collection.germinatedBeans?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Fèves insectées:</p>
              <p className="font-medium">{collection.insectDamagedBeans?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Corps étrangers:</p>
              <p className="font-medium">{collection.foreignMatter?.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-gray-500">Humidité:</p>
              <p className="font-medium">{collection.humidity?.toFixed(1)}%</p>
            </div>
          </div>

          {collection.humidity > 7.5 && (
            <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-md">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">
                Taux d'humidité trop élevé. Séchage recommandé avant exportation.
              </p>
            </div>
          )}

          {collection.qualityNotes && (
            <p className="text-sm text-gray-600">{collection.qualityNotes}</p>
          )}

          <button
            onClick={onAssessQuality}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            Mettre à jour l'évaluation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Aucune évaluation de qualité n'a été effectuée pour cette collecte.
          </p>
          <button
            onClick={onAssessQuality}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Évaluer la qualité
          </button>
        </div>
      )}
    </div>
  );
}