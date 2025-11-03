import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../Sidebar';
import UserMenu from '../UserMenu';
import NotificationBell from '../NotificationBell';

// Lightweight loading component for content
const ContentLoader = () => (
  <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5E1E]"></div>
  </div>
);

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="fixed top-0 left-0 right-0 bg-[#2F5E1E] border-b border-[#1F3D13] z-30">
        <div className="px-4 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#1F3D13] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">SMARTCOOP</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell 
              isOpen={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
            />
            <UserMenu />
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} />

      <main className={`transition-all duration-300 pt-16 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}