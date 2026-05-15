import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { screenAPI } from '../api/client'
import { LogOut, Menu, X, LayoutDashboard, Users, FolderOpen, BarChart3, Brain, ScrollText, Settings, Monitor, ChevronRight } from 'lucide-react'

const iconMap = {
  LayoutDashboard, Users, FolderOpen, BarChart3, Brain, ScrollText, Settings, Monitor
}

export default function Layout() {
  const { user, logout, isSupervisor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [screens, setScreens] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    loadScreens()
  }, [])

  const loadScreens = async () => {
    try {
      const res = await screenAPI.myScreens()
      setScreens(res.data)
    } catch (err) {
      console.error('Ekranlar yuklenemedi:', err)
    }
  }

  const supervisorMenus = [
    { name: 'Grup Yonetimi', slug: 'grup-yonetimi', icon: 'Settings' },
    { name: 'Ekran Atama', slug: 'ekran-atama', icon: 'Monitor' },
  ]

  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || LayoutDashboard
    return <Icon className="w-5 h-5" />
  }

  const menuItems = [
    ...(isSupervisor ? supervisorMenus : []),
    ...screens.map(s => ({ name: s.name, slug: s.slug, icon: s.icon }))
  ]

  return (
    <div className="flex h-screen bg-dark-950">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark-900 border-r border-dark-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold text-white">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === `/${item.slug}`
            return (
              <button key={item.slug} onClick={() => navigate(`/${item.slug}`)}
                className={`sidebar-link w-full ${isActive ? 'active' : ''}`}>
                {getIcon(item.icon)}
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
                {sidebarOpen && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-dark-700">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-xs text-dark-200 truncate">{user?.role === 'supervisor' ? 'Supervisor' : user?.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={logout} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-red-400 transition-colors" title="Cikis Yap">
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
