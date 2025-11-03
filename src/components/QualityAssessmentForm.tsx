import React, { useState, useEffect } from 'react';
import { Collection } from '../types/collection';
import { StockEntry } from '../types/stock';
import { QualityAssessment, calculateGrade, GradingResult } from '../utils/qualityGrading';
import { AlertTriangle, Check, Info } from 'lucide-react';

interface QualityAssessmentFormProps<T extends Collection | StockEntry> {
  data: T;
  onSave: (updatedData: Partial<T>) => Promise<void>;
  onClose: () => void;
}

export default function QualityAssessmentForm<T extends Collection | StockEntry>({ 
  data, 
  onSave, 
  onClose 
}: QualityAssessmentFormProps<T>) {
  const [assessment, setAssessment] = useState<QualityAssessment>({
    mouldyBeans: data.mouldyBeans || 0,
    flatBeans: data.flatBeans || 0,
    violetBeans: data.violetBeans || 0,
    germinatedBeans: data.germinatedBeans || 0,
    insectDamagedBeans: data.insectDamagedBeans || 0,
    foreignMatter: data.foreignMatter || 0,
    humidity: data.humidity || 0
  });
  
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate grade whenever assessment changes
  useEffect(() => {
    const result = calculateGrade(assessment);
    setGradingResult(result);
  }, [assessment]);

  const handleInputChange = (field: keyof QualityAssessment, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAssessment(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingResult) return;

    // Check if we're updating a stock that was combined from other stocks
    const isCombinedStock = 'combinedIntoStock' in data && data.combinedIntoStock;
    
    try {
      setIsSubmitting(true);
      
      // Prepare updated data
      const updatedData: Partial<T> = {
        mouldyBeans: assessment.mouldyBeans,
        flatBeans: assessment.flatBeans,
        violetBeans: assessment.violetBeans,
        germinatedBeans: assessment.germinatedBeans,
        insectDamagedBeans: assessment.insectDamagedBeans,
        foreignMatter: assessment.foreignMatter,
        humidity: assessment.humidity,
        calculatedGrade: gradingResult.grade,
        qualityNotes: gradingResult.comments
      } as Partial<T>;
      
      await onSave(updatedData);

      // If this is a combined stock, we don't need to do anything else
      if (isCombinedStock) {
        onClose();
        return;
      }

      onClose();
    } catch (error) {
      console.error('Error saving quality assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'Grade I': return 'bg-green-100 text-green-800 border-green-200';
      case 'Grade II': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Refusé': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Info className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Évaluation de la qualité
        </h2>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Normes d'évaluation</p>
            <p className="text-xs text-blue-700 mt-1">
              Les grades sont attribués automatiquement selon les standards internationaux (ISO 2451, ICCO, Codinorm Côte d'Ivoire).
              Veuillez saisir les pourcentages de défauts observés.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fèves moisies (%)
            <span className="text-xs text-gray-500 ml-2">Norme Grade I: ≤ 3%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.mouldyBeans}
            onChange={(e) => handleInputChange('mouldyBeans', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fèves plates/ardoisées (%)
            <span className="text-xs text-gray-500 ml-2">Norme Grade I: ≤ 3%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.flatBeans}
            onChange={(e) => handleInputChange('flatBeans', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fèves violettes (%)
            <span className="text-xs text-gray-500 ml-2">Incluses dans plates</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.violetBeans}
            onChange={(e) => handleInputChange('violetBeans', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fèves germées (%)
            <span className="text-xs text-gray-500 ml-2">Norme Grade I: ≤ 3%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.germinatedBeans}
            onChange={(e) => handleInputChange('germinatedBeans', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fèves insectées (%)
            <span className="text-xs text-gray-500 ml-2">Norme Grade I: ≤ 3%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.insectDamagedBeans}
            onChange={(e) => handleInputChange('insectDamagedBeans', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Corps étrangers/débris (%)
            <span className="text-xs text-gray-500 ml-2">Norme Grade I: ≤ 0.75%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={assessment.foreignMatter}
            onChange={(e) => handleInputChange('foreignMatter', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Humidité (%)
            <span className="text-xs text-gray-500 ml-2">Norme: ≤ 7.5%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={assessment.humidity}
            onChange={(e) => handleInputChange('humidity', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {gradingResult && (
        <div className={`p-4 rounded-lg border ${getGradeBadgeColor(gradingResult.grade)}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">
                Grade attribué: {gradingResult.grade}
              </h3>
              <p className="text-sm mt-1">{gradingResult.comments}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${getGradeBadgeColor(gradingResult.grade)}`}>
              {gradingResult.grade}
            </div>
          </div>

          {gradingResult.failedCriteria.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Critères non conformes:</p>
              <ul className="list-disc list-inside text-sm mt-1">
                {gradingResult.failedCriteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}

          {gradingResult.warnings.length > 0 && (
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Alertes:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {gradingResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

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
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Enregistrer l'évaluation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}