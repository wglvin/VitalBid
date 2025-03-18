import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Import components with correct relative paths
import Navbar from './components/Navbar';
import Marketplace from './pages/Marketplace';
import Payment from './pages/Payment';
import MyBids from './pages/MyBids';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/my-bids" element={<MyBids />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;