import React from 'react';
import { Bell } from 'lucide-react';
import { useStockNotifications } from '../hooks/useStockNotifications';
import Modal from './Modal';

interface NotificationBellProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function NotificationBell({ isOpen, onToggle }: NotificationBellProps) {
  const { stockAlerts, confirmStockDrying, markAllAlertsAsViewed } = useStockNotifications();

  // When the modal is closed, mark all alerts as viewed
  const handleClose = () => {
    markAllAlertsAsViewed();
    onToggle();
  };

  return (
    <>
      <button 
        onClick={onToggle}
        className="p-2 hover:bg-[#1F3D13] rounded-lg relative"
      >
        <Bell className="w-6 h-6 text-white" />
        {stockAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {stockAlerts.length}
          </span>
        )}
      </button>

      <Modal isOpen={isOpen} onClose={handleClose}>
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
      </Modal>
    </>
  );
}