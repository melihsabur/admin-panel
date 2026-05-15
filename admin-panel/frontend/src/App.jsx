import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import GroupManager from './components/GroupManager'
import ScreenAssignment from './components/ScreenAssignment'
import UserList from './components/UserList'
import FileUpload from './components/FileUpload'
import LogViewer from './components/LogViewer'
import AIPanel from './components/AIPanel'
import Reports from './components/Reports'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-dark-900"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
  return token ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="grup-yonetimi" element={<GroupManager />} />
        <Route path="ekran-atama" element={<ScreenAssignment />} />
        <Route path="kullanici-listesi" element={<UserList />} />
        <Route path="dosya-yonetimi" element={<FileUpload />} />
        <Route path="raporlar" element={<Reports />} />
        <Route path="log-kayitlari" element={<LogViewer />} />
        <Route path="ai-analiz" element={<AIPanel />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
