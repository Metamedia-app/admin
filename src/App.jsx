import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider }         from './context/ToastContext'
import LoginPage          from './pages/LoginPage'
import DashboardPage      from './pages/DashboardPage'
import UsersPage          from './pages/UsersPage'
import ReportsPage        from './pages/ReportsPage'
import PostsPage          from './pages/PostsPage'
import SubjectsPage       from './pages/SubjectsPage'
import GroupsPage         from './pages/GroupsPage'
import UserManagementPage from './pages/UserManagementPage'
import AdminLayout        from './layouts/AdminLayout'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<DashboardPage />} />
              <Route path="users"         element={<UsersPage />} />
              <Route path="reports"       element={<ReportsPage />} />
              <Route path="posts"         element={<PostsPage />} />
              <Route path="subjects"      element={<SubjectsPage />} />
              <Route path="groups"        element={<GroupsPage />} />
              <Route path="user-management" element={<UserManagementPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
