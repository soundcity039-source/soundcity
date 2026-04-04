import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7' },
  header: {
    background: '#06C755', color: '#fff', padding: '20px 20px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: '#fff2' },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  headerText: {},
  greeting: { fontSize: 13, opacity: 0.85 },
  name: { fontSize: 18, fontWeight: 700 },
  content: { padding: '24px 16px', maxWidth: 480, margin: '0 auto' },
  menuGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  menuCard: {
    background: '#fff', borderRadius: 12, padding: '24px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, cursor: 'pointer', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'transform 0.1s',
  },
  menuIcon: { fontSize: 36 },
  menuLabel: { fontSize: 15, fontWeight: 600, color: '#333' },
  adminCard: { background: '#fff5f5', border: '1px solid #fed7d7' },
}

const menus = [
  { label: '応募する', icon: '🎸', path: '/live-select', adminOnly: false },
  { label: '応募一覧', icon: '📋', path: '/applications', adminOnly: false },
  { label: 'メンバー', icon: '👥', path: '/members', adminOnly: false },
  { label: '管理画面', icon: '⚙️', path: '/admin', adminOnly: true },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()

  const visibleMenus = menus.filter(m => !m.adminOnly || currentUser?.is_admin)

  return (
    <div style={s.page}>
      <div style={s.header}>
        {currentUser?.photo_url
          ? <img src={currentUser.photo_url} alt="" style={s.avatar} />
          : <div style={s.avatarPlaceholder}>🎵</div>
        }
        <div style={s.headerText}>
          <div style={s.greeting}>こんにちは！</div>
          <div style={s.name}>{currentUser?.full_name || 'メンバー'}</div>
        </div>
      </div>
      <div style={s.content}>
        <div style={s.menuGrid}>
          {visibleMenus.map(menu => (
            <button
              key={menu.path}
              style={{ ...s.menuCard, ...(menu.adminOnly ? s.adminCard : {}) }}
              onClick={() => navigate(menu.path)}
            >
              <span style={s.menuIcon}>{menu.icon}</span>
              <span style={s.menuLabel}>{menu.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
