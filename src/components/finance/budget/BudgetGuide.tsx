import React from 'react';
import { FileText, DollarSign, TrendingUp, Calculator, BarChart, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { OpenAIService } from '../../../services/ai/openaiService';
import { toast } from 'react-hot-toast';

export default function BudgetGuide() {
  const [aiAdvice, setAiAdvice] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const generateAiAdvice = async () => {
    setIsGeneratingAdvice(true);
    try {
      const advice = await OpenAIService.generateBudgetAnalysis({
        type: 'guide',
        context: 'cooperative_agricole'
      });
      setAiAdvice(advice);
    } catch (error) {
      console.error('Error generating AI advice:', error);
      toast.error("Erreur lors de la génération des conseils IA");
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-2">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Guide du budget prévisionnel
        </h2>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700">
          Établir un <strong>budget prévisionnel</strong> est une étape essentielle pour anticiper les revenus, 
          maîtriser les dépenses, assurer la rentabilité et guider les décisions financières de votre coopérative.
        </p>
      </div>

      {/* AI-powered advice section */}
      <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100 my-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-indigo-800">Conseils personnalisés IA</h3>
        </div>
        
        {!aiAdvice && !isGeneratingAdvice ? (
          <div className="text-center py-4">
            <p className="text-indigo-700 mb-4">
              Obtenez des conseils budgétaires personnalisés générés par intelligence artificielle.
            </p>
            <button
              onClick={generateAiAdvice}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer des conseils IA</span>
            </button>
          </div>
        ) : isGeneratingAdvice ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-700">Génération de conseils personnalisés en cours...</p>
          </div>
        ) : (
          <div className="prose max-w-none text-indigo-700">
            {aiAdvice.split('\n').map((paragraph, index) => (
              <p key={index} className="text-indigo-700">{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">1. Définir la période</h3>
          </div>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Généralement sur <strong>12 mois</strong> (annuel)</li>
            <li>• Peut être <strong>trimestriel</strong> ou <strong>mensuel</strong></li>
            <li>• Exemple : Budget prévisionnel de janvier à décembre 2025</li>
          </ul>
        </div>

        <div className="bg-green-50 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-800">2. Estimer les recettes</h3>
          </div>
          <ul className="text-sm text-green-700 space-y-2">
            <li>• <strong>Ventes attendues</strong> : produits, quantités, prix</li>
            <li>• <strong>Autres revenus</strong> : subventions, aides</li>
            <li>• Utiliser les données historiques si disponibles</li>
            <li>• Être réaliste dans les estimations</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-amber-600" />
            <h3 className="font-medium text-amber-800">3. Lister les charges</h3>
          </div>
          <ul className="text-sm text-amber-700 space-y-2">
            <li>• <strong>Charges fixes</strong> : loyer, salaires, assurances</li>
            <li>• <strong>Charges variables</strong> : matières premières, transport</li>
            <li>• <strong>Charges exceptionnelles</strong> : investissements</li>
            <li>• Inclure les amortissements si applicable</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-purple-800">4. Calculer le résultat prévisionnel</h3>
          </div>
          <div className="space-y-3 text-sm text-purple-700">
            <p>Formule de base :</p>
            <div className="bg-white p-3 rounded border border-purple-200 font-mono">
              Résultat = Total des recettes - Total des dépenses
            </div>
            <ul className="space-y-1">
              <li>• <strong>Résultat positif</strong> = bénéfice prévisionnel</li>
              <li>• <strong>Résultat négatif</strong> = déficit prévisionnel à corriger</li>
            </ul>
          </div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-medium text-indigo-800">5. Analyser et ajuster</h3>
          </div>
          <ul className="text-sm text-indigo-700 space-y-2">
            <li>• Vérifier si l'entreprise est <strong>viable et rentable</strong></li>
            <li>• Réduire certaines charges si nécessaire</li>
            <li>• Prévoir un <strong>scénario optimiste, réaliste et pessimiste</strong></li>
            <li>• Suivre régulièrement l'exécution du budget</li>
            <li>• Ajuster en fonction des résultats réels</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-3">Exemple de tableau synthétique</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mois</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recettes (FCFA)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dépenses (FCFA)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solde mensuel (FCFA)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solde cumulé (FCFA)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm text-gray-900">Janvier</td>
                <td className="px-4 py-2 text-sm text-gray-900">5 000 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">3 500 000</td>
                <td className="px-4 py-2 text-sm text-green-600">+1 500 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">1 500 000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm text-gray-900">Février</td>
                <td className="px-4 py-2 text-sm text-gray-900">6 000 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">4 000 000</td>
                <td className="px-4 py-2 text-sm text-green-600">+2 000 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">3 500 000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm text-gray-900">Mars</td>
                <td className="px-4 py-2 text-sm text-gray-900">4 500 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">5 000 000</td>
                <td className="px-4 py-2 text-sm text-red-600">-500 000</td>
                <td className="px-4 py-2 text-sm text-gray-900">3 000 000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => window.location.href = '/finance/budget'}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>Créer votre budget prévisionnel</span>
        </button>
      </div>
    </div>
  );
}