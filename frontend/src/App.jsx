import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Detect from './pages/Detect';
import Camera from './pages/Camera';
import BatchDetect from './pages/BatchDetect';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import VideoAnalyzer from './pages/VideoAnalyzer';
import './index.css';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  return (
    <Router>
      <AuthProvider apiUrl={API_URL}>
        <div className="App">
          <div className="bg-particles" />
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/"         element={<Home apiUrl={API_URL} />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about"    element={<About />} />

            {/* Protected routes */}
            <Route path="/detect"    element={<ProtectedRoute><Detect    apiUrl={API_URL} /></ProtectedRoute>} />
            <Route path="/camera"    element={<ProtectedRoute><Camera    apiUrl={API_URL} /></ProtectedRoute>} />
            <Route path="/batch"     element={<ProtectedRoute><BatchDetect apiUrl={API_URL} /></ProtectedRoute>} />
            <Route path="/video"     element={<ProtectedRoute><VideoAnalyzer apiUrl={API_URL} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard apiUrl={API_URL} /></ProtectedRoute>} />
            <Route path="/contact"   element={<ProtectedRoute><Contact  /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
