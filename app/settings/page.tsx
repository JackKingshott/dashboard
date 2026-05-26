'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, CheckCircle, Link2, Unlink, Save, CreditCard, Calendar, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCIES } from '@/lib/utils'

interface Settings {
  business_name: string
  default_currency: string
  tax_rate: string
}

export default function SettingsPage() {
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>({
    business_name: '',
    default_currency: 'GBP',
    tax_rate: '20',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stripeConfigured = !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  useEffect(() => {
    // Check calendar status
    fetch('/api/calendar/status')
      .then((r) => r.json())
      .then((data) => setCalendarConnected(data.connected))
      .catch(() => setCalendarConnected(false))

    // Get auth URL
    fetch('/api/calendar/auth')
      .then((r) => r.json())
      .then((data) => data.url && setAuthUrl(data.url))
      .catch(() => {})

    // Load settings
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object' && !data.error) {
          setSettings({
            business_name: data.business_name ?? '',
            default_currency: data.default_currency ?? 'GBP',
            tax_rate: data.tax_rate ?? '20',
          })
        }
      })
      .catch(() => {})
  }, [])

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnectCalendar() {
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' })
      setCalendarConnected(false)
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure your dashboard integrations and preferences</p>
      </div>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Stripe Integration</CardTitle>
              <CardDescription>Accept payments and send invoices via Stripe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Stripe is connected</p>
                  <p className="text-xs text-green-600">Invoices can be sent and payments accepted</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Dashboard
                </a>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                Add your Stripe API keys to <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">.env.local</code> to enable invoice sending and payment processing.
              </p>
              <div className="space-y-1">
                <p className="text-xs font-mono text-gray-500">STRIPE_SECRET_KEY=sk_live_...</p>
                <p className="text-xs font-mono text-gray-500">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Get API Keys
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription>View and schedule meetings from your dashboard</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {calendarConnected === null ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              Checking connection...
            </div>
          ) : calendarConnected ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Google Calendar connected</p>
                  <p className="text-xs text-green-600">Upcoming meetings sync automatically</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnectCalendar}>
                <Unlink className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to see upcoming meetings and schedule events directly from your dashboard.
              </p>
              {authUrl ? (
                <Button asChild>
                  <a href={authUrl}>
                    <Link2 className="h-4 w-4" />
                    Connect Google Calendar
                  </a>
                </Button>
              ) : (
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 space-y-2">
                  <p className="text-sm text-gray-600">Add these to your environment to enable Google Calendar:</p>
                  <p className="text-xs font-mono text-gray-500">GOOGLE_CLIENT_ID=...</p>
                  <p className="text-xs font-mono text-gray-500">GOOGLE_CLIENT_SECRET=...</p>
                  <p className="text-xs font-mono text-gray-500">GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Building2 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-base">Business Info</CardTitle>
              <CardDescription>Default settings used for invoices and reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            {saved && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Settings saved successfully
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))}
                placeholder="Your Agency Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Default Currency</Label>
                <Select
                  value={settings.default_currency}
                  onValueChange={(v) => setSettings((s) => ({ ...s, default_currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings((s) => ({ ...s, tax_rate: e.target.value }))}
                  placeholder="20"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
