import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import SellerCreateListing from './pages/SellerCreateListing';
import BuyerSearchResults from './pages/BuyerSearchResults';
import AIDashboard from './pages/AIDashboard';
import AuthPages from './pages/AuthPages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-cream-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/seller/create-listing" element={<SellerCreateListing />} />
            <Route path="/buyer/search" element={<BuyerSearchResults />} />
            <Route path="/ai-dashboard" element={<AIDashboard />} />
            <Route path="/auth/*" element={<AuthPages />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#faf9f7',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#527a5c',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#faf9f7',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#527a5c',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;