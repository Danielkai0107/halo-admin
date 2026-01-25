import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Loading } from './components/Loading';
import { Layout } from './components/Layout';
import { LoginScreen } from './screens/login/LoginScreen';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { ElderListScreen } from './screens/elders/ElderListScreen';
import { ElderDetailScreen } from './screens/elders/ElderDetailScreen';
import { DeviceListScreen } from './screens/devices/DeviceListScreen';
import { NotificationLogsScreen } from './screens/notifications/NotificationLogsScreen';
import { NotificationPointsScreen } from './screens/notification-points/NotificationPointsScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter basename="/community">
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/elders" replace /> : <LoginScreen />
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/elders" element={<ElderListScreen />} />
                <Route path="/elders/:id" element={<ElderDetailScreen />} />
                <Route path="/devices" element={<DeviceListScreen />} />
                <Route path="/notification-logs" element={<NotificationLogsScreen />} />
                <Route path="/notification-points" element={<NotificationPointsScreen />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
