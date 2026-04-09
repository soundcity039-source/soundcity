import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const tabs = [
  { label: 'ホーム',   icon: '🏠', path: '/home' },
  { label: '応募',     icon: '🎸', path: '/live-select' },
  { label: 'メンバー', icon: '👥', path: '/members' },
  { label: 'マイページ', icon: '👤', path: '/profile/edit' },
  { label: '連絡',     icon: '✉️', path: '/contact' },
  { label: '管理',     icon: '⚙️', path: '/admin', adminOnly: true },
]

const s = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#0f172a',
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    padding: '8px 4px calc(8px + env(safe-area-inset-bottom))',
    zIndex: 100,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  tab: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, flex: 1, cursor: 'pointer', background: 'none',
    border: 'none', padding: '2px 0',
  },
  pill: {
    width: 40, height: 28, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  pillActive: { background: 'rgba(6, 199, 85, 0.18)' },
  icon: { fontSize: 20, lineHeight: 1 },
  label: { fontSize: 9, color: '#475569', fontWeight: 500 },
  labelActive: { fontSize: 9, color: '#06C755', fontWeight: 700 },
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useApp()

  const visibleTabs = tabs.filter(t => !t.adminOnly || currentUser?.is_admin)

  return (
    <nav style={s.nav}>
      {visibleTabs.map(tab => {
        const active = location.pathname === tab.path ||
          (tab.path !== '/home' && location.pathname.startsWith(tab.path))
        return (
          <button key={tab.path} style={s.tab} onClick={() => navigate(tab.path)}>
            <div style={{ ...s.pill, ...(active ? s.pillActive : {}) }}>
              <span style={s.icon}>{tab.icon}</span>
            </div>
            <span style={active ? s.labelActive : s.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function BottomNavSpacer() {
  return <div style={{ height: 72 }} />
}
