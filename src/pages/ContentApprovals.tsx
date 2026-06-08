import { useMemo, useState } from 'react'
import {
  BookOpen,
  Calculator,
  Check,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Mail,
  MessageSquare,
  Users,
  X,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAppState } from '../state/AppState'
import { useToast } from '../components/ui/Toast'
import { postStatusMeta } from '../lib/status'
import { formatDate, relativeDay } from '../lib/format'
import type { PostChannel, SocialPost } from '../types'

const channelIcon: Record<PostChannel, React.ReactNode> = {
  Facebook: <Facebook size={15} />,
  LinkedIn: <Linkedin size={15} />,
  Instagram: <Instagram size={15} />,
  Blog: <BookOpen size={15} />,
  Email: <Mail size={15} />,
}

const imageIcon: Record<string, React.ReactNode> = {
  chart: <ImageIcon size={28} />,
  calculator: <Calculator size={28} />,
  people: <Users size={28} />,
  book: <BookOpen size={28} />,
  mail: <Mail size={28} />,
}

type Filter = 'all' | 'pending' | 'approved' | 'changes_requested'

export function ContentApprovals() {
  const { posts, setPostStatus } = useAppState()
  const notify = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [feedbackFor, setFeedbackFor] = useState<SocialPost | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const filtered = useMemo(() => {
    const list = filter === 'all' ? posts : posts.filter((p) => p.status === filter)
    return [...list].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
  }, [posts, filter])

  const pendingCount = posts.filter((p) => p.status === 'pending').length

  const approve = (post: SocialPost) => {
    setPostStatus(post.id, 'approved')
    notify(`"${post.title}" approved — scheduled for ${formatDate(post.scheduledFor)}.`)
  }

  const submitFeedback = () => {
    if (!feedbackFor) return
    setPostStatus(feedbackFor.id, 'changes_requested', feedbackText.trim() || undefined)
    notify(`Changes requested on "${feedbackFor.title}".`)
    setFeedbackFor(null)
    setFeedbackText('')
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: `Awaiting review${pendingCount ? ` (${pendingCount})` : ''}` },
    { key: 'approved', label: 'Approved' },
    { key: 'changes_requested', label: 'Changes requested' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Review and approve the content your marketing team has scheduled. Approving
          publishes on the planned date; requesting changes sends it back with your notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ' +
              (filter === f.key
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((post) => {
          const meta = postStatusMeta[post.status]
          return (
            <Card key={post.id} className="flex flex-col overflow-hidden">
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-400">
                {imageIcon[post.imageUrl ?? ''] ?? <ImageIcon size={28} />}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge tone="blue">
                    {channelIcon[post.channel]}
                    {post.channel}
                  </Badge>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{post.title}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Scheduled {formatDate(post.scheduledFor)} · {relativeDay(post.scheduledFor)}
                </p>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{post.body}</p>

                {post.hashtags.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-brand-600">
                    {post.hashtags.join(' ')}
                  </p>
                )}

                {post.status === 'changes_requested' && post.feedback && (
                  <div className="mt-3 flex gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                    <MessageSquare size={14} className="mt-0.5 shrink-0" />
                    <span>{post.feedback}</span>
                  </div>
                )}

                {post.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="success" size="sm" className="flex-1" onClick={() => approve(post)}>
                      <Check size={15} /> Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setFeedbackFor(post)}
                    >
                      <X size={15} /> Request changes
                    </Button>
                  </div>
                )}
                {post.status === 'approved' && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Check size={14} /> Approved & scheduled
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          No posts match this filter.
        </Card>
      )}

      <Modal
        open={feedbackFor !== null}
        onClose={() => setFeedbackFor(null)}
        title="Request changes"
        subtitle={feedbackFor?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFeedbackFor(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitFeedback}>
              Send back to team
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-sm font-medium text-slate-700">
          What would you like changed?
        </label>
        <textarea
          autoFocus
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={4}
          placeholder="e.g. Soften the headline and add a call to action to book a review."
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </Modal>
    </div>
  )
}
