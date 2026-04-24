import { useRef, useState, useEffect, useCallback } from 'react'
import { emotionAPI } from '../services/api'
import EmotionBadge from '../components/EmotionBadge'
import EmotionBar from '../components/EmotionBar'
import toast from 'react-hot-toast'
import { RiCameraLine, RiCameraOffLine, RiRefreshLine } from 'react-icons/ri'

const CAPTURE_INTERVAL_MS = 2000 // Send a frame every 2 seconds

export default function FacialDetectionPage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [frameCount, setFrameCount] = useState(0)

  // ── Start webcam ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsStreaming(true)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found. Please connect a webcam.'
          : `Camera error: ${err.message}`
      setError(msg)
      toast.error(msg)
    }
  }, [])

  // ── Stop webcam ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsStreaming(false)
  }, [])

  // ── Capture & analyze a frame ─────────────────────────────────────────────
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64 = canvas.toDataURL('image/jpeg', 0.8)
    setLoading(true)
    try {
      const { data } = await emotionAPI.detectFacial(base64)
      setResult(data)
      setFrameCount((c) => c + 1)
    } catch (err) {
      // Only show error toast if it's not a 401 (handled globally)
      if (err.response?.status !== 401) {
        console.error('Facial detection error:', err.response?.data || err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Auto-capture loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isStreaming, captureAndAnalyze])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Facial Emotion Detection</h1>
        <p className="text-slate-400 mt-1">
          Real-time emotion analysis from your webcam using DeepFace
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Webcam panel ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Live Camera</h2>
            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live · {frameCount} frames
              </div>
            )}
          </div>

          {/* Video element */}
          <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover webcam-mirror"
              muted
              playsInline
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <RiCameraOffLine className="text-5xl mb-2" />
                <p className="text-sm">Camera is off</p>
              </div>
            )}
            {loading && isStreaming && (
              <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-2 py-1 text-xs text-white flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </div>
            )}
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!isStreaming ? (
              <button onClick={startCamera} className="btn-primary flex items-center gap-2 flex-1">
                <RiCameraLine /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={stopCamera} className="btn-secondary flex items-center gap-2 flex-1">
                  <RiCameraOffLine /> Stop Camera
                </button>
                <button
                  onClick={captureAndAnalyze}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                  title="Capture now"
                >
                  <RiRefreshLine className={loading ? 'animate-spin' : ''} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Results panel ── */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-white">Detection Result</h2>

          {result ? (
            <>
              {/* Dominant emotion */}
              <div className="text-center py-6 bg-slate-800/50 rounded-xl">
                <div className="text-6xl mb-3">
                  {getEmotionEmoji(result.emotion)}
                </div>
                <EmotionBadge emotion={result.emotion} size="lg" />
                {result.confidence != null && (
                  <p className="text-slate-400 text-sm mt-2">
                    Confidence: <span className="text-white font-mono">{Math.round(result.confidence * 100)}%</span>
                  </p>
                )}
              </div>

              {/* All emotion scores */}
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
              <RiCameraLine className="text-5xl mb-3 opacity-40" />
              <p className="text-sm">Start the camera to begin detection</p>
              <p className="text-xs mt-1 text-slate-600">
                Frames are analyzed every {CAPTURE_INTERVAL_MS / 1000}s automatically
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="card bg-indigo-500/5 border-indigo-500/20">
        <h3 className="font-medium text-indigo-300 mb-2">How it works</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your webcam feed is captured as JPEG frames and sent to the backend every{' '}
          {CAPTURE_INTERVAL_MS / 1000} seconds. DeepFace analyzes each frame using a model
          trained on the FER2013 dataset to detect 7 emotions: happy, sad, angry, neutral,
          fear, surprise, and disgust. No video is stored — only the detected emotion label
          and confidence score are saved.
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
