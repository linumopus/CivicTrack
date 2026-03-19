import { Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMapPage } from './pages/admin/AdminMapPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { CommunityPage } from './pages/user/CommunityPage';
import { IssueDetailPage } from './pages/user/IssueDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';

export default function App() {
  return (
    <div className="h-full">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute role="citizen">
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/messages"
          element={
            <ProtectedRoute role="citizen">
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/community"
          element={
            <ProtectedRoute role="citizen">
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/issues/:id"
          element={
            <ProtectedRoute role="citizen">
              <IssueDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute role="citizen">
              <ReportIssuePage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute role="admin">
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/map"
          element={
            <ProtectedRoute role="admin">
              <AdminMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
