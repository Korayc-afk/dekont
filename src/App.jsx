import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import InvestmentForm from './components/InvestmentForm'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import ReceiptQuery from './components/ReceiptQuery'
import Logo from './components/Logo'

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#161d2c' }}>
              {/* Logo */}
              <div className="absolute top-6 left-6 z-20">
                <Logo size="text-2xl" />
              </div>
              
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
              </div>
              <InvestmentForm />
            </div>
          } 
        />
        <Route path="/yönetim-giriş-secure" element={<AdminLogin />} />
        <Route path="/yönetim-panel-2024-secure" element={<AdminPanel />} />
        <Route path="/sorgu" element={<ReceiptQuery />} />
      </Routes>
    </Router>
  )
}

export default App

