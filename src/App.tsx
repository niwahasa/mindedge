import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTradeStore } from '@/stores/tradeStore';
import AppShell from '@/components/layout/AppShell';
import AuthShell from '@/components/layout/AuthShell';
import Dashboard from '@/pages/Dashboard';
import TradeLog from '@/pages/TradeLog';
import Psychology from '@/pages/Psychology';
import Analytics from '@/pages/Analytics';
import AICoach from '@/pages/AICoach';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Membership from '@/pages/Membership';
import DataMigration from '@/components/DataMigration';
import { Toaster } from 'sonner';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const updateStreak = useAuthStore((s) => s.updateStreak);

  const fetchTrades = useTradeStore((s) => s.fetchTrades);

  useEffect(() => {
    if (user) {
      updateStreak();
      fetchTrades();
    }
  }, [user, updateStreak, fetchTrades]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={false} richColors />
      <DataMigration />
      <AppInitializer>

        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <AuthShell>
                  <Login />
                </AuthShell>
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute>
                <AuthShell>
                  <Register />
                </AuthShell>
              </AuthRoute>
            }
          />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<TradeLog />} />
            <Route path="/psychology" element={<Psychology />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/coach" element={<AICoach />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/membership" element={<Membership />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}
