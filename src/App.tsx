import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import TrackOrderPage from './pages/TrackOrderPage';
import { loadPayPalScript } from './lib/paypal';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    loadPayPalScript();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;