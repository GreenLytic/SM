export interface Producer {
  id?: string;
  fullName: string;
  cni?: string;
  email: string;
  phone: string;
  address: string;
  coordinates: [number, number];
  cultivatedArea: number;
  estimatedProduction: number;
  joinDate: Date;
  lastVisit?: Date;
  nextVisit?: Date;
  technicalRecommendations: TechnicalRecommendation[];
  inputs: InputDistribution[];
  rating: number;
  status: 'active' | 'inactive';
}

export interface TechnicalRecommendation {
  id?: string;
  date: Date;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface InputDistribution {
  id?: string;
  date: Date;
  inputType: string;
  quantity: number;
  unitPrice: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  amountPaid: number;
}