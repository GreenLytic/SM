export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  producerId: string;
  stockId: string;
  stockNumber: string;
  quantity: number;
  quality: 'A' | 'B' | 'C';
  basePrice: number;
  qualityPremium: number;
  certificationPremiums: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  paymentHistory: PaymentRecord[];
  notes?: string;
}

export interface PaymentRecord {
  date: Date;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  reference?: string;
  notes?: string;
}

export interface InvoiceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number;
}