import { useNavigate } from 'react-router-dom'

const items = [
  { label: 'ライブに応募する', icon: '🎸', path: '/live-select', color: '#dcfce7', desc: '開催中のライブに企画を応募する' },
  { label: '応募一覧を見る',   icon: '📋', path: '/applications', color: '#fef3c7', desc: '自分の応募済み企画を確認する' },
]

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'var(--header-grad)', color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
  },
  headerCircle: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  content: { padding: '20px 16px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '20px 18px', borderRadius: 16, cursor: 'pointer',
    border: 'none', textAlign: 'left', width: '100%', boxSizing: 'border-box',
    position: 'relative', overflow: 'hidden',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, marginBottom: 12,
    background: 'rgba(255,255,255,0.6)',
  },
  label: { fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  desc: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  arrow: { position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8' },
}

export default function LiveMenuPage() {
  const navigate = useNavigate()
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>ライブ</span>
      </div>
      <div style={s.content}>
        {items.map(item => (
          <button key={item.path} style={{ ...s.card, background: item.color }} onClick={() => navigate(item.path)}>
            <div style={s.iconCircle}>{item.icon}</div>
            <span style={s.label}>{item.label}</span>
            <span style={s.desc}>{item.desc}</span>
            <span style={s.arrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
