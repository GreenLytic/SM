import React from 'react';
import { Users, Truck, Package, Coins, Settings, FileText, BarChart, Receipt, LayoutDashboard, MapPin } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
    { icon: Users, label: 'Producteurs', path: '/producteurs' },
    { icon: MapPin, label: 'Ramassage', path: '/ramassage' },
    { icon: Truck, label: 'Collecte', path: '/collecte' },
    { icon: Package, label: 'Stocks', path: '/stocks' },
    { icon: Truck, label: 'Livraisons', path: '/livraisons' },
    { icon: Coins, label: 'Finance', path: '/finance' },
    { icon: Receipt, label: 'Factures', path: '/factures' },
    { icon: BarChart, label: 'Rapports', path: '/rapports' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' }
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#2F5E1E] transition-all duration-300 ease-in-out z-20 overflow-y-auto ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-[#1F3D13] text-white shadow-md' 
                  : 'text-white hover:bg-[#1F3D13]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}