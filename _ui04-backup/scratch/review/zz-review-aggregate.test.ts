import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  addDays, buildPerformance, classifyPerformance, combineSummaries, daysInRange, fetchWindow, filterPerformance,
  latestDataDate, localToday, percentChange, previousPeriod, resolvePreset, rowsInRange, summarize,
} from '@/features/dashboard/aggregate'
import { formatDate, formatInteger, formatMoney, formatPercent, formatRoas, formatChange } from '@/features/dashboard/format'
import { sortPerformance, DEFAULT_SORT } from '@/features/dashboard/sort'
import { parseFilters, filtersToQuery } from '@/features/dashboard/filters'
import type { Campaign, DailyMetric } from '@/types'

const seed: Record<string, DailyMetric[]> = JSON.parse(readFileSync('/home/user/ui04-work/scratch/review/seed.json', 'utf8'))
const names: Record<string, [string, Campaign['platform']]> = {
  '770e8400-e29b-41d4-a716-44665544000a': ['Summer Collection Push', 'meta'],
  '770e8400-e29b-41d4-a716-44665544000b': ['Winter Pre-Launch', 'google'],
  '770e8400-e29b-41d4-a716-44665544000c': ['Flash Sale Banner', 'meta'],
  '770e8400-e29b-41d4-a716-44665544000d': ['Evergreen Basics', 'google'],
}
const campaigns: Campaign[] = Object.entries(names).map(([id, [name, platform]]) => ({ id, name, platform, status: 'active', objective: null, budget: null, start_date: null, end_date: null }))
const m = (date: string, spend: number, revenue: number, clicks: number, impressions: number, conversions: number): DailyMetric =>
  ({ date, spend, revenue, clicks, impressions, conversions, ctr: null, cpc: null, cpa: null, roas: null })

describe('seed cross-check', () => {
  const window = fetchWindow('2026-10-21')
  const latest = latestDataDate(seed)!
  for (const [preset, exp] of [
    ['all', ['35,474.85', '52,669', '1,942', '2.30%', '18.27', '2.74×']],
    ['90d', ['35,474.85', '52,669', '1,942', '2.30%', '18.27', '2.74×']],
    ['30d', ['12,453.51', '16,753', '561', '2.08%', '22.20', '2.33×']],
    ['7d', ['2,935.12', '3,892', '125', '2.09%', '23.48', '2.18×']],
  ] as const) {
    it(preset, () => {
      const range = resolvePreset(preset, latest, window)
      const rows = buildPerformance(campaigns, seed, range)
      const s = combineSummaries(rows.map((r) => r.totals))
      expect([formatMoney(s.spend), formatInteger(s.clicks), formatInteger(s.conversions), formatPercent(s.ctr), formatMoney(s.cpa), formatRoas(s.roas)]).toEqual(exp)
      console.log(preset, range, rows.map((r) => `${r.campaign.name}:${r.flag} cpa=${r.totals.cpa?.toFixed(4)} roas=${r.totals.roas?.toFixed(4)}`).join(' | '), 'baselineCPA', s.cpa)
      const prev = previousPeriod(range)
      console.log(' prev', prev, summarize(Object.values(seed).flatMap((r) => rowsInRange(r, prev))).days)
    })
  }
  it('flags last 90 and last 30', () => {
    const f = (p: '90d' | '30d') => Object.fromEntries(buildPerformance(campaigns, seed, resolvePreset(p, latest, window)).map((r) => [r.campaign.name, r.flag]))
    expect(f('90d')).toEqual({ 'Summer Collection Push': 'weak', 'Winter Pre-Launch': 'strong', 'Flash Sale Banner': 'average', 'Evergreen Basics': 'weak' })
    expect(f('30d')).toEqual({ 'Summer Collection Push': 'average', 'Winter Pre-Launch': 'strong', 'Flash Sale Banner': 'weak', 'Evergreen Basics': 'weak' })
  })
  it('baseline independence', () => {
    const range = resolvePreset('30d', latest, window)
    const all = buildPerformance(campaigns, seed, range)
    const meta = filterPerformance(all, 'meta', 'all')
    expect(meta.map((r) => r.flag)).toEqual(all.filter((r) => r.campaign.platform === 'meta').map((r) => r.flag))
  })
})

describe('dates', () => {
  it('leap years and month boundaries', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(fetchWindow('2028-02-29')).toEqual({ from: '2027-03-01', to: '2028-02-29' })
    expect(daysInRange({ from: '2026-03-01', to: '2026-03-31' })).toBe(31)
    expect(daysInRange({ from: '2026-10-20', to: '2026-11-05' })).toBe(17)
  })
  it('localToday near midnight in local zone', () => {
    expect(localToday(new Date(2026, 9, 21, 0, 5))).toBe('2026-10-21')
    expect(localToday(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20')
  })
  it('formatDate does not shift', () => {
    expect(formatDate('2026-08-20')).toBe('20 Aug 2026')
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026')
  })
  it('preset resolution and previous period', () => {
    const w = fetchWindow('2026-10-21')
    expect(resolvePreset('7d', '2026-03-03', w)).toEqual({ from: '2026-02-25', to: '2026-03-03' })
    expect(previousPeriod({ from: '2026-02-25', to: '2026-03-03' })).toEqual({ from: '2026-02-18', to: '2026-02-24' })
  })
  it('PROBE: preset range extends before fetch window when data is old', () => {
    const w = fetchWindow('2026-10-21')
    const r = resolvePreset('90d', '2025-11-30', w)
    console.log('90d on old data', w, r, 'from before window?', r.from < w.from)
    const r30 = resolvePreset('30d', '2025-11-30', w)
    const p = previousPeriod(r30)
    console.log('30d prev', p, 'partially outside window?', p.from < w.from && p.to >= w.from)
  })
  it('PROBE: all preset label vs window length', () => {
    console.log('window days', daysInRange(fetchWindow('2026-10-21')))
  })
})

describe('flag rule edges', () => {
  const base = summarize([m('2026-01-01', 100, 300, 10, 100, 5)]) // cpa 20, roas 3
  it('exact CPA threshold 25 vs 1.25*20 is not weak', () => {
    expect(classifyPerformance(summarize([m('d', 25, 100, 1, 1, 1)]), base).flag).not.toBe('weak')
  })
  it('exact ROAS 1.0 is not weak', () => {
    expect(classifyPerformance(summarize([m('d', 10, 10, 1, 1, 1)]), base).flag).not.toBe('weak')
  })
  it('PROBE: float accumulation at exact threshold', () => {
    // campaign: spend 0.1+0.2 split across days = 0.3 exact decimal; 1 conversion -> CPA 0.3
    // baseline CPA 0.24 => 1.25*0.24 = 0.3 exactly in decimal
    const c = summarize([m('a', 0.1, 1, 1, 1, 0), m('b', 0.2, 1, 1, 1, 1)])
    const b = { ...c, cpa: 0.24, roas: 10 }
    console.log('campaign cpa', c.cpa, 'threshold', 1.25 * 0.24, 'flag', classifyPerformance(c, b))
  })
  it('spend > 0 zero revenue zero conv', () => {
    expect(classifyPerformance(summarize([m('d', 10, 0, 1, 1, 0)]), base)).toMatchObject({ flag: 'weak' })
  })
  it('spend > 0, revenue >= spend, zero conv -> weak no conversions', () => {
    expect(classifyPerformance(summarize([m('d', 10, 50, 1, 1, 0)]), base)).toEqual({ flag: 'weak', reason: 'Spend with no conversions' })
  })
  it('null baseline cpa', () => {
    const nb = summarize([m('d', 100, 300, 10, 100, 0)])
    expect(classifyPerformance(summarize([m('d', 10, 50, 1, 1, 1)]), nb).flag).toBe('average')
  })
  it('PROBE: single-campaign org', () => {
    const t = summarize([m('d', 10, 11, 1, 1, 1)])
    console.log('single campaign ROAS 1.1 flag:', buildPerformance([campaigns[0]], { [campaigns[0].id]: [m('2026-01-01', 10, 11, 1, 1, 1)] }, { from: '2026-01-01', to: '2026-01-01' })[0].flag, t.roas)
  })
  it('no-spend but clicks', () => {
    expect(classifyPerformance(summarize([m('d', 0, 0, 5, 50, 0)]), base).flag).toBe('no_data')
  })
  it('empty org', () => {
    expect(buildPerformance([], {}, { from: 'a', to: 'b' })).toEqual([])
    expect(latestDataDate({})).toBeNull()
    expect(combineSummaries([])).toMatchObject({ spend: 0, ctr: null, cpa: null, roas: null, days: 0 })
  })
  it('percentChange', () => {
    expect(percentChange(0, 0)).toBeNull()
    expect(percentChange(5, 0)).toBeNull()
    expect(formatChange(0)).toBe('0.0%')
    console.log('tiny change', formatChange(0.00001), formatChange(-0.00001))
  })
})

describe('sort', () => {
  it('default order', () => {
    const range = { from: '2026-05-23', to: '2026-08-20' }
    const rows = buildPerformance(campaigns, seed, range)
    console.log(sortPerformance(rows, DEFAULT_SORT).map((r) => `${r.flag}:${r.campaign.name}:${r.totals.spend.toFixed(2)}`))
  })
})

describe('filters', () => {
  it('garbage params', () => {
    const p = new URLSearchParams('range=__proto__&platform=constructor&status=toString')
    expect(parseFilters(p)).toEqual({ range: '90d', platform: 'all', status: 'all' })
    expect(filtersToQuery({ range: '90d', platform: 'all', status: 'all' })).toBe('')
  })
})
