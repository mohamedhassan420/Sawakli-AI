import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '@/app/(app)/dashboard/page'
import CampaignsPage from '@/app/(app)/campaigns/page'
import { getSession } from '@/lib/session'
import { getCampaignMetrics, getCampaigns } from '@/services/campaigns.service'
import { ALPHA, BETA, METRICS, SESSION } from './helpers/dashboard-fixtures'
import { renderWithClient } from './helpers/render'

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
}))
vi.mock('@/lib/session', () => ({ getSession: vi.fn(), clearSession: vi.fn() }))
vi.mock('@/lib/auth-redirect', () => ({ redirectToLogin: vi.fn() }))
vi.mock('@/services/campaigns.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/campaigns.service')>()),
  getCampaigns: vi.fn(),
  getCampaignMetrics: vi.fn(),
}))

describe('probe', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(SESSION)
    vi.mocked(getCampaigns).mockImplementation(async () => { console.log('getCampaigns call', new Error().stack?.split('\n').slice(2, 9).join(' <- ')); return [ALPHA, BETA] })
    vi.mocked(getCampaignMetrics).mockImplementation(async (_o, id) => METRICS[id] ?? [])
  })
  afterEach(() => vi.clearAllMocks())
  it('dashboard call counts', async () => {
    renderWithClient(<DashboardPage />)
    await screen.findByTestId('kpi-spend')
    await new Promise((r) => setTimeout(r, 50))
    console.log('dashboard getCampaigns', vi.mocked(getCampaigns).mock.calls.length, 'metrics', vi.mocked(getCampaignMetrics).mock.calls.length)
  })
  it('campaigns call counts', async () => {
    renderWithClient(<CampaignsPage />)
    await screen.findByText('Alpha Push')
    await new Promise((r) => setTimeout(r, 50))
    console.log('campaigns getCampaigns', vi.mocked(getCampaigns).mock.calls.length, 'metrics', vi.mocked(getCampaignMetrics).mock.calls.length)
  })
  it('weak row a11y', async () => {
    const { container } = renderWithClient(<CampaignsPage />)
    await screen.findByText('Alpha Push')
    console.log(container.querySelector('tr.row-weak')?.textContent, [...container.querySelectorAll('th')].map((t) => t.getAttribute('aria-sort')).join(','))
  })
})
