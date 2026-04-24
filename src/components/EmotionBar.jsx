/**
 * Horizontal bar chart showing all emotion confidence scores.
 */
import { EMOTION_CONFIG } from './EmotionBadge'

const BAR_COLORS = {
  happy:     'bg-yellow-400',
  sad:       'bg-blue-400',
  angry:     'bg-red-400',
  neutral:   'bg-slate-400',
  fear:      'bg-purple-400',
  fearful:   'bg-purple-400',
  surprise:  'bg-orange-400',
  surprised: 'bg-orange-400',
  disgust:   'bg-green-400',
  calm:      'bg-cyan-400',
}

export default function EmotionBar({ allEmotions, dominant }) {
  if (!allEmotions) return null

  const sorted = Object.entries(allEmotions).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-2">
      {sorted.map(([emotion, score]) => {
        const pct = Math.round(score * 100)
        const config = EMOTION_CONFIG[emotion] || {}
        const barColor = BAR_COLORS[emotion] || 'bg-slate-400'
        const isDominant = emotion === dominant

        return (
          <div key={emotion} className="flex items-center gap-3">
            <span className={`text-xs w-20 capitalize font-medium ${isDominant ? 'text-white' : 'text-slate-400'}`}>
              {config.emoji} {emotion}
            </span>
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor} ${isDominant ? 'opacity-100' : 'opacity-50'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs w-10 text-right font-mono ${isDominant ? 'text-white' : 'text-slate-500'}`}>
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
