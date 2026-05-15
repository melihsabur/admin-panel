import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { aiAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Code, Save, ArrowLeft, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'

export default function HTMLEditor() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileId = searchParams.get('file_id')
  const [html, setHtml] = useState('')
  const [originalHtml, setOriginalHtml] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('split') // 'code', 'preview', 'split'
  const [fullscreen, setFullscreen] = useState(false)
  const editorRef = useRef(null)

  useEffect(() => {
    if (fileId) loadHtml()
    else {
      setLoading(false)
      setHtml('<h1>Yeni Sayfa</h1>\n<p>Icerik buraya yazilacak...</p>')
    }
  }, [fileId])

  const loadHtml = async () => {
    try {
      const res = await aiAPI.getHtml(parseInt(fileId))
      if (res.data.success) {
        setHtml(res.data.html)
        setOriginalHtml(res.data.html)
        setFilename(res.data.filename || 'Bilinmeyen dosya')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'HTML yuklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!fileId) {
      toast.error('Kaydetme icin bir dosya secilmis olmali')
      return
    }
    setSaving(true)
    try {
      const res = await aiAPI.saveHtml(parseInt(fileId), html)
      if (res.data.success) {
        toast.success('HTML kaydedildi!')
        setOriginalHtml(html)
      }
    } catch (err) {
      toast.error('Kaydetme basarisiz')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = html !== originalHtml

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${fullscreen ? 'fixed inset-0 z-50 bg-dark-950 p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">HTML Editoru (GrapesJS)</h1>
            <p className="text-xs text-dark-200">
              {filename ? `Dosya: ${filename}` : 'Yeni sayfa olusturun veya DOCX donusumlerini duzenleyin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'code' ? 'bg-primary-600 text-white' : 'text-dark-200 hover:text-white'}`}>
              Kod
            </button>
            <button onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'split' ? 'bg-primary-600 text-white' : 'text-dark-200 hover:text-white'}`}>
              Bolunmus
            </button>
            <button onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'preview' ? 'bg-primary-600 text-white' : 'text-dark-200 hover:text-white'}`}>
              Onizleme
            </button>
          </div>
          <button onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 transition-colors">
            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
            {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs">
          Kaydedilmemis degisiklikler var
        </div>
      )}

      {/* Editor Area */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} ${fullscreen ? 'h-[calc(100vh-140px)]' : 'min-h-[600px]'}`}>
        {/* Code Editor */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-dark-800 border-b border-dark-700 flex items-center gap-2">
              <Code className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium text-dark-200">HTML Kaynak Kodu</span>
              <span className="ml-auto text-xs text-dark-200">{html.length} karakter</span>
            </div>
            <textarea
              ref={editorRef}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 w-full bg-dark-950 text-emerald-400 font-mono text-sm p-4 resize-none outline-none leading-6"
              spellCheck="false"
              placeholder="HTML kodunuzu buraya yazin..."
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-dark-800 border-b border-dark-700 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-dark-200">Canli Onizleme</span>
            </div>
            <div className="flex-1 bg-white overflow-auto">
              <iframe
                srcDoc={html}
                title="HTML Onizleme"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-200 mb-3">Hazir Sablonlar</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Bos Sayfa', html: '<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8">\n<title>Yeni Sayfa</title>\n<style>\nbody { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }\n</style>\n</head>\n<body>\n<h1>Baslik</h1>\n<p>Icerik buraya yazilacak.</p>\n</body>\n</html>' },
            { label: 'Tablo Sablonu', html: '<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8">\n<title>Tablo</title>\n<style>\nbody { font-family: Arial, sans-serif; padding: 20px; }\ntable { border-collapse: collapse; width: 100%; }\nth, td { border: 1px solid #ddd; padding: 12px; text-align: left; }\nth { background: #6366f1; color: white; }\ntr:nth-child(even) { background: #f5f5ff; }\n</style>\n</head>\n<body>\n<h1>Veri Tablosu</h1>\n<table>\n<tr><th>Ad</th><th>Soyad</th><th>Email</th></tr>\n<tr><td>Ahmet</td><td>Yilmaz</td><td>ahmet@mail.com</td></tr>\n<tr><td>Ayse</td><td>Demir</td><td>ayse@mail.com</td></tr>\n</table>\n</body>\n</html>' },
            { label: 'Rapor Sablonu', html: '<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8">\n<title>Rapor</title>\n<style>\nbody { font-family: "Segoe UI", Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #333; }\n.header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }\n.section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6366f1; }\nh1 { margin: 0; }\n.date { opacity: 0.8; font-size: 0.9em; }\n</style>\n</head>\n<body>\n<div class="header">\n<h1>Proje Raporu</h1>\n<p class="date">Tarih: ' + new Date().toLocaleDateString('tr-TR') + '</p>\n</div>\n<div class="section">\n<h2>1. Giris</h2>\n<p>Rapor icerigi buraya yazilacak.</p>\n</div>\n<div class="section">\n<h2>2. Bulgular</h2>\n<p>Analiz sonuclari buraya eklenecek.</p>\n</div>\n</body>\n</html>' },
          ].map((tpl) => (
            <button key={tpl.label} onClick={() => { if (window.confirm('Mevcut icerik degistirilecek. Devam?')) setHtml(tpl.html) }}
              className="px-3 py-1.5 text-xs bg-dark-900 border border-dark-700 rounded-full text-dark-200 hover:border-primary-500 hover:text-primary-400 transition-colors">
              {tpl.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
