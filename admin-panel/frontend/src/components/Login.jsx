import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Lock, User, LogIn, Shield } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Giris basarili!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Giris basarisiz')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { username: 'supervisor', password: 'super123', role: 'Supervisor', color: 'text-yellow-400' },
    { username: 'ogrenci1', password: 'ogr123', role: 'Ogrenci', color: 'text-blue-400' },
    { username: 'okul1', password: 'okul123', role: 'Okul', color: 'text-green-400' },
    { username: 'isletme1', password: 'isl123', role: 'Isletme', color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-purple-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-dark-200">Yonetim sistemine giris yapin</p>
        </div>

        <div className="card backdrop-blur-sm bg-dark-850/80">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Kullanici Adi</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-200" />
                <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-10" placeholder="Kullanici adinizi girin" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Sifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-200" />
                <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10" placeholder="Sifrenizi girin" required />
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <LogIn className="w-5 h-5" />}
              {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
            </button>
          </form>
        </div>

        <div className="mt-6 card backdrop-blur-sm bg-dark-850/60">
          <h3 className="text-sm font-medium text-dark-200 mb-3">Ornek Hesaplar</h3>
          <div className="space-y-2">
            {demoUsers.map((u) => (
              <button key={u.username} onClick={() => { setUsername(u.username); setPassword(u.password) }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-dark-900/50 hover:bg-dark-800 transition-colors text-sm">
                <span className="text-dark-200">{u.username}</span>
                <span className={`badge ${u.color} bg-dark-800`}>{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
