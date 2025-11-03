import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Budget, BudgetExpense, BudgetInvestment, BudgetCategory } from '../../../types/finance';
import { FileText, DollarSign, TrendingUp, Plus, Save, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { OpenAIService } from '../../../services/ai/openaiService';

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvestmentStrategy, setShowInvestmentStrategy] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState('');
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  
  const [formData, setFormData] = useState<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    year: currentYear,
    quarter: currentQuarter,
    targetRevenue: 0,
    targetProfit: 0,
    expenses: [],
    investments: [],
    status: 'draft',
    startDate: new Date(currentYear, (currentQuarter - 1) * 3, 1),
    endDate: new Date(currentYear, currentQuarter * 3, 0)
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const q = query(collection(db, 'budgets'));
      const querySnapshot = await getDocs(q);
      const budgetList: Budget[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        budgetList.push({ 
          id: doc.id, 
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate()
        } as Budget);
      });
      setBudgets(budgetList.sort((a, b) => b.year - a.year || b.quarter - a.quarter));
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Erreur lors du chargement des budgets');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      toast.error('Le nom du budget est requis');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedBudget?.id) {
        // Update existing budget
        await updateDoc(doc(db, 'budgets', selectedBudget.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Budget mis à jour avec succès');
      } else {
        // Create new budget
        const budgetData = {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addDoc(collection(db, 'budgets'), budgetData);
        toast.success('Budget créé avec succès');
      }
      
      // Reset form and state
      setIsCreating(false);
      setIsEditing(false);
      setSelectedBudget(null);
      setFormData({
        name: '',
        year: currentYear,
        quarter: currentQuarter,
        targetRevenue: 0,
        targetProfit: 0,
        expenses: [],
        investments: [],
        status: 'draft',
        startDate: new Date(currentYear, (currentQuarter - 1) * 3, 1),
        endDate: new Date(currentYear, currentQuarter * 3, 0)
      });
      
      // Refresh budgets list
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Erreur lors de la création du budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { category: 'operations', description: '', amount: 0 }]
    }));
  };

  const updateExpense = (index: number, field: keyof BudgetExpense, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map((expense, i) => 
        i === index ? { ...expense, [field]: value } : expense
      )
    }));
  };

  const removeExpense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index)
    }));
  };

  const addInvestment = () => {
    setFormData(prev => ({
      ...prev,
      investments: [...prev.investments, { description: '', amount: 0, timeline: '' }]
    }));
  };

  const updateInvestment = (index: number, field: keyof BudgetInvestment, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      investments: prev.investments.map((investment, i) => 
        i === index ? { ...investment, [field]: value } : investment
      )
    }));
  };

  const removeInvestment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      investments: prev.investments.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalExpenses = () => {
    return (formData.expenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  };

  const calculateTotalInvestments = () => {
    return (formData.investments || []).reduce((sum, investment) => sum + (investment.amount || 0), 0);
  };

  const calculateBudgetTotalExpenses = (budget: Budget) => {
    return (budget.expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateBudgetTotalInvestments = (budget: Budget) => {
    return (budget.investments ?? []).reduce((sum, investment) => sum + investment.amount, 0);
  };

  const generateAiRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    try {
      const recommendations = await OpenAIService.generateInvestmentRecommendations(formData);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast.error("Erreur lors de la génération des recommandations IA");
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const formatQuarter = (quarter: number) => {
    return `T${quarter} ${currentYear}`;
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      name: budget.name || '',
      year: budget.year,
      quarter: budget.quarter,
      targetRevenue: budget.targetRevenue,
      targetProfit: budget.targetProfit,
      expenses: budget.expenses || [],
      investments: budget.investments || [],
      status: budget.status,
      startDate: budget.startDate,
      endDate: budget.endDate
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planification Budgétaire</h1>
          <p className="text-gray-600">Gérez vos budgets trimestriels et stratégies d'investissement</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Budget
        </button>
      </div>

      {/* Budget List */}
      <div className="grid gap-6">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{budget.name}</h3>
                <p className="text-gray-600">{formatQuarter(budget.quarter)}</p>
                <p className="text-sm text-gray-500">
                  {budget.startDate?.toLocaleDateString()} - {budget.endDate?.toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                budget.status === 'active' ? 'bg-green-100 text-green-800' :
                budget.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {budget.status === 'active' ? 'Actif' :
                 budget.status === 'completed' ? 'Terminé' : 'Brouillon'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus</p>
                  <p className="font-semibold">{(budget.targetRevenue || 0).toLocaleString()} FCFA</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dépenses</p>
                  <p className="font-semibold">{(calculateBudgetTotalExpenses(budget) || 0).toLocaleString()} FCFA</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Investissements</p>
                  <p className="font-semibold">{(calculateBudgetTotalInvestments(budget) || 0).toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleEditBudget(budget)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Solde: {((budget.targetRevenue || 0) - calculateBudgetTotalExpenses(budget) - calculateBudgetTotalInvestments(budget)).toLocaleString()} FCFA
                </span>
                {(budget.targetRevenue || 0) < (calculateBudgetTotalExpenses(budget) + calculateBudgetTotalInvestments(budget)) && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Déficit budgétaire</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Budget Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{isEditing ? 'Modifier le budget' : 'Créer un nouveau budget'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du budget
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Ex: Budget Marketing T1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Année
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trimestre
                  </label>
                  <select
                    value={formData.quarter}
                    onChange={(e) => setFormData(prev => ({ ...prev, quarter: Number(e.target.value) }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value={1}>T1 (Jan-Mar)</option>
                    <option value={2}>T2 (Avr-Juin)</option>
                    <option value={3}>T3 (Juil-Sep)</option>
                    <option value={4}>T4 (Oct-Déc)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Revenus totaux prévus (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.targetRevenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetRevenue: Number(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bénéfice prévu (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.targetProfit}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetProfit: Number(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Dépenses prévues</h3>
                  <button
                    type="button"
                    onClick={addExpense}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.expenses.map((expense, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <select
                      value={expense.category}
                      onChange={(e) => updateExpense(index, 'category', e.target.value as BudgetCategory)}
                      className="rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="operations">Opérations</option>
                      <option value="salaries">Salaires</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="transport">Transport</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Autre</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Description"
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Montant"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, 'amount', Number(e.target.value))}
                      className="rounded-md border border-gray-300 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))}
                {formData.expenses.length > 0 && (
                  <div className="flex justify-end text-sm font-medium text-gray-700 mt-2">
                    Total des dépenses: {calculateTotalExpenses().toLocaleString()} FCFA
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Stratégie d'investissement</h3>
                    <button
                      type="button"
                      onClick={() => setShowInvestmentStrategy(!showInvestmentStrategy)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showInvestmentStrategy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  {showInvestmentStrategy && (
                    <button
                      type="button"
                      onClick={addInvestment}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {showInvestmentStrategy && (
                  <>
                    {/* AI Recommendations */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-medium text-indigo-800">Recommandations IA</h4>
                      </div>
                      
                      {!aiRecommendations && !isGeneratingRecommendations ? (
                        <div className="text-center py-2">
                          <p className="text-sm text-indigo-700 mb-2">
                            Obtenez des recommandations d'investissement personnalisées.
                          </p>
                          <button
                            onClick={generateAiRecommendations}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mx-auto text-sm"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Générer des recommandations</span>
                          </button>
                        </div>
                      ) : isGeneratingRecommendations ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <p className="text-sm text-indigo-700">Génération en cours...</p>
                        </div>
                      ) : (
                        <div className="text-sm text-indigo-700">
                          {aiRecommendations.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-2">{paragraph}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {formData.investments.map((investment, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Description"
                          value={investment.description}
                          onChange={(e) => updateInvestment(index, 'description', e.target.value)}
                          className="rounded-md border border-gray-300 px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Montant"
                          value={investment.amount}
                          onChange={(e) => updateInvestment(index, 'amount', Number(e.target.value))}
                          className="rounded-md border border-gray-300 px-3 py-2"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Période d'utilisation"
                            value={investment.timeline}
                            onChange={(e) => updateInvestment(index, 'timeline', e.target.value)}
                            className="rounded-md border border-gray-300 px-3 py-2 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeInvestment(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.investments.length > 0 && (
                      <div className="flex justify-end text-sm font-medium text-gray-700 mt-2">
                        Total des investissements: {calculateTotalInvestments().toLocaleString()} FCFA
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Solde prévisionnel:</span>
                  <span className={`font-bold ${
                    (formData.targetRevenue || 0) - calculateTotalExpenses() - calculateTotalInvestments() >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((formData.targetRevenue || 0) - calculateTotalExpenses() - calculateTotalInvestments()).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedBudget(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Mettre à jour' : 'Créer le budget'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}