import { BellRing, CalendarDays, LayoutDashboard, Settings } from './icons'
import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'
import { cn } from '../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Layout({ onLogout }: { onLogout: () => void }) {
  const { clinic } = useStore()
  return (
    <div className="min-h-screen bg-[#f5f7f2] text-[#18211b]">
      <div className="border-b border-[#dfe5d8] bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f6f4a] text-white"><BellRing size={18} /></div>
          <div><div className="text-sm font-semibold">Clinic Reminder</div><div className="text-xs text-[#66756b]">{clinic.name}</div></div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium', isActive ? 'bg-[#e8f3ec] text-[#1f6f4a]' : 'text-[#4f5f55] bg-[#f7faf5]')}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
          <button onClick={onLogout} className="shrink-0 rounded-xl bg-[#f7faf5] px-3 py-2 text-sm font-medium text-[#425349]">Sign out</button>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-6 rounded-3xl border border-[#dfe5d8] bg-white p-5 shadow-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f6f4a] text-white">
                <BellRing size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold">Clinic Reminder</div>
                <div className="text-xs text-[#66756b]">{clinic.name}</div>
              </div>
            </div>
            <nav className="space-y-1">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-[#e8f3ec] text-[#1f6f4a]' : 'text-[#4f5f55] hover:bg-[#f3f6f1]',
                    )
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button onClick={onLogout} className="mt-6 w-full rounded-2xl border border-[#d7ddd1] px-3 py-2.5 text-sm font-medium text-[#425349] hover:bg-[#f7faf5]">Sign out</button>
            <div className="mt-4 rounded-2xl bg-[#f7faf5] p-4 text-xs text-[#5f6f65]">
              <div className="font-medium text-[#223129]">SMS-first MVP</div>
              <p className="mt-1 leading-5">Track reminders, confirmations, and no-shows without replacing existing records.</p>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}