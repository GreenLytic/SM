import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import MainLayout from './components/layout/MainLayout';

// Use a lightweight loading component for initial render
const LightLoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-[#F8F9FA]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5E1E]"></div>
  </div>
);

// Lazy load all components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ProducerList = lazy(() => import('./components/ProducerList'));
const CollectionList = lazy(() => import('./components/CollectionList'));
const StockList = lazy(() => import('./components/StockList'));
const DeliveryList = lazy(() => import('./components/DeliveryList'));
const FinanceModule = lazy(() => import('./components/finance/FinanceModule'));
const DeliveryReports = lazy(() => import('./components/reports/DeliveryReports'));
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const RouteList = lazy(() => import('./components/routes/RouteList'));
const SettingsModule = lazy(() => import('./components/SettingsModule'));

function App() {

  return (
    <SupabaseAuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={
              <Suspense fallback={<LightLoadingFallback />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="producteurs" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <ProducerList />
              </Suspense>
            } />
            <Route path="ramassage" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <RouteList />
              </Suspense>
            } />
            <Route path="collecte" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <CollectionList />
              </Suspense>
            } />
            <Route path="stocks" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <StockList />
              </Suspense>
            } />
            <Route path="livraisons" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <DeliveryList />
              </Suspense>
            } />
            <Route path="finance" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <FinanceModule />
              </Suspense>
            } />
            <Route path="factures" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <InvoiceList />
              </Suspense>
            } />
            <Route path="rapports" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <DeliveryReports />
              </Suspense>
            } />
            <Route path="parametres" element={
              <Suspense fallback={<LightLoadingFallback />}>
                <SettingsModule />
              </Suspense>
            } />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </SupabaseAuthProvider>
  );
}

export default App;