import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/admin/Companies';
import CreateCompany from './pages/admin/CreateCompany';
import Ingestion from './pages/Ingestion';
import Mapping from './pages/Mapping';
import Login from './pages/Login';
import type { ReactNode } from 'react';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to home if unauthorized
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Application Routes */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />

          {/* Admin Only Routes */}
          <Route
            path="admin/companies"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/create-company"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <CreateCompany />
              </ProtectedRoute>
            }
          />

          {/* Standard User Features (Accessible to all authenticated users) */}
          <Route path="ingestion" element={<Ingestion />} />
          <Route path="mapping" element={<Mapping />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
