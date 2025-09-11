import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireEmployee>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/servicos" 
              element={
                <ProtectedRoute requireEmployee>
                  <ServicesPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastStyle={{
              backgroundColor: '#1F2937',
              color: '#FFFFFF',
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
