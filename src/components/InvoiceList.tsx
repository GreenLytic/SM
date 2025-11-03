import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice } from '../types/invoice';
import { Producer } from '../types/producer';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { format, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InvoiceService } from './InvoiceService';

type SortField = 'date' | 'totalAmount' | 'amountPaid';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'partial' | 'completed' | 'overdue';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    // Ensure invoices exist for all stocks
    const checkInvoices = async () => {
      console.log('Checking for missing invoices...');
      try {
        const createdCount = await InvoiceService.ensureInvoicesForAllStocks();
        console.log(`Created ${createdCount} new invoices`);
      } catch (error) {
        console.error('Error checking invoices:', error);
      }
    };
    
    checkInvoices();
    
    // Fetch producers
    const producersQuery = query(collection(db, 'producers'));
    const unsubscribeProducers = onSnapshot(producersQuery, (snapshot) => {
      const producerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate()
      })) as Producer[];
      setProducers(producerData);
    });

    // Fetch invoices
    const invoicesQuery = query(collection(db, 'invoices'), orderBy(sortField, sortOrder));
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const invoiceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        dueDate: doc.data().dueDate?.toDate()
      })) as Invoice[];
      setInvoices(invoiceData);
    });

    return () => {
      unsubscribeProducers();
      unsubscribeInvoices();
    };
  }, [sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getProducerName = (producerId: string) => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.fullName || 'Producteur inconnu';
  };

  const getStatusColor = (status: string, dueDate: Date) => {
    const isOverdue = isAfter(new Date(), dueDate) && status !== 'completed';
    if (isOverdue) return 'bg-red-100 text-red-700';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string, dueDate: Date) => {
    const isOverdue = isAfter(new Date(), dueDate) && status !== 'completed';
    if (isOverdue) return 'En retard';
    switch (status) {
      case 'pending': return 'En attente';
      case 'partial': return 'Partiel';
      case 'completed': return 'Payé';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = getProducerName(invoice.producerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ? true :
                         filterStatus === 'overdue' ? isAfter(new Date(), invoice.dueDate) && invoice.paymentStatus !== 'completed' :
                         invoice.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">Factures</h2>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes</option>
                  <option value="pending">En attente</option>
                  <option value="partial">Partielles</option>
                  <option value="completed">Payées</option>
                  <option value="overdue">En retard</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par producteur ou numéro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Date
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producteur
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('totalAmount')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Montant
                    {getSortIcon('totalAmount')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('amountPaid')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Payé
                    {getSortIcon('amountPaid')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {format(invoice.date, 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getProducerName(invoice.producerId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoice.totalAmount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoice.amountPaid.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {format(invoice.dueDate, 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.paymentStatus, invoice.dueDate)}`}>
                      {getStatusText(invoice.paymentStatus, invoice.dueDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <PDFDownloadLink
                      document={<InvoicePDF invoice={invoice} producerName={getProducerName(invoice.producerId)} />}
                      fileName={`facture_${invoice.invoiceNumber}.pdf`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </PDFDownloadLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}