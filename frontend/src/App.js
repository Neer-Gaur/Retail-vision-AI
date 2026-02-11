import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import PaymentPending from './pages/PaymentPending';
import About from './pages/About';
import Mission from './pages/Mission';
import Contact from './pages/Contact';
import DashboardHome from './pages/DashboardHome';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Leads from './pages/Leads';
import Subscription from './pages/Subscription';
import Kiosk from './pages/Kiosk';
import DashboardLayout from './components/DashboardLayout';
import { hasPaidAccess } from './lib/access';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { user, shop, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;

  // Require paid access (or allowlist) for app areas.
  return hasPaidAccess({ user, shop }) ? children : <Navigate to="/pricing" />;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment" element={<PaymentPending />} />
          <Route path="/about" element={<About />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/kiosk" element={<PrivateRoute><Kiosk /></PrivateRoute>} />
          
          {/* Dashboard Routes with Layout */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="leads" element={<Leads />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
