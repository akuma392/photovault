import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Upload } from "./pages/Upload";
import { MediaDetails } from "./pages/MediaDetails";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Login, Signup } from "./pages/AuthPages";
import { VerifyMagicURL } from "./pages/VerifyMagicURL";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();
  if (loading) return <div className="min-h-[80vh] flex items-center justify-center text-slate-500 text-sm">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useApp();
  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicAuthRoute = ({ children }) => {
  const { user, loading } = useApp();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/media/:id" element={<ProtectedRoute><MediaDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
            <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
            <Route path="/verify-magic-url" element={<VerifyMagicURL />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;