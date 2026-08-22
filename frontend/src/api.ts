const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3320'

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  })
  const d = (await r.json()) as T & { message?: string }
  if (!r.ok) throw new Error((d as { message?: string }).message ?? r.statusText)
  return d
}

export const listResource = <T>(resource: string): Promise<{ data: T[]; total: number }> =>
  req(`/${resource}?limit=100`)

export const getResource = <T>(resource: string): Promise<T> => req(`/${resource}`)

export const createResource = <T>(resource: string, body: Record<string, unknown>): Promise<T> =>
  req(`/${resource}`, { method: 'POST', body: JSON.stringify(body) })

export const patchResource = <T>(resource: string, id: number | '', body: Record<string, unknown>): Promise<T> =>
  req(`/${resource}${id === '' ? '' : `/${id}`}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteResource = (resource: string, id: number): Promise<void> =>
  req(`/${resource}/${id}`, { method: 'DELETE' })

export const scanNow = (clientId: number) => req(`/clients/${clientId}/scan`, { method: 'POST' })
