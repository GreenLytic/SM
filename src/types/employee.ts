import { EmployeeRole } from '../components/employees/EmployeeList';

export interface Employee {
  id?: string;
  name: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  startDate: Date;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeFormData {
  name: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  startDate: string;
  status: 'active' | 'inactive';
}