import { useState } from 'react'
import { aiAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Brain, Send, Sparkles, MessageSquare } from 'lucide-react'

export default function AIPanel() {
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handlePrompt = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const res = await aiAPI.prompt({ text: prompt })
      setResults(prev => [{
        id: Date.now(),
        prompt: prompt,
        response: res.data.result || res.data.message || JSON.stringify(res.data),
        success: res.data.success,
        timestamp: new Date().toLocaleString('tr-TR')
      }, ...prev])
      setPrompt('')
    } catch (err) {
      toast.error('AI islemi basarisiz')
    } finally {
      setLoading(false)
    }
  }

  const examplePrompts = [
    'Merhaba, nasil yardimci olabilirsin?',
    'Bugunku tarih nedir?',
    'Bir dosyanin ozetini cikar',
    'Sistem durumu hakkinda bilgi ver'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          AI Analiz Paneli
        </h1>
        <p className="text-dark-200 mt-2">Yapay zeka ile metin analizi ve prompt isleme</p>
      </div>

      {/* Prompt Input */}
      <div className="card">
        <form onSubmit={handlePrompt} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Prompt / Komut Girin</label>
            <div className="relative">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                className="input-field min-h-[100px] pr-12" placeholder="AI'ya bir komut veya soru yazin..."
                rows="3" />
              <button type="submit" disabled={loading || !prompt.trim()}
                className="absolute bottom-3 right-3 p-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white disabled:opacity-50 transition-colors">
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-dark-200 mb-2">Ornek komutlar:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((ep) => (
                <button key={ep} type="button" onClick={() => setPrompt(ep)}
                  className="px-3 py-1.5 text-xs bg-dark-900 border border-dark-700 rounded-full text-dark-200 hover:border-primary-500 hover:text-primary-400 transition-colors">
                  {ep}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{r.prompt}</p>
                <p className="text-xs text-dark-200 mt-1">{r.timestamp}</p>
              </div>
            </div>
            <div className="ml-11 p-4 bg-dark-900 rounded-lg border border-dark-700">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">AI Yaniti</span>
                <span className={`badge ml-auto ${r.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {r.success ? 'Basarili' : 'Hata'}
                </span>
              </div>
              <p className="text-sm text-dark-200 whitespace-pre-wrap">{r.response}</p>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-16 text-dark-200">
          <Brain className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Henuz bir islem yapilmadi</p>
          <p className="text-sm">Yukaridaki alana bir prompt yazarak baslayabilirsiniz</p>
        </div>
      )}
    </div>
  )
}
