export interface PriceSettings {
  id?: string;
  basePrice: number;
  qualityPremiums: {
    A: number;
    B: number;
    C: number;
  };
  certifications: Array<{
    name: string;
    premium: number;
  }>;
  effectiveDate: Date;
  status: 'active' | 'inactive';
}

export interface Budget {
  id?: string;
  name: string;
  year: number;
  quarter: number;
  targetRevenue: number;
  targetProfit: number;
  expenses: BudgetExpense[];
  investments: BudgetInvestment[];
  status: 'draft' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  actualRevenue?: number;
  actualProfit?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startDate: Date;
  endDate: Date;
  actualRevenue?: number;
  actualProfit?: number;
}

export type BudgetCategory = 'operations' | 'salaries' | 'maintenance' | 'transport' | 'marketing' | 'other';

export interface BudgetExpense {
  category: BudgetCategory;
  description: string;
  amount: number;
}

export interface BudgetInvestment {
  description: string;
  amount: number;
  timeline: string;
}

export interface Transaction {
  id?: string;
  date: Date;
  type: 'purchase' | 'sale' | 'expense' | 'payment';
  description: string;
  amount: number;
  reference?: string;
  category?: string;
  debit: number;
  credit: number;
  balance: number;
}