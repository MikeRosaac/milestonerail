import { AlertCircle, CheckCircle2, LoaderCircle, X, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { cn, initials, titleCase } from '../lib/utils'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-slate-950 text-white shadow-sm hover:bg-slate-800': variant === 'primary',
          'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50':
            variant === 'secondary',
          'text-slate-600 hover:bg-slate-100 hover:text-slate-950': variant === 'ghost',
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700': variant === 'danger',
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-4 text-sm': size === 'md',
          'h-12 px-5 text-base': size === 'lg',
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className,
      )}
      {...props}
    />
  )
}

const badgeTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  changes_requested: 'bg-amber-50 text-amber-800 ring-amber-600/15',
  mentor_approved: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  awaiting_finance: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  queued: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',
  processing: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  failed: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  learner: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  mentor: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  finance: 'bg-amber-50 text-amber-800 ring-amber-600/15',
  admin: 'bg-slate-900 text-white',
  system: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',
}

export function Badge({
  value,
  children,
  className,
}: {
  value?: string
  children?: ReactNode
  className?: string
}) {
  const resolved = value || String(children)
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        badgeTone[resolved] || 'bg-slate-100 text-slate-700 ring-slate-500/10',
        className,
      )}
    >
      {children || titleCase(resolved)}
    </span>
  )
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-800 ring-2 ring-white',
        {
          'size-8 text-[11px]': size === 'sm',
          'size-10 text-xs': size === 'md',
          'size-12 text-sm': size === 'lg',
        },
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <section
        ref={dialogRef}
        className="relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-950">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'danger'
  title: string
  children: ReactNode
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', {
        'border-blue-200 bg-blue-50 text-blue-900': tone === 'info',
        'border-emerald-200 bg-emerald-50 text-emerald-900': tone === 'success',
        'border-rose-200 bg-rose-50 text-rose-900': tone === 'danger',
      })}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{title}</p>
        <div className="mt-1 leading-6 opacity-80">{children}</div>
      </div>
    </div>
  )
}

export function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-slate-200/70', className)} />
}
