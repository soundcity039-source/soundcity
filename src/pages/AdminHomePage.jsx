import { useNavigate } from 'react-router-dom'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7' },
  header: {
    background: '#2d3748', color: '#fff', padding: '20px 20px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  title: { fontSize: 20, fontWeight: 700 },
  content: { padding: '24px 16px', maxWidth: 480, margin: '0 auto' },
  menuGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  menuCard: {
    background: '#fff', borderRadius: 12, padding: '24px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, cursor: 'pointer', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  menuIcon: { fontSize: 36 },
  menuLabel: { fontSize: 15, fontWeight: 600, color: '#333' },
}

const menus = [
  { label: 'ライブ管理', icon: '🎤', path: '/admin/lives' },
  { label: 'タイムテーブル', icon: '📅', path: '/admin/timetable' },
  { label: '出演費管理', icon: '💰', path: '/admin/fees' },
  { label: 'メンバー管理', icon: '👥', path: '/admin/members' },
]

export default function AdminHomePage() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.title}>管理画面</span>
      </div>
      <div style={s.content}>
        <div style={s.menuGrid}>
          {menus.map(menu => (
            <button key={menu.path} style={s.menuCard} onClick={() => navigate(menu.path)}>
              <span style={s.menuIcon}>{menu.icon}</span>
              <span style={s.menuLabel}>{menu.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
