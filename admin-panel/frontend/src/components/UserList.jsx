import { useState, useEffect } from 'react'
import { userAPI, groupAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, User, Search } from 'lucide-react'

export default function UserList() {
  const { isSupervisor } = useAuth()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '', role: 'user', group_id: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([userAPI.list(), groupAPI.list().catch(() => ({ data: [] }))])
      .then(([u, g]) => { setUsers(u.data); setGroups(g.data) })
      .catch(() => toast.error('Veriler yuklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  const loadUsers = async () => {
    const res = await userAPI.list()
    setUsers(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await userAPI.update(editId, { email: form.email, full_name: form.full_name, group_id: form.group_id })
        toast.success('Kullanici guncellendi')
      } else {
        await userAPI.create(form)
        toast.success('Kullanici olusturuldu')
      }
      resetForm()
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Islem basarisiz')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kullaniciyi silmek istiyor musunuz?')) return
    try {
      await userAPI.delete(id)
      toast.success('Kullanici silindi')
      loadUsers()
    } catch (err) {
      toast.error('Silme basarisiz')
    }
  }

  const startEdit = (u) => {
    setEditId(u.id)
    setForm({ username: u.username, password: '', email: u.email, full_name: u.full_name, role: u.role, group_id: u.group_id })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false); setEditId(null)
    setForm({ username: '', password: '', email: '', full_name: '', role: 'user', group_id: null })
  }

  const getGroupName = (gid) => groups.find(g => g.id === gid)?.name || '-'

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kullanici Listesi</h1>
          <p className="text-dark-200 mt-1">{users.length} kullanici listeleniyor</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-200" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-64" placeholder="Ara..." />
          </div>
          {isSupervisor && (
            <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Yeni Kullanici
            </button>
          )}
        </div>
      </div>

      {showForm && isSupervisor && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Kullanici Duzenle' : 'Yeni Kullanici'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-200 mb-1">Kullanici Adi</label>
              <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})}
                className="input-field" required disabled={!!editId} />
            </div>
            {!editId && (
              <div>
                <label className="block text-sm text-dark-200 mb-1">Sifre</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                  className="input-field" required />
              </div>
            )}
            <div>
              <label className="block text-sm text-dark-200 mb-1">Ad Soyad</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-dark-200 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-dark-200 mb-1">Grup</label>
              <select value={form.group_id || ''} onChange={(e) => setForm({...form, group_id: e.target.value ? parseInt(e.target.value) : null})}
                className="input-field">
                <option value="">Grup yok</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {editId ? 'Guncelle' : 'Olustur'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary flex items-center gap-2"><X className="w-4 h-4" /> Iptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-900">
              <th className="text-left p-4 text-sm font-medium text-dark-200">ID</th>
              <th className="text-left p-4 text-sm font-medium text-dark-200">Kullanici</th>
              <th className="text-left p-4 text-sm font-medium text-dark-200">Email</th>
              <th className="text-left p-4 text-sm font-medium text-dark-200">Grup</th>
              <th className="text-left p-4 text-sm font-medium text-dark-200">Rol</th>
              {isSupervisor && <th className="text-right p-4 text-sm font-medium text-dark-200">Islemler</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="table-row">
                <td className="p-4 text-sm text-dark-200">{u.id}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {u.full_name?.charAt(0) || u.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.full_name}</p>
                      <p className="text-xs text-dark-200">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-dark-200">{u.email}</td>
                <td className="p-4"><span className="badge bg-primary-600/20 text-primary-400">{getGroupName(u.group_id)}</span></td>
                <td className="p-4"><span className={`badge ${u.role === 'supervisor' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-800 text-dark-200'}`}>{u.role}</span></td>
                {isSupervisor && (
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(u)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-primary-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-dark-200 py-8">Kullanici bulunamadi</p>}
      </div>
    </div>
  )
}
