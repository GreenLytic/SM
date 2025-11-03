import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockEntry } from '../types/stock';
import { DollarSign, CreditCard, Clock, Wallet } from 'lucide-react';

interface PaymentSummary {
  totalValue: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
  paidAmount: number;
  pendingAmount: number;
}

export default function PaymentStats() {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalValue: 0,
    completedPaymentsCount: 0,
    pendingPaymentsCount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    // Only query stocks that are not combined into other stocks
    const q = query(
      collection(db, 'stocks')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter out combined stocks in memory to avoid complex queries
      const stocks = snapshot.docs
        .map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
        .filter(stock => !stock.isCombined) as StockEntry[];

      const summary = stocks.reduce((acc, stock) => ({
        totalValue: acc.totalValue + stock.totalCost,
        completedPaymentsCount: acc.completedPaymentsCount + (stock.paymentStatus === 'completed' ? 1 : 0),
        pendingPaymentsCount: acc.pendingPaymentsCount + (stock.paymentStatus !== 'completed' ? 1 : 0),
        paidAmount: acc.paidAmount + stock.amountPaid,
        pendingAmount: acc.pendingAmount + (stock.totalCost - stock.amountPaid)
      }), {
        totalValue: 0,
        completedPaymentsCount: 0,
        pendingPaymentsCount: 0,
        paidAmount: 0,
        pendingAmount: 0
      });

      setPaymentSummary(summary);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    {
      title: 'Valeur totale du stock',
      value: paymentSummary.totalValue,
      format: 'currency',
      icon: Wallet,
      iconColor: 'text-blue-600'
    },
    {
      title: 'Paiements effectués',
      value: paymentSummary.paidAmount,
      format: 'currency',
      icon: CreditCard,
      iconColor: 'text-green-600'
    },
    {
      title: 'Paiements en attente',
      value: paymentSummary.pendingAmount,
      format: 'currency',
      icon: Clock,
      iconColor: 'text-amber-600'
    },
    {
      title: 'Total des transactions',
      value: paymentSummary.completedPaymentsCount + paymentSummary.pendingPaymentsCount,
      format: 'number',
      suffix: ' transaction(s)',
      icon: DollarSign,
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`${stat.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">{stat.title}</h3>
              </div>
              <p className={`text-2xl font-bold ${stat.iconColor}`}>
                {stat.format === 'currency' 
                  ? `${stat.value.toLocaleString()} FCFA`
                  : `${stat.value}${stat.suffix || ''}`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition des paiements</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{
                width: `${(paymentSummary.paidAmount / paymentSummary.totalValue) * 100}%`,
              }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <span className="text-gray-600">Payé: </span>
              <span className="font-medium text-green-600">
                {((paymentSummary.paidAmount / paymentSummary.totalValue) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">En attente: </span>
              <span className="font-medium text-amber-600">
                {((paymentSummary.pendingAmount / paymentSummary.totalValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-600">Montant payé</p>
              <p className="text-lg font-bold text-green-600">
                {paymentSummary.paidAmount.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-600">Montant en attente</p>
              <p className="text-lg font-bold text-amber-600">
                {paymentSummary.pendingAmount.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}