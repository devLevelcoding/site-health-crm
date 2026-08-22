import { useEffect, useState, type FormEvent } from 'react'
import { getResource, patchResource } from '../api'
import type { Settings } from '../types'

export default function SettingsView() {
  const [intervalDays, setIntervalDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getResource<Settings>('settings')
      .then(s => setIntervalDays(s.intervalDays))
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const s = await patchResource<Settings>('settings', '', { intervalDays })
      setIntervalDays(s.intervalDays)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-txt2 text-sm">Loading…</div>

  return (
    <div className="max-w-md">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-txt">Settings</h1>
        <p className="text-xs text-txt2 mt-1">How often clients get re-scanned.</p>
      </div>

      {error && <div className="mb-4 px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs">{error}</div>}
      {saved && <div className="mb-4 px-3 py-2 rounded bg-ok/10 border border-ok/30 text-ok text-xs">Saved.</div>}

      <form onSubmit={submit} className="p-4 rounded border border-border bg-surface flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-txt2">
          Re-scan interval (days)
          <input
            type="number"
            value={intervalDays}
            onChange={e => setIntervalDays(Number(e.target.value))}
            className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm"
          />
        </label>
        <button type="submit" disabled={saving} className="self-end px-4 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
