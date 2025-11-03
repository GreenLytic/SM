import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockEntry } from '../types/stock';
import { Producer } from '../types/producer';
import { PaymentRecord } from '../types/invoice';
import { InvoiceService } from './InvoiceService'; 
import { toast } from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { updateStockValue } from '../services/financeService';

interface StockPaymentFormProps {
  onClose: () => void;
  entry: StockEntry | null;
  producerName: string;
}

export default function StockPaymentForm({ onClose, entry, producerName }: StockPaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [producer, setProducer] = useState<Producer | null>(null);

  useEffect(() => {
    const fetchProducer = async () => {
      if (entry?.producerId) {
        const producerDoc = await getDoc(doc(db, 'producers', entry.producerId));
        if (producerDoc.exists()) {
          setProducer({ id: producerDoc.id, ...producerDoc.data() } as Producer);
        }
      }
    };
    fetchProducer();
  }, [entry]);

  if (!entry) return null;

  const remainingAmount = entry.totalCost - entry.amountPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    if (amount > remainingAmount) {
      toast.error('Le montant ne peut pas dépasser le solde restant');
      return;
    }

    try {
      setIsSubmitting(true);

      if (!entry.id) {
        throw new Error('Stock ID is missing');
      }

      // Create payment record
      const payment: PaymentRecord = {
        date: new Date(),
        amount: amount,
        method: paymentMethod, 
        reference: reference || '',
        notes: notes || ''
      };

      // Record payment in invoice and update stock
      await InvoiceService.recordPayment(entry.id, payment);

      console.log('Payment recorded successfully'); 

      toast.success('Paiement enregistré avec succès'); 
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Wallet className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Enregistrer un paiement
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Producteur</label>
          <p className="mt-1 text-sm text-gray-900">{producer?.fullName || 'Chargement...'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Montant total</label>
            <p className="mt-1 text-sm text-gray-900">{entry.totalCost.toLocaleString()} FCFA</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Montant déjà payé</label>
            <p className="mt-1 text-sm text-gray-900">{entry.amountPaid.toLocaleString()} FCFA</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reste à payer</label>
            <p className="mt-1 text-sm font-medium text-red-600">{remainingAmount.toLocaleString()} FCFA</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Montant du paiement
          </label>
          <input
            type="number"
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            max={remainingAmount}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Méthode de paiement
          </label>
          <select
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentRecord['method'])}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="cash">Espèces</option>
            <option value="bank_transfer">Virement bancaire</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Référence
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Numéro de transaction, chèque, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

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
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Enregistrement...</span>
            </>
          ) : (
            <span>Enregistrer le paiement</span>
          )}
        </button>
      </div>
    </form>
  );
}