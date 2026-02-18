import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetail } from './components/cases/CaseDetail';
import { CreateCase } from './components/cases/CreateCase';
import { WorklistPage } from './pages/WorklistPage';
import { AssignmentDetail } from './components/assignments/AssignmentDetail';
import { TransactionsPage } from './pages/TransactionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/create" element={<CreateCase />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/worklist" element={<WorklistPage />} />
            <Route path="/worklist/:assignmentId" element={<AssignmentDetail />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
