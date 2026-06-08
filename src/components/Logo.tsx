import { cx } from '../lib/format'

/**
 * OneStop Print & Digital logo.
 *
 * `mark` renders just the rotating-ring icon; the full logo adds the
 * "OneStop" wordmark and tagline. This is a hand-built SVG recreation of the
 * brand mark — drop in the official asset at /public if you want pixel-perfect
 * fidelity and swap the <OneStopMark> below for an <img>.
 */

export function OneStopMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="OneStop">
      <defs>
        <linearGradient id="osGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a1e" />
          <stop offset="55%" stopColor="#fb5e0c" />
          <stop offset="100%" stopColor="#f23c06" />
        </linearGradient>
      </defs>

      <g fill="url(#osGrad)" stroke="url(#osGrad)">
        {/* Center "O" ring */}
        <circle cx="34" cy="33" r="11" fill="none" strokeWidth="8.5" />

        {/* Upper rotation arc with arrowhead on the top-left */}
        <path
          d="M54.7 25.5 A22 22 0 0 0 14.5 24.2"
          fill="none"
          strokeWidth="4.6"
          strokeLinecap="round"
        />
        <path d="M9 18.5 L20.5 20 L13.5 29.5 Z" strokeWidth="0" />

        {/* Lower rotation arc with arrowhead on the bottom-right */}
        <path
          d="M13.3 40.5 A22 22 0 0 0 53.5 41.8"
          fill="none"
          strokeWidth="4.6"
          strokeLinecap="round"
        />
        <path d="M59 47.5 L47.5 46 L54.5 36.5 Z" strokeWidth="0" />

        {/* Pixel trail off the top-left */}
        <g strokeWidth="0">
          <rect x="6.5" y="13.5" width="5" height="5" rx="1" transform="rotate(45 9 16)" opacity="0.9" />
          <rect x="2.5" y="9.5" width="4.2" height="4.2" rx="1" transform="rotate(45 4.6 11.6)" opacity="0.65" />
          <rect x="0" y="6.2" width="3.4" height="3.4" rx="0.8" transform="rotate(45 1.7 7.9)" opacity="0.4" />
        </g>
      </g>
    </svg>
  )
}

interface LogoProps {
  /** Show the "OneStop" wordmark + tagline next to the mark. */
  showWordmark?: boolean
  className?: string
  /** Tailwind size classes for the mark, e.g. "h-9 w-9". */
  markClassName?: string
}

export function Logo({
  showWordmark = true,
  className,
  markClassName = 'h-10 w-10',
}: LogoProps) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <OneStopMark className={markClassName} />
      {showWordmark && (
        <div className="leading-none">
          <p className="text-lg font-extrabold tracking-tight">
            <span className="text-white">One</span>
            <span className="text-brand-500">Stop</span>
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Print &amp; Digital Marketing
          </p>
        </div>
      )}
    </div>
  )
}
