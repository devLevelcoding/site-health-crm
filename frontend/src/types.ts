export interface Client {
  id: number
  name: string
  website: string
  phone?: string | null
  email?: string | null
  createdAt: string
  latestScore?: number | null
  needsRedesign?: boolean
}

export interface LighthouseScan {
  id: number
  clientId: number
  url: string
  scannedAt: string
  secScore: number
  seoScore: number
  semScore: number
  statusCode?: number | null
  error?: string | null
}

export interface Settings {
  id: number
  intervalDays: number
}
