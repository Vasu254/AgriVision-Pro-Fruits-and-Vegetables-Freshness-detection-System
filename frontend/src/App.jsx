import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
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
      <div className="App">
        <div className="bg-particles" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home apiUrl={API_URL} />} />
          <Route path="/detect" element={<Detect apiUrl={API_URL} />} />
          <Route path="/camera" element={<Camera apiUrl={API_URL} />} />
          <Route path="/batch" element={<BatchDetect apiUrl={API_URL} />} />
          <Route path="/video" element={<VideoAnalyzer apiUrl={API_URL} />} />
          <Route path="/dashboard" element={<Dashboard apiUrl={API_URL} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
