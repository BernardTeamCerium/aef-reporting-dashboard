import { useState } from 'react'
import { CheckCircle2, ExternalLink, PenLine, Star, Video } from 'lucide-react'
import { OneStopMark } from '../../components/Logo'
import { Button } from '../../components/ui/Button'
import { VideoRecorder } from '../../components/reviews/VideoRecorder'
import { useClients } from '../../state/Clients'
import { useNotify } from '../../state/Notifications'
import { cx } from '../../lib/format'

type Mode = 'choose' | 'text' | 'video'

export function ReviewCollect() {
  const { settings, addReview } = useClients()
  const pushNotify = useNotify()
  const [mode, setMode] = useState<Mode>('choose')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [video, setVideo] = useState<{ url: string; blob: Blob } | null>(null)
  const [submitted, setSubmitted] = useState<null | { happy: boolean; type: 'text' | 'video' }>(null)

  const happy = rating >= 4

  const notifyReview = (who: string, kind: string) =>
    pushNotify({
      audience: 'advisor',
      type: 'review_received',
      title: 'New review received',
      body: `${who} left a ${kind}.`,
      link: '/reviews',
    })

  const submitText = () => {
    const who = name.trim() || 'A client'
    addReview({
      clientName: name.trim() || 'Anonymous',
      type: 'text',
      rating,
      text: text.trim(),
    })
    notifyReview(who, `${rating}-star review`)
    setSubmitted({ happy, type: 'text' })
  }

  const submitVideo = () => {
    if (!video) return
    const who = name.trim() || 'A client'
    addReview({
      clientName: name.trim() || 'Anonymous',
      type: 'video',
      rating: rating || undefined,
      videoUrl: video.url,
    })
    notifyReview(who, 'video testimonial')
    setSubmitted({ happy: rating === 0 ? true : happy, type: 'video' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <OneStopMark className="h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">{settings.firmName}</h1>
          <p className="text-sm text-slate-500">We'd love your feedback</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {submitted ? (
            <ThankYou
              submitted={submitted}
              googleUrl={settings.googleReviewUrl}
              firmName={settings.firmName}
            />
          ) : (
            <>
              {/* Rating */}
              <p className="text-center text-sm font-medium text-slate-700">
                How was your experience?
              </p>
              <div className="mt-3 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    className="p-1"
                  >
                    <Star
                      size={34}
                      className={cx(
                        'transition-colors',
                        (hover || rating) >= n
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300',
                      )}
                    />
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <div className="mt-6">
                  {mode === 'choose' && (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-slate-500">
                        How would you like to share it?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <ChoiceCard icon={<PenLine size={20} />} label="Write a review" onClick={() => setMode('text')} />
                        <ChoiceCard icon={<Video size={20} />} label="Record a video" onClick={() => setMode('video')} />
                      </div>
                    </div>
                  )}

                  {mode === 'text' && (
                    <div className="space-y-3">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={inputCls}
                      />
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        placeholder={
                          happy
                            ? 'What did you love about working with us?'
                            : 'Tell us what we could have done better…'
                        }
                        className={cx(inputCls, 'resize-none')}
                      />
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setMode('choose')}>
                          Back
                        </Button>
                        <Button className="flex-1" onClick={submitText} disabled={text.trim().length < 3}>
                          Submit review
                        </Button>
                      </div>
                    </div>
                  )}

                  {mode === 'video' && (
                    <div className="space-y-3">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={inputCls}
                      />
                      <VideoRecorder onRecorded={setVideo} />
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setMode('choose')}>
                          Back
                        </Button>
                        <Button className="flex-1" onClick={submitVideo} disabled={!video}>
                          Submit video
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Powered by OneStop Print &amp; Digital Marketing
        </p>
      </div>
    </div>
  )
}

function ChoiceCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon}
      </span>
      {label}
    </button>
  )
}

function ThankYou({
  submitted,
  googleUrl,
  firmName,
}: {
  submitted: { happy: boolean; type: 'text' | 'video' }
  googleUrl: string
  firmName: string
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={30} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Thank you!</h2>
      {submitted.happy ? (
        <>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            We're so glad you had a great experience. Would you share it on Google to help others
            find {firmName}?
          </p>
          <a href={googleUrl} target="_blank" rel="noreferrer" className="mt-4 w-full">
            <Button className="w-full">
              <Star size={16} className="fill-white" /> Post my review on Google
              <ExternalLink size={14} />
            </Button>
          </a>
        </>
      ) : (
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          We appreciate your honest feedback — it goes straight to our team so we can make things
          right.
        </p>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
