import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fileAPI, aiAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Upload, File, Trash2, Brain, Download, FileText, Image, FileSpreadsheet, Code, Eye } from 'lucide-react'

const FILE_ICONS = {
  'text/plain': FileText,
  'image/png': Image, 'image/jpeg': Image, 'image/jpg': Image,
  'application/pdf': File,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
}

export default function FileUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadFiles() }, [])

  const loadFiles = async () => {
    try {
      const res = await fileAPI.list()
      setFiles(res.data)
    } catch (err) {
      toast.error('Dosyalar yuklenemedi')
    } finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedExts = ['txt', 'png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowedExts.includes(ext)) {
      toast.error(`Desteklenmeyen dosya tipi: .${ext}\nIzin verilen: ${allowedExts.join(', ')}`)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan buyuk olamaz')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await fileAPI.upload(formData)
      toast.success('Dosya yuklendi')
      loadFiles()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yukleme basarisiz')
    } finally {
      setUploading(false)
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Dosyayi silmek istiyor musunuz?')) return
    try {
      await fileAPI.delete(id)
      toast.success('Dosya silindi')
      loadFiles()
    } catch (err) {
      toast.error('Silme basarisiz')
    }
  }

  const handleAnalyze = async (fileId) => {
    setAnalyzing(fileId)
    try {
      const res = await aiAPI.analyze({ file_id: fileId, analysis_type: 'general' })
      if (res.data.success) {
        toast.success('AI analizi tamamlandi')
        loadFiles()
      } else {
        toast.error(res.data.error || 'Analiz basarisiz')
      }
    } catch (err) {
      toast.error('AI analizi basarisiz')
    } finally {
      setAnalyzing(null)
    }
  }

  const handlePreviewHtml = async (fileId) => {
    try {
      const res = await aiAPI.getHtml(fileId)
      if (res.data.success) {
        setPreviewHtml({ id: fileId, html: res.data.html, filename: res.data.filename })
      }
    } catch (err) {
      toast.error('HTML onizleme yuklenemedi. Once AI Analiz ile donusturun.')
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType) => {
    const Icon = FILE_ICONS[mimeType] || File
    return <Icon className="w-8 h-8" />
  }

  const isDocxFile = (f) => f.original_name?.endsWith('.docx')
  const hasHtmlConversion = (f) => f.ai_analysis?.type === 'docx_to_html' && f.ai_analysis?.success

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dosya Yonetimi</h1>
          <p className="text-dark-200 mt-1">Dosya yukleyin, indirin ve AI analizi yapin</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card border-dashed border-2 border-dark-700 hover:border-primary-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}>
        <div className="flex flex-col items-center justify-center py-8">
          <Upload className={`w-12 h-12 mb-4 ${uploading ? 'animate-bounce text-primary-400' : 'text-dark-200'}`} />
          <p className="text-lg font-medium text-white mb-1">
            {uploading ? 'Yukleniyor...' : 'Dosya yuklemek icin tiklayin'}
          </p>
          <p className="text-sm text-dark-200">Desteklenen: txt, png, jpg, jpeg, pdf, docx, xlsx (max 10MB)</p>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload}
          accept=".txt,.png,.jpg,.jpeg,.pdf,.docx,.xlsx" />
      </div>

      {/* HTML Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-dark-850 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">HTML Onizleme: {previewHtml.filename}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/html-editor?file_id=${previewHtml.id}`)}
                  className="btn-primary text-xs flex items-center gap-1">
                  <Code className="w-3 h-3" /> Editorde Ac
                </button>
                <button onClick={() => setPreviewHtml(null)}
                  className="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors">
                  Kapat
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <iframe srcDoc={previewHtml.html} title="HTML Preview" className="w-full h-full min-h-[500px] border-0" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((f) => (
          <div key={f.id} className="card group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-600/10 rounded-lg flex items-center justify-center text-primary-400 flex-shrink-0">
                {getFileIcon(f.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate" title={f.original_name}>{f.original_name}</p>
                <p className="text-xs text-dark-200 mt-1">{formatSize(f.size)} • {f.created_at?.split('T')[0]}</p>
              </div>
            </div>

            {f.ai_analysis && (
              <div className="mt-3 p-3 bg-dark-900 rounded-lg border border-dark-700">
                <p className="text-xs font-medium text-primary-400 mb-1">AI Analiz Sonucu</p>
                <p className="text-xs text-dark-200">
                  {f.ai_analysis.summary || f.ai_analysis.message || f.ai_analysis.analysis || JSON.stringify(f.ai_analysis).slice(0, 150)}
                </p>
                {f.ai_analysis.prompt_results?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {f.ai_analysis.prompt_results.map((pr, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-primary-400">P: </span><span className="text-dark-200">{pr.prompt}</span>
                        <br />
                        <span className="text-emerald-400">A: </span><span className="text-dark-200">{pr.response}</span>
                      </div>
                    ))}
                  </div>
                )}
                {f.ai_analysis.top_words?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.ai_analysis.top_words.slice(0, 5).map((tw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-dark-800 rounded text-xs text-dark-200">{tw.word}: {tw.count}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button onClick={() => handleAnalyze(f.id)} disabled={analyzing === f.id}
                className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-1.5">
                {analyzing === f.id ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : <Brain className="w-3 h-3" />}
                AI Analiz
              </button>
              {(isDocxFile(f) && hasHtmlConversion(f)) && (
                <button onClick={() => handlePreviewHtml(f.id)}
                  className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white flex items-center gap-1 transition-colors">
                  <Code className="w-3 h-3" /> HTML
                </button>
              )}
              <button onClick={() => handleDelete(f.id)} className="btn-danger text-xs py-1.5 px-3">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {files.length === 0 && (
        <div className="text-center py-16 text-dark-200">
          <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Henuz dosya yuklenmemis</p>
        </div>
      )}
    </div>
  )
}
