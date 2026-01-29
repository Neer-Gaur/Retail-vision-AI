import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OwnerDashboard from './pages/OwnerDashboard';
import KioskMode from './pages/KioskMode';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <OwnerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/kiosk"
            element={
              <PrivateRoute>
                <KioskMode />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;