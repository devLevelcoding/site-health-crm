import { useState } from 'react'
import Sidebar, { type NavItem } from './components/Sidebar'
import ClientsView from './components/ClientsView'
import SettingsView from './components/SettingsView'

const NAV: NavItem[] = [
  { key: 'clients', label: 'Clients' },
  { key: 'settings', label: 'Settings' },
]

export default function App() {
  const [active, setActive] = useState('clients')

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-[13px]">
      <header className="flex items-center gap-3 h-[46px] px-5 border-b border-border bg-surface flex-shrink-0">
        <span className="text-[15px] font-extrabold tracking-tight text-accent">
          site<span className="text-txt2 font-normal">health</span>
        </span>
        <div className="flex-1" />
        <span className="text-xs text-txt2">Type 2 &middot; Hybrid (leadMarketing-primary)</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={NAV} selected={active} onSelect={setActive} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {active === 'clients' && <ClientsView />}
          {active === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}
