import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { BrokersPage } from './pages/BrokersPage';
import { StocksPage } from './pages/StocksPage';
import { MarketPage } from './pages/MarketPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<BrokersPage />} />
        <Route path="brokers" element={<BrokersPage />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="market" element={<MarketPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/brokers" replace />} />
    </Routes>
  );
}

export default App;
