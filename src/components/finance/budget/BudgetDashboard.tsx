import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Budget, BudgetCategory } from '../../../types/finance';
import { DollarSign, TrendingUp, ArrowRight, BarChart, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { OpenAIService } from '../../../services/ai/openaiService';
import { toast } from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BudgetDashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showChartSection, setShowChartSection] = useState(true);
  const [showQuarterSection, setShowQuarterSection] = useState(true);
  const [showBudgetSection, setShowBudgetSection] = useState(true);
  const [aiInsights, setAiInsights] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, 'budgets'), where('year', '==', currentYear));
        const snapshot = await getDocs(q);
        const budgetData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate()
        })) as Budget[];
        
        setBudgets(budgetData);
      } catch (error) {
        console.error('Error fetching budgets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [currentYear]);

  const getCurrentQuarterBudget = () => {
    return budgets.find(b => b.quarter === currentQuarter);
  };

  const calculateTotalExpenses = (budget: Budget) => {
    return budget.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateTotalInvestments = (budget: Budget) => {
    return budget.investments.reduce((sum, investment) => sum + investment.amount, 0);
  };

  const getQuarterLabel = (quarter: number) => {
    return `T${quarter}`;
  };

  const generateAiInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const insights = await OpenAIService.generateQuarterlyInsights(budgets);
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast.error("Erreur lors de la génération des insights IA");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const getChartData = () => {
    const labels = [1, 2, 3, 4].map(q => getQuarterLabel(q));
    
    // Données de revenus cibles
    const targetRevenueData = labels.map((_, index) => {
      const quarter = index + 1;
      const budget = budgets.find(b => b.quarter === quarter);
      return budget ? budget.targetRevenue : 0;
    });
    
    // Données de revenus réels
    const actualRevenueData = labels.map((_, index) => {
      const quarter = index + 1;
      const budget = budgets.find(b => b.quarter === quarter);
      return budget ? (budget.actualRevenue || 0) : 0;
    });
    
    // Données de bénéfices cibles
    const targetProfitData = labels.map((_, index) => {
      const quarter = index + 1;
      const budget = budgets.find(b => b.quarter === quarter);
      return budget ? budget.targetProfit : 0;
    });
    
    // Données de bénéfices réels
    const actualProfitData = labels.map((_, index) => {
      const quarter = index + 1;
      const budget = budgets.find(b => b.quarter === quarter);
      return budget ? (budget.actualProfit || 0) : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Revenu prévu',
          data: targetRevenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Revenu réel',
          data: actualRevenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Bénéfice prévu',
          data: targetProfitData,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        },
        {
          label: 'Bénéfice réel',
          data: actualProfitData,
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    };
  };

  // Couleurs pour les catégories de dépenses
  const categoryColors: Record<BudgetCategory, string> = {
    'operations': '#3B82F6', // Bleu
    'salaries': '#EF4444',   // Rouge
    'maintenance': '#F59E0B', // Ambre
    'transport': '#10B981',   // Vert
    'marketing': '#8B5CF6',   // Violet
    'other': '#FF6B00'        // Orange
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Budget prévisionnel vs réel ${currentYear}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + ' FCFA';
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentBudget = getCurrentQuarterBudget();

  return (
    <div className="space-y-6">
      {/* AI Insights Section */}
      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <h3 className="text-lg font-medium text-indigo-900">Insights IA</h3>
          </div>
        </div>
        
        {!aiInsights && !isGeneratingInsights ? (
          <div className="text-center py-4">
            <p className="text-indigo-700 mb-4">
              Obtenez des insights budgétaires générés par intelligence artificielle.
            </p>
            <button
              onClick={generateAiInsights}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer des insights IA</span>
            </button>
          </div>
        ) : isGeneratingInsights ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-700">Génération d'insights en cours...</p>
          </div>
        ) : (
          <div className="prose max-w-none text-indigo-700">
            {aiInsights.split('\n').map((paragraph, index) => (
              <p key={index} className="text-indigo-700">{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Performance budgétaire {currentYear}</h3>
          </div>
          <button 
            onClick={() => setShowChartSection(!showChartSection)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showChartSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {showChartSection && (
          <div className="h-80">
            <Bar data={getChartData()} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Current Quarter Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Trimestre actuel</h3>
          </div>
          <button 
            onClick={() => setShowQuarterSection(!showQuarterSection)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showQuarterSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {showQuarterSection && (
          currentBudget ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Période</p>
                <p className="font-medium">
                  {format(currentBudget.startDate, 'dd MMM', { locale: fr })} - {format(currentBudget.endDate, 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Revenu prévu</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentBudget.targetRevenue.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bénéfice prévu</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentBudget.targetProfit.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">Progression du revenu</p>
                  <p className="text-sm font-medium">
                    {currentBudget.actualRevenue ? 
                      `${Math.round((currentBudget.actualRevenue / currentBudget.targetRevenue) * 100)}%` : 
                      '0%'}
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ 
                      width: `${currentBudget.actualRevenue ? 
                        Math.min(100, (currentBudget.actualRevenue / currentBudget.targetRevenue) * 100) : 
                        0}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">Progression du bénéfice</p>
                  <p className="text-sm font-medium">
                    {currentBudget.actualProfit ? 
                      `${Math.round((currentBudget.actualProfit / currentBudget.targetProfit) * 100)}%` : 
                      '0%'}
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 transition-all"
                    style={{ 
                      width: `${currentBudget.actualProfit ? 
                        Math.min(100, (currentBudget.actualProfit / currentBudget.targetProfit) * 100) : 
                        0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="w-12 h-12 text-gray-300 mb-2 flex-shrink-0" />
              <p className="text-gray-500 mb-4">Aucun budget défini pour ce trimestre</p>
              <button
                onClick={() => window.location.href = '/finance/budget'}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Créer un budget</span>
              </button>
            </div>
          )
        )}
      </div>

      {budgets.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Résumé des budgets {currentYear}</h3>
            </div>
            <button 
              onClick={() => setShowBudgetSection(!showBudgetSection)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showBudgetSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {showBudgetSection && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trimestre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenu prévu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenu réel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéfice prévu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéfice réel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dépenses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investissements</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3, 4].map(quarter => {
                    const budget = budgets.find(b => b.quarter === quarter);
                    
                    return (
                      <tr key={quarter} className={quarter === currentQuarter ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {getQuarterLabel(quarter)} {currentYear}
                            </div>
                            {quarter === currentQuarter && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Actuel
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budget ? budget.targetRevenue.toLocaleString() : '-'} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {budget && budget.actualRevenue ? (
                            <span className={budget.actualRevenue >= budget.targetRevenue ? 'text-green-600' : 'text-amber-600'}>
                              {budget.actualRevenue.toLocaleString()} FCFA
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budget ? budget.targetProfit.toLocaleString() : '-'} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {budget && budget.actualProfit ? (
                            <span className={budget.actualProfit >= budget.targetProfit ? 'text-green-600' : 'text-red-600'}>
                              {budget.actualProfit.toLocaleString()} FCFA
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budget ? calculateTotalExpenses(budget).toLocaleString() : '-'} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budget ? calculateTotalInvestments(budget).toLocaleString() : '-'} FCFA
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}