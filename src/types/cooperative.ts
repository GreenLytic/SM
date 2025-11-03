import { CacaoRegion } from '../constants/regions';

export interface CooperativeFormData {
  cooperativeName: string;
  registrationNumber: string;
  region: CacaoRegion | '';
  department: string;
  village: string;
  phone: string;
  producersCount: number;
  certifications: string[];
  agrementNumber: string;
}

export interface RegisterCooperativeData extends CooperativeFormData {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'manager' | 'user';
}

export interface CooperativeInfo {
  name: string;
  logo?: string;
  location: string;
  coordinates: [number, number];
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNumber?: string;
  taxId?: string;
  certifications: string[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    swift: string;
  };
  legalRepresentative?: string;
}