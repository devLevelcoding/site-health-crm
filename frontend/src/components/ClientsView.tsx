import { useEffect, useState, type FormEvent } from 'react'
import { createResource, deleteResource, listResource, scanNow } from '../api'
import type { Client } from '../types'
import HistoryModal from './HistoryModal'

export default function ClientsView() {
  const [rows, setRows] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [values, setValues] = useState({ name: '', website: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [historyFor, setHistoryFor] = useState<number | null>(null)
  const [scanning, setScanning] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    listResource<Client>('clients')
      .then(r => { setRows(r.data); setError(null) })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createResource('clients', values)
      setValues({ name: '', website: '', phone: '', email: '' })
      setFormOpen(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this client?')) return
    await deleteResource('clients', id)
    load()
  }

  const rescan = async (id: number) => {
    setScanning(id)
    try {
      await scanNow(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setScanning(null)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-txt">Clients</h1>
          <p className="text-xs text-txt2 mt-1">Adding a client runs its first Lighthouse scan immediately and schedules the next one.</p>
        </div>
        <button onClick={() => setFormOpen(f => !f)} className="px-3 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90">
          {formOpen ? 'Cancel' : '+ New Client'}
        </button>
      </div>

      {error && <div className="mb-4 px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-xs">{error}</div>}

      {formOpen && (
        <form onSubmit={submit} className="mb-6 p-4 rounded border border-border bg-surface slide-up grid grid-cols-2 gap-3">
          <input required placeholder="Name *" value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))} className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm" />
          <input required placeholder="Website *" value={values.website} onChange={e => setValues(v => ({ ...v, website: e.target.value }))} className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm" />
          <input placeholder="Phone" value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm" />
          <input placeholder="Email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} className="px-2 py-1.5 rounded bg-surface2 border border-border text-txt text-sm" />
          <button type="submit" disabled={saving} className="col-span-2 px-4 py-1.5 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50">
            {saving ? 'Saving (running first scan)…' : 'Save'}
          </button>
        </form>
      )}

      <div className="rounded border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-txt2">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Website</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium w-1" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-txt2">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-txt2">Nothing here yet.</td></tr>
            ) : rows.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface2 transition-colors">
                <td className="px-3 py-2 text-txt">{c.name}</td>
                <td className="px-3 py-2 text-txt2">{c.website}</td>
                <td className="px-3 py-2">
                  {c.latestScore === null || c.latestScore === undefined ? (
                    <span className="text-txt2">—</span>
                  ) : (
                    <span className={c.needsRedesign ? 'text-danger font-medium' : 'text-ok font-medium'}>
                      {c.latestScore} / 300{c.needsRedesign ? ' — needs redesign' : ''}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => void rescan(c.id)} disabled={scanning === c.id} className="text-xs text-accent hover:underline mr-3 disabled:opacity-50">
                    {scanning === c.id ? 'Scanning…' : 'Scan Now'}
                  </button>
                  <button onClick={() => setHistoryFor(c.id)} className="text-xs text-txt2 hover:text-txt hover:underline mr-3">History</button>
                  <button onClick={() => void remove(c.id)} className="text-xs text-danger hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historyFor !== null && <HistoryModal clientId={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}
