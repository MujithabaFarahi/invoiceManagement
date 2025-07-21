import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/Layout';
import './App.css';
import Dashboard from './Pages/Dashboard';
import Customers from './Pages/Customer';
import Invoices from './Pages/Invoices';
import Payments from './Pages/Payments';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="invoice-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
