import { useState, useEffect } from 'react';
import { Employee, EmployeeFormData } from '../types/employee';
import { EmployeeService } from '../services/employee/employeeService';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = EmployeeService.subscribeToEmployees((updatedEmployees) => {
      setEmployees(updatedEmployees);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createEmployee = async (data: EmployeeFormData) => {
    return await EmployeeService.createEmployee(data);
  };

  const updateEmployee = async (id: string, data: Partial<EmployeeFormData>) => {
    return await EmployeeService.updateEmployee(id, data);
  };

  const deleteEmployee = async (id: string) => {
    return await EmployeeService.deleteEmployee(id);
  };

  return {
    employees,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
};