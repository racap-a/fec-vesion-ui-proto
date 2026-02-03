import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/admin/Companies';
import CreateCompany from './pages/admin/CreateCompany';
import Ingestion from './pages/Ingestion';
import Mapping from './pages/Mapping';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      {/* Main Application Shell */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Admin Routes (F1 & F1b) */}
        <Route path="admin/companies" element={<Companies />} />
        <Route path="admin/create-company" element={<CreateCompany />} />

        {/* User Operations (F2, F3, F4) */}
        <Route path="ingestion" element={<Ingestion />} />
        <Route path="mapping" element={<Mapping />} />

        {/* Auth Demo */}
        <Route path="login" element={<Login />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
