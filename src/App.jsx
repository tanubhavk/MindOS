// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DailyPlanner from './pages/DailyPlanner';
import KeybindsAndRules from './components/KeybindsAndRules';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
        <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/daily-planner" element={<DailyPlanner />} />
            <Route path="/keybinds" element={<KeybindsAndRules />} />
        </Routes>
        </main>
      </div>
    </Router>
  );
}
