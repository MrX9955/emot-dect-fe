/**
 * Colored badge displaying an emotion label with an emoji.
 */

const EMOTION_CONFIG = {
  happy:     { emoji: '😊', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  sad:       { emoji: '😢', bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  angry:     { emoji: '😠', bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  neutral:   { emoji: '😐', bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/30' },
  fear:      { emoji: '😨', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  fearful:   { emoji: '😨', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  surprise:  { emoji: '😲', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  surprised: { emoji: '😲', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  disgust:   { emoji: '🤢', bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  calm:      { emoji: '😌', bg: 'bg-cyan-500/20',   text: 'text-cyan-400',   border: 'border-cyan-500/30' },
}

const DEFAULT_CONFIG = { emoji: '🤔', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }

export default function EmotionBadge({ emotion, size = 'md', showEmoji = true }) {
  const config = EMOTION_CONFIG[emotion?.toLowerCase()] || DEFAULT_CONFIG
  const sizeClasses = size === 'lg'
    ? 'text-base px-4 py-2'
    : size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showEmoji && <span>{config.emoji}</span>}
      <span className="capitalize">{emotion || 'Unknown'}</span>
    </span>
  )
}

export { EMOTION_CONFIG }
