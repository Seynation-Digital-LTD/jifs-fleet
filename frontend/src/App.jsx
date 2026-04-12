import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Services from './pages/Services';
import Parts from './pages/Parts';
import Reports from './pages/Reports';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Layout><Dashboard /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/vehicles" element={
                        <ProtectedRoute>
                            <Layout><Vehicles /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/suppliers" element={
                        <ProtectedRoute>
                            <Layout><Suppliers /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/expenses" element={
                        <ProtectedRoute>
                            <Layout><Expenses /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/services" element={
                        <ProtectedRoute>
                            <Layout><Services /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/parts" element={
                        <ProtectedRoute>
                            <Layout><Parts /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <Layout><Reports /></Layout>
                        </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
