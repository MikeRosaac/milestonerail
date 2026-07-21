import { afterEach, describe, expect, it, vi } from 'vitest'
import { cn, formatDate, formatMoney, initials, sleep, timeAgo, titleCase } from './utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('display utilities', () => {
  it('formats cohort money and dates consistently', () => {
    expect(formatMoney(45_000)).toBe('₦45,000')
    expect(formatMoney(45_000, 'USD')).toBe('US$45,000')
    expect(formatDate('2026-07-24T12:00:00', 'd MMM yyyy')).toBe('24 Jul 2026')
  })

  it('formats relative time against the current clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-21T12:00:00.000Z'))

    expect(timeAgo('2026-07-20T12:00:00.000Z')).toBe('1 day ago')
    expect(timeAgo('2026-07-21T14:00:00.000Z')).toBe('in 2 hours')
  })

  it('builds initials and readable labels', () => {
    expect(initials('Amara Okafor')).toBe('AO')
    expect(initials('Nia Kemi Adeyemi')).toBe('NK')
    expect(titleCase('awaiting_finance')).toBe('Awaiting Finance')
  })

  it('merges conditional and conflicting Tailwind classes', () => {
    expect(cn('px-2 text-sm', { hidden: false }, ['font-bold', 'px-4'])).toBe(
      'text-sm font-bold px-4',
    )
  })

  it('resolves sleep only after the requested delay', async () => {
    vi.useFakeTimers()
    let resolved = false
    const pending = sleep(50).then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(49)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(resolved).toBe(true)
  })
})
