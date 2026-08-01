import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, RefreshCw, Square, Video, VideoOff } from 'lucide-react'
import { Button } from '../ui/Button'

interface VideoRecorderProps {
  /** Called with a playable object URL + the recorded blob when the user keeps a take. */
  onRecorded: (result: { url: string; blob: Blob }) => void
}

type Phase = 'idle' | 'ready' | 'recording' | 'recorded'

const MAX_SECONDS = 120

export function VideoRecorder({ onRecorded }: VideoRecorderProps) {
  const liveRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    'MediaRecorder' in window

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopStream()
    }
  }, [stopStream])

  const enableCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      if (liveRef.current) {
        liveRef.current.srcObject = stream
        liveRef.current.muted = true
        await liveRef.current.play().catch(() => {})
      }
      setPhase('ready')
    } catch {
      setError('We couldn’t access your camera. Please allow camera and microphone access and try again.')
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(streamRef.current)
    } catch {
      setError('Recording is not supported on this browser.')
      return
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPhase('recorded')
      stopStream()
      onRecorded({ url, blob })
    }
    recorderRef.current = recorder
    recorder.start()
    setPhase('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopRecording()
        return s + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  const retake = async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSeconds(0)
    await enableCamera()
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        <VideoOff size={22} className="text-slate-400" />
        Video recording isn’t supported on this browser. Please try Chrome or Safari, or leave a written review instead.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-900">
        {/* Live preview while idle/ready/recording */}
        <video
          ref={liveRef}
          playsInline
          className={phase === 'recorded' ? 'hidden' : 'aspect-video w-full object-cover'}
        />
        {/* Recorded playback */}
        {phase === 'recorded' && previewUrl && (
          <video src={previewUrl} controls playsInline className="aspect-video w-full object-cover" />
        )}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
            <Video size={28} />
            <span className="text-sm">Camera is off</span>
          </div>
        )}
        {phase === 'recording' && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {mmss}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
      )}

      <div className="flex justify-center gap-2">
        {phase === 'idle' && (
          <Button onClick={enableCamera}>
            <Video size={16} /> Enable camera
          </Button>
        )}
        {phase === 'ready' && (
          <Button variant="danger" onClick={startRecording}>
            <Circle size={14} /> Start recording
          </Button>
        )}
        {phase === 'recording' && (
          <Button variant="secondary" onClick={stopRecording}>
            <Square size={14} /> Stop
          </Button>
        )}
        {phase === 'recorded' && (
          <Button variant="secondary" onClick={retake}>
            <RefreshCw size={15} /> Re-record
          </Button>
        )}
      </div>
      {phase === 'ready' && (
        <p className="text-center text-xs text-slate-400">
          Tip: find good lighting and keep it under 2 minutes.
        </p>
      )}
    </div>
  )
}
