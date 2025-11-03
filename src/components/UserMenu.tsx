import React, { useState, useRef } from 'react';
import { Building2, Target, User, Users, Bell, LogOut } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import CooperativeForm from './cooperative/CooperativeForm';
import DashboardTargets from './dashboard/DashboardTargets';
import ProfileLogo from './ProfileLogo';
import EmployeeList from './employees/EmployeeList';
import { useStockNotifications } from '../hooks/useStockNotifications';

type ModalType = 'cooperative' | 'targets' | 'notifications' | 'profile' | 'employees' | null;

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { stockAlerts, confirmStockDrying, markAllAlertsAsViewed } = useStockNotifications();
  const [profileLogo, setProfileLogo] = useState<string>('');
  const navigate = useNavigate();

  const handleLogoUpdate = (newLogoUrl: string) => {
    setProfileLogo(newLogoUrl);
  };

  const handleModalClose = (type: ModalType) => {
    if (type === 'notifications') {
      markAllAlertsAsViewed();
    }
    setActiveModal(null);
  };

  const menuItems = [
    { 
      icon: Building2, 
      label: 'Coopérative', 
      action: () => setActiveModal('cooperative')
    },
    { 
      icon: Target, 
      label: 'Objectifs', 
      action: () => setActiveModal('targets')
    },
    { 
      icon: Bell,
      label: 'Notifications',
      action: () => setActiveModal('notifications'),
      badge: stockAlerts.length > 0 ? stockAlerts.length : undefined
    },
    { 
      icon: User, 
      label: 'Profil', 
      action: () => setActiveModal('profile')
    },
    { 
      icon: Users, 
      label: 'Employés', 
      action: () => setActiveModal('employees')
    }
  ];

  const getModalSize = (type: ModalType): 'sm' | 'md' | 'lg' | 'xl' => {
    switch (type) {
      case 'employees': return 'xl';
      case 'notifications': return 'lg';
      default: return 'md';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#1F3D13] hover:bg-[#2F5E1E] transition-colors"
      >
        {profileLogo ? (
          <img
            src={profileLogo}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-40">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <Modal 
        isOpen={activeModal !== null} 
        onClose={() => handleModalClose(activeModal)}
        size={getModalSize(activeModal)}
      >
        {activeModal === 'cooperative' && (
          <CooperativeForm onClose={() => handleModalClose('cooperative')} />
        )}
        {activeModal === 'targets' && (
          <DashboardTargets onClose={() => handleModalClose('targets')} standalone />
        )}
        {activeModal === 'notifications' && (
          <div className="p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
              {stockAlerts.length > 0 && (
                <button
                  onClick={markAllAlertsAsViewed}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            
            {stockAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {stockAlerts.map((alert, index) => (
                  <div 
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          Stock #{alert.stockNumber}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {alert.producerName} • Humidité: {alert.humidity}%
                        </p>
                      </div>
                      <button
                        onClick={() => confirmStockDrying(alert.stockId)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Confirmer séchage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeModal === 'profile' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Profil</h2>
            <ProfileLogo
              currentLogo={profileLogo}
              onLogoUpdate={handleLogoUpdate}
            />
          </div>
        )}
        {activeModal === 'employees' && (
          <EmployeeList />
        )}
      </Modal>
    </div>
  );
}