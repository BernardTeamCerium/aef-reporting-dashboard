import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Copy,
  ExternalLink,
  MessageSquarePlus,
  Star,
  Store,
  ThumbsUp,
  UserPlus,
  Video as VideoIcon,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { RequestReviewModal } from '../components/reviews/RequestReviewModal'
import { useClients, type Client, type CustomerReview } from '../state/Clients'
import { initialsOf, publicReviewUrl } from '../lib/reviewsUtil'
import { cx, formatDate } from '../lib/format'

export function Reviews() {
  const { clients, reviews, settings, setPostedToGoogle } = useClients()
  const notify = useToast()
  const [requestClient, setRequestClient] = useState<Client | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)

  const link = publicReviewUrl(settings)

  const stats = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === 'number')
    const avg = rated.length
      ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1)
      : '—'
    const requested = clients.filter((c) => c.reviewStatus !== 'none')
    const reviewed = clients.filter((c) => c.reviewStatus === 'reviewed')
    const responseRate = requested.length
      ? Math.round((reviewed.length / requested.length) * 100)
      : 0
    return {
      collected: reviews.length,
      avg,
      videos: reviews.filter((r) => r.type === 'video').length,
      responseRate,
    }
  }, [reviews, clients])

  const pending = clients.filter((c) => c.reviewStatus !== 'reviewed')

  const openRequest = (client: Client | null) => {
    setRequestClient(client)
    setRequestOpen(true)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      notify('Review link copied.')
    } catch {
      notify('Copy failed.')
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Collect written and video reviews from your clients, request them by text or email, and
        send happy clients straight to Google.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Star size={18} />} value={stats.avg} label="Average rating" />
        <Stat icon={<ThumbsUp size={18} />} value={stats.collected} label="Reviews collected" />
        <Stat icon={<VideoIcon size={18} />} value={stats.videos} label="Video testimonials" />
        <Stat icon={<MessageSquarePlus size={18} />} value={`${stats.responseRate}%`} label="Response rate" />
      </div>

      {/* Review link */}
      <Card>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Your review link</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Share it anywhere — clients can leave a written or video review.
            </p>
            <code className="mt-2 block truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {link}
            </code>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={copyLink}>
              <Copy size={15} /> Copy
            </Button>
            <a href={link} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <ExternalLink size={15} /> Preview
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Request reviews */}
      <Card>
        <CardHeader
          title="Request a review"
          subtitle="Text or email your clients a request in one click"
          icon={<MessageSquarePlus size={18} />}
          action={
            <div className="flex gap-2">
              <Link to="/clients">
                <Button size="sm" variant="secondary">
                  <UserPlus size={14} /> Manage clients
                </Button>
              </Link>
              <Button size="sm" onClick={() => openRequest(null)}>
                Share link
              </Button>
            </div>
          }
        />
        <div className="divide-y divide-slate-100">
          {pending.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={c.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.email || c.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.reviewStatus === 'requested' && <Badge tone="amber">Requested</Badge>}
                <Button size="sm" onClick={() => openRequest(c)}>
                  Request
                </Button>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Every client has reviewed — nice work!
            </p>
          )}
        </div>
      </Card>

      {/* Collected reviews */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Collected reviews</h3>
        {reviews.length === 0 ? (
          <Card className="p-10 text-center text-sm text-slate-400">
            No reviews yet. Share your link to start collecting.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                googleUrl={settings.googleReviewUrl}
                onTogglePosted={() => setPostedToGoogle(r.id, !r.postedToGoogle)}
                onCopy={async () => {
                  try {
                    await navigator.clipboard.writeText(r.text ?? '')
                    notify('Review text copied.')
                  } catch {
                    notify('Copy failed.')
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <RequestReviewModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        client={requestClient}
      />
    </div>
  )
}

function ReviewCard({
  review,
  googleUrl,
  onTogglePosted,
  onCopy,
}: {
  review: CustomerReview
  googleUrl: string
  onTogglePosted: () => void
  onCopy: () => void
}) {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={review.clientName} />
          <div>
            <p className="text-sm font-medium text-slate-800">{review.clientName}</p>
            <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        {review.type === 'video' ? (
          <Badge tone="purple">
            <VideoIcon size={12} /> Video
          </Badge>
        ) : (
          <Stars value={review.rating ?? 0} />
        )}
      </div>

      {review.type === 'video' ? (
        review.videoUrl ? (
          <video src={review.videoUrl} controls playsInline className="aspect-video w-full rounded-lg bg-slate-900 object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
            Video recorded this session
          </div>
        )
      ) : (
        <p className="flex-1 text-sm text-slate-600">“{review.text}”</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {review.postedToGoogle ? (
          <Badge tone="green">
            <Store size={12} /> Posted to Google
          </Badge>
        ) : (
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary">
              <Store size={13} /> Post to Google
            </Button>
          </a>
        )}
        <div className="flex items-center gap-1">
          {review.type === 'text' && (
            <button
              onClick={onCopy}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Copy review"
              title="Copy review text"
            >
              <Copy size={15} />
            </button>
          )}
          <button
            onClick={onTogglePosted}
            className={cx(
              'rounded-lg px-2 py-1 text-xs font-medium',
              review.postedToGoogle
                ? 'text-slate-400 hover:bg-slate-100'
                : 'text-emerald-600 hover:bg-emerald-50',
            )}
          >
            {review.postedToGoogle ? 'Mark unposted' : 'Mark posted'}
          </button>
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}
        />
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
      {initialsOf(name)}
    </span>
  )
}
