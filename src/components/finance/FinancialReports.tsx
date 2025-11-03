import React from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { Budget } from '../../types/finance';

interface AssetsSummary {
  stockValue: number;
  workingCapital: number;
  totalSales: number;
  totalProfit: number;
  deliveryLosses: number;
  netAssetValue: number;
}

export default function FinancialReports() {
  const [assetsSummary, setAssetsSummary] = React.useState<AssetsSummary>({
    stockValue: 0,
    workingCapital: 0,
    totalSales: 0,
    totalProfit: 0,
    deliveryLosses: 0,
    netAssetValue: 0
  });

  React.useEffect(() => {
    const fetchAssetsData = async () => {
      try {
        // Fetch stocks value
        const stocksQuery = query(collection(db, 'stocks'));
        const stocksSnapshot = await getDocs(stocksQuery);
        const stockValue = stocksSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.totalCost || 0);
        }, 0);

        // Fetch working capital from current budget
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

        const budgetsQuery = query(collection(db, 'budgets'));
        const budgetsSnapshot = await getDocs(budgetsQuery);
        
        const currentBudgets = budgetsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Budget)
          .filter(budget => 
            budget.year === currentYear && 
            budget.quarter === currentQuarter
          );
        
        const workingCapital = currentBudgets.reduce((sum, budget) => 
          sum + (budget.investments || []).reduce((invSum, inv) => invSum + inv.amount, 0), 0);

        // Fetch completed deliveries
        const deliveriesQuery = query(
          collection(db, 'deliveryOrders'),
          where('status', '==', 'completed')
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        
        let totalSales = 0;
        let totalProfit = 0;
        let deliveryLosses = 0;

        deliveriesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const costs = data.costs || {};
          
          totalSales += costs.sellingPrice || 0;
          
          const profit = costs.profit || 0;
          if (profit >= 0) {
            totalProfit += profit;
          } else {
            deliveryLosses += Math.abs(profit);
          }
        });

        // Calcul correct de l'actif net: Fond de roulement + Ventes - Stocks
        const netAssetValue = workingCapital + totalSales - stockValue;

        setAssetsSummary({
          stockValue,
          workingCapital,
          totalSales,
          totalProfit,
          deliveryLosses,
          netAssetValue
        });

      } catch (error) {
        console.error('Error fetching assets data:', error);
      }
    };

    fetchAssetsData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Valeur des stocks</p>
            <p className="text-2xl font-semibold text-gray-900">
              {assetsSummary.stockValue.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fond de roulement</p>
            <p className="text-2xl font-semibold text-gray-900">
              {assetsSummary.workingCapital.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Actif Net</p>
            <p className="text-2xl font-semibold text-gray-900">
              {assetsSummary.netAssetValue.toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Bilan Financier</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-base font-medium text-gray-700 mb-4">Actifs</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fond de roulement</span>
                  <span className="font-medium">{assetsSummary.workingCapital.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ventes</span>
                  <span className="font-medium">{assetsSummary.totalSales.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Stocks (valeur négative)</span>
                  <span className="font-medium text-red-600">-{assetsSummary.stockValue.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bénéfices</span>
                  <span className="font-medium text-green-600">{assetsSummary.totalProfit.toLocaleString()} FCFA</span>
                </div>
                {assetsSummary.deliveryLosses > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pertes sur livraisons</span>
                    <span className="font-medium text-red-600">-{assetsSummary.deliveryLosses.toLocaleString()} FCFA</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-base font-medium text-gray-700 mb-4">Résumé</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-gray-900">Actif Net</span>
                  <span className="font-medium text-green-600">
                    {assetsSummary.netAssetValue.toLocaleString()} FCFA
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Calculé comme : Fond de roulement + Ventes - Stocks
                </p>
              </div>

              <div className="mt-6">
                <h4 className="text-base font-medium text-gray-700 mb-4">Indicateurs de performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600">Marge brute</p>
                    <p className="text-lg font-bold text-blue-600">
                      {assetsSummary.totalSales > 0 
                        ? ((assetsSummary.totalProfit / assetsSummary.totalSales) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600">Rentabilité</p>
                    <p className="text-lg font-bold text-blue-600">
                      {assetsSummary.workingCapital > 0
                        ? ((assetsSummary.totalProfit / assetsSummary.workingCapital) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}