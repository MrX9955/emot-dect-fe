import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { emotionAPI } from '../services/api'
import EmotionBadge from '../components/EmotionBadge'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { RiCameraLine, RiMicLine, RiHistoryLine, RiEmotionHappyLine } from 'react-icons/ri'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const CHART_COLORS = [
  '#fbbf24', '#60a5fa', '#f87171', '#94a3b8',
  '#a78bfa', '#fb923c', '#4ade80', '#67e8f9',
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          emotionAPI.getStats(),
          emotionAPI.getHistory({ limit: 10 }),
        ])
        setStats(statsRes.data)
        setHistory(historyRes.data.history || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const facialEntries = Object.entries(stats?.facial || {})
  const speechEntries = Object.entries(stats?.speech || {})

  const facialChartData = {
    labels: facialEntries.map(([e]) => e),
    datasets: [{
      data: facialEntries.map(([, v]) => v),
      backgroundColor: CHART_COLORS.slice(0, facialEntries.length),
      borderWidth: 0,
    }],
  }

  const speechChartData = {
    labels: speechEntries.map(([e]) => e),
    datasets: [{
      label: 'Detections',
      data: speechEntries.map(([, v]) => v),
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }],
  }

  const chartOptions = {
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    },
    maintainAspectRatio: false,
  }

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    },
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's your emotion detection overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<RiEmotionHappyLine className="text-2xl text-indigo-400" />}
          label="Total Detections"
          value={loading ? '—' : stats?.total_detections ?? 0}
          color="indigo"
        />
        <StatCard
          icon={<RiCameraLine className="text-2xl text-yellow-400" />}
          label="Facial Analyses"
          value={loading ? '—' : facialEntries.reduce((s, [, v]) => s + v, 0)}
          color="yellow"
        />
        <StatCard
          icon={<RiMicLine className="text-2xl text-cyan-400" />}
          label="Speech Analyses"
          value={loading ? '—' : speechEntries.reduce((s, [, v]) => s + v, 0)}
          color="cyan"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/facial" className="card hover:border-indigo-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
              <RiCameraLine className="text-indigo-400 text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Facial Detection</h3>
              <p className="text-slate-400 text-sm">Analyze emotions from webcam</p>
            </div>
          </div>
        </Link>
        <Link to="/speech" className="card hover:border-indigo-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
              <RiMicLine className="text-cyan-400 text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Speech Detection</h3>
              <p className="text-slate-400 text-sm">Analyze emotions from voice</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      {!loading && (facialEntries.length > 0 || speechEntries.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facialEntries.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Facial Emotions</h3>
              <div className="h-56">
                <Doughnut data={facialChartData} options={chartOptions} />
              </div>
            </div>
          )}
          {speechEntries.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Speech Emotions</h3>
              <div className="h-56">
                <Bar data={speechChartData} options={barOptions} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent history */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Detections</h3>
          <Link to="/history" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors">
            <RiHistoryLine /> View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <RiEmotionHappyLine className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No detections yet. Try the facial or speech detection!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wide w-14">
                    {item.detection_type}
                  </span>
                  <EmotionBadge emotion={item.emotion} size="sm" />
                </div>
                <div className="flex items-center gap-3">
                  {item.confidence != null && (
                    <span className="text-xs text-slate-500 font-mono">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  )}
                  <span className="text-xs text-slate-600">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    cyan:   'bg-cyan-500/10 border-cyan-500/20',
  }
  return (
    <div className={`card border ${colorMap[color] || ''}`}>
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-slate-800">{icon}</div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
