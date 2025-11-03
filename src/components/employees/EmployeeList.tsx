import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import Modal from '../Modal';
import EmployeeForm from './EmployeeForm';
import { useEmployees } from '../../hooks/useEmployees';
import { Employee } from '../../types/employee';

export type EmployeeRole = 
  | 'ADG' 
  | 'Magasinier' 
  | 'Gardien' 
  | 'Gérant' 
  | 'Comptable' 
  | 'Assistant';

export default function EmployeeList() {
  const { employees, isLoading, createEmployee } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRoleColor = (role: EmployeeRole): string => {
    switch (role) {
      case 'ADG': return 'bg-purple-100 text-purple-800';
      case 'Magasinier': return 'bg-blue-100 text-blue-800';
      case 'Gardien': return 'bg-green-100 text-green-800';
      case 'Gérant': return 'bg-orange-100 text-orange-800';
      case 'Comptable': return 'bg-yellow-100 text-yellow-800';
      case 'Assistant': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddEmployee = async (employeeData: any) => {
    try {
      await createEmployee(employeeData);
      setIsModalOpen(false);
    } catch (error) {
      // Error is handled by the service
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des employés</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <UserPlus className="w-5 h-5" />
          <span>Ajouter un employé</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['ADG', 'Magasinier', 'Gardien', 'Gérant', 'Comptable', 'Assistant'].map((role) => (
          <div key={role} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">{role}</h3>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role as EmployeeRole)}`}>
                {employees.filter(e => e.role === role && e.status === 'active').length} actif(s)
              </span>
            </div>
            <div className="space-y-2">
              {employees
                .filter(e => e.role === role)
                .map(employee => (
                  <div key={employee.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">{employee.name}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <EmployeeForm 
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddEmployee}
        />
      </Modal>
    </div>
  );
}