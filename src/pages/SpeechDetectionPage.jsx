import { useRef, useState, useCallback } from 'react'
import { emotionAPI } from '../services/api'
import EmotionBadge from '../components/EmotionBadge'
import EmotionBar from '../components/EmotionBar'
import toast from 'react-hot-toast'
import { RiMicLine, RiStopLine, RiUploadLine, RiVolumeUpLine } from 'react-icons/ri'

export default function SpeechDetectionPage() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileInputRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/wav')
          ? 'audio/wav'
          : MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')
          ? 'audio/webm;codecs=pcm'
          : 'audio/webm',
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        // Store extension on blob for upload
        blob._ext = ext
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(100) // collect data every 100ms
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingTime(0)
      setResult(null)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 30) {
            stopRecording()
            return t
          }
          return t + 1
        })
      }, 1000)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access.'
          : `Microphone error: ${err.message}`
      toast.error(msg)
    }
  }, [])

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // ── Analyze audio ─────────────────────────────────────────────────────────
  const analyzeAudio = useCallback(async (blob) => {
    if (!blob) return
    setLoading(true)
    try {
      const { data } = await emotionAPI.detectSpeech(blob)
      setResult(data)
      toast.success(`Detected: ${data.emotion}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10 MB.')
      return
    }
    const url = URL.createObjectURL(file)
    setAudioBlob(file)
    setAudioUrl(url)
    setResult(null)
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Speech Emotion Detection</h1>
        <p className="text-slate-400 mt-1">
          Analyze emotions from your voice using a CNN trained on RAVDESS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Recording panel ── */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-white">Record or Upload Audio</h2>

          {/* Visualizer / status */}
          <div className="bg-slate-800/50 rounded-xl p-8 flex flex-col items-center justify-center min-h-[180px]">
            {isRecording ? (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center recording-pulse mb-4">
                  <RiMicLine className="text-red-400 text-4xl" />
                </div>
                <p className="text-red-400 font-semibold">Recording...</p>
                <p className="text-slate-400 text-sm font-mono mt-1">{formatTime(recordingTime)} / 00:30</p>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-red-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(recordingTime / 30) * 100}%` }}
                  />
                </div>
              </>
            ) : audioUrl ? (
              <>
                <RiVolumeUpLine className="text-indigo-400 text-4xl mb-3" />
                <p className="text-slate-300 text-sm mb-3">Audio ready for analysis</p>
                <audio controls src={audioUrl} className="w-full" />
              </>
            ) : (
              <>
                <RiMicLine className="text-slate-600 text-5xl mb-3" />
                <p className="text-slate-500 text-sm">Press record or upload an audio file</p>
                <p className="text-slate-600 text-xs mt-1">Supports WAV, MP3, WebM, OGG (max 10 MB)</p>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                <RiMicLine /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200"
              >
                <RiStopLine /> Stop Recording
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
              title="Upload audio file"
            >
              <RiUploadLine />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Analyze button */}
          {audioBlob && !isRecording && (
            <button
              onClick={() => analyzeAudio(audioBlob)}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing speech...
                </>
              ) : (
                '🔍 Analyze Emotion'
              )}
            </button>
          )}
        </div>

        {/* ── Results panel ── */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-white">Detection Result</h2>

          {result ? (
            <>
              <div className="text-center py-6 bg-slate-800/50 rounded-xl">
                <div className="text-6xl mb-3">{getEmotionEmoji(result.emotion)}</div>
                <EmotionBadge emotion={result.emotion} size="lg" />
                {result.confidence != null && (
                  <p className="text-slate-400 text-sm mt-2">
                    Confidence:{' '}
                    <span className="text-white font-mono">{Math.round(result.confidence * 100)}%</span>
                  </p>
                )}
              </div>

              {result.all_emotions && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">All Emotions</h3>
                  <EmotionBar allEmotions={result.all_emotions} dominant={result.emotion} />
                </div>
              )}

              {result.note && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  ⚠️ {result.note}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <RiMicLine className="text-5xl mb-3 opacity-40" />
              <p className="text-sm">Record or upload audio to detect emotions</p>
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="card bg-cyan-500/5 border-cyan-500/20">
        <h3 className="font-medium text-cyan-300 mb-2">How it works</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your audio is processed by a CNN model trained on the RAVDESS dataset. Features
          extracted include MFCC (40 coefficients), Chroma (12 pitch classes), and Mel
          Spectrogram (128 bands). The model classifies 8 emotions: neutral, calm, happy,
          sad, angry, fearful, disgust, and surprised. Audio is processed server-side and
          not stored — only the emotion result is saved.
        </p>
      </div>
    </div>
  )
}

function getEmotionEmoji(emotion) {
  const map = {
    happy: '😊', sad: '😢', angry: '😠', neutral: '😐',
    fear: '😨', fearful: '😨', surprise: '😲', surprised: '😲',
    disgust: '🤢', calm: '😌',
  }
  return map[emotion?.toLowerCase()] || '🤔'
}
