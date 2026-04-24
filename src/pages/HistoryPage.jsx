import { useEffect, useState } from 'react'
import { emotionAPI } from '../services/api'
import EmotionBadge from '../components/EmotionBadge'
import { RiHistoryLine, RiCameraLine, RiMicLine, RiFilterLine } from 'react-icons/ri'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Facial', value: 'facial' },
  { label: 'Speech', value: 'speech' },
]

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const params = { limit: 100 }
        if (filter) params.detection_type = filter
        const { data } = await emotionAPI.getHistory(params)
        setHistory(data.history || [])
        setTotal(data.total || 0)
      } catch (err) {
        console.error('History fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [filter])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Detection History</h1>
          <p className="text-slate-400 mt-1">
            {total} total detection{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
          <RiFilterLine className="text-slate-500 ml-2 mr-1" />
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <RiHistoryLine className="text-5xl mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-slate-400">No history yet</p>
            <p className="text-sm mt-1">
              {filter
                ? `No ${filter} detections found. Try a different filter.`
                : 'Start detecting emotions to see your history here.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-800 mb-2">
              <span>Type</span>
              <span>Emotion</span>
              <span>Confidence</span>
              <span>Time</span>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-4 items-center px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  {/* Type */}
                  <div className="flex items-center gap-2">
                    {item.detection_type === 'facial' ? (
                      <RiCameraLine className="text-indigo-400" />
                    ) : (
                      <RiMicLine className="text-cyan-400" />
                    )}
                    <span className="text-sm text-slate-300 capitalize">
                      {item.detection_type}
                    </span>
                  </div>

                  {/* Emotion */}
                  <EmotionBadge emotion={item.emotion} size="sm" />

                  {/* Confidence */}
                  <div>
                    {item.confidence != null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-indigo-400 h-1.5 rounded-full"
                            style={{ width: `${Math.round(item.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
