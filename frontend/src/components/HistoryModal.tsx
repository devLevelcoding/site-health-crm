import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getResource } from '../api'
import type { Client, LighthouseScan } from '../types'

interface Props {
  clientId: number
  onClose: () => void
}

function scoreColor(v: number): string {
  if (v >= 70) return 'text-ok'
  if (v >= 40) return 'text-accent'
  return 'text-danger'
}

export default function HistoryModal({ clientId, onClose }: Props) {
  const [client, setClient] = useState<(Client & { scans: LighthouseScan[] }) | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getResource<Client & { scans: LighthouseScan[] }>(`clients/${clientId}`)
      .then(setClient)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
  }, [clientId])

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-surface border border-border rounded max-w-lg w-full max-h-[80vh] flex flex-col slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-txt">{client?.name ?? 'Scan history'}</h2>
          <button onClick={onClose} className="text-txt2 hover:text-txt text-sm">✕</button>
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin flex-1">
          {error && <div className="text-danger text-xs mb-3">{error}</div>}
          {!client ? (
            <div className="text-txt2 text-xs">Loading…</div>
          ) : client.scans.length === 0 ? (
            <div className="text-txt2 text-xs">No scans yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-txt2 border-b border-border">
                  <th className="py-1.5">Date</th>
                  <th className="py-1.5">Security</th>
                  <th className="py-1.5">SEO</th>
                  <th className="py-1.5">Tracking</th>
                  <th className="py-1.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {client.scans.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-1.5 text-txt2">{new Date(s.scannedAt).toLocaleDateString()}</td>
                    <td className={`py-1.5 font-medium ${scoreColor(s.secScore)}`}>{s.secScore}</td>
                    <td className={`py-1.5 font-medium ${scoreColor(s.seoScore)}`}>{s.seoScore}</td>
                    <td className={`py-1.5 font-medium ${scoreColor(s.semScore)}`}>{s.semScore}</td>
                    <td className="py-1.5 text-txt font-semibold">{s.secScore + s.seoScore + s.semScore} / 300</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
