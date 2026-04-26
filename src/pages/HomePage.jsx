import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const menus = [
  { label: 'ライブ',         icon: '🎸', path: '/live',             color: '#dcfce7', adminOnly: false },
  { label: 'カレンダー',     icon: '📆', path: '/calendar',         color: '#dbeafe', adminOnly: false },
  { label: 'メンバー一覧',   icon: '👥', path: '/members',          color: '#ede9fe', adminOnly: false },
  { label: '練習室予約',     icon: '🎵', path: '/room-reservation', color: '#ecfeff', adminOnly: false },
  { label: '過去ライブ動画', icon: '🎬', path: '/live-videos',      color: '#fce7f3', adminOnly: false },
  { label: 'プロフィール',   icon: '👤', path: '/profile/edit',     color: '#ffedd5', adminOnly: false },
  { label: '運営へ連絡',     icon: '✉️', path: '/contact',          color: '#f1f5f9', adminOnly: false },
  { label: '管理画面',       icon: '⚙️', path: '/admin',            color: '#fee2e2', adminOnly: true  },
]

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
    padding: '28px 20px 72px',
    position: 'relative', overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
  },
  headerCircle2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
  appName: { display: 'flex', alignItems: 'center', gap: 10 },
  appIcon: {
    width: 42, height: 42, borderRadius: 13,
    background: 'rgba(255,255,255,0.18)',
    border: '1.5px solid rgba(255,255,255,0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  },
  appNameText: {
    fontSize: 26, fontWeight: 900, color: '#fff',
    letterSpacing: -1, lineHeight: 1,
    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  appNameSub: {
    fontSize: 9, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 3, fontWeight: 700, marginTop: 3,
    textTransform: 'uppercase',
  },
  avatarWrap: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', cursor: 'pointer',
    border: '2px solid rgba(255,255,255,0.4)',
  },
  avatarImg: { width: 40, height: 40, objectFit: 'cover' },
  greeting: { marginTop: 20, position: 'relative' },
  greetingText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  greetingName: { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 },
  cardWrap: {
    margin: '-48px 16px 0',
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    padding: '8px 8px 16px',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 8, padding: '8px 4px 0',
  },
  menuCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '16px 16px 14px',
    borderRadius: 14, cursor: 'pointer',
    border: 'none', textAlign: 'left',
    transition: 'transform 0.12s, box-shadow 0.12s',
    position: 'relative', overflow: 'hidden',
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, marginBottom: 10,
    background: 'rgba(255,255,255,0.6)',
  },
  menuLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  arrow: { position: 'absolute', right: 12, bottom: 14, fontSize: 12, color: '#94a3b8' },
}

export default function HomePage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const visibleMenus = menus.filter(m => !m.adminOnly || currentUser?.is_admin)

  return (
    <div style={s.page} className="page-fade">
      <div style={s.header}>
        <div style={s.headerCircle1} />
        <div style={s.headerCircle2} />
        <div style={s.headerTop}>
          <div style={s.appName}>
              <img src="/soundcity/logo.jpg" alt="SoundCity" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <div style={s.appNameText}>SoundCityツール</div>
            </div>
          <div style={s.avatarWrap} onClick={() => navigate('/profile/edit')}>
            {currentUser?.photo_url
              ? <img src={currentUser.photo_url} alt="" style={s.avatarImg} />
              : <span style={{ fontSize: 20 }}>🎵</span>
            }
          </div>
        </div>
        <div style={s.greeting}>
          <div style={s.greetingText}>こんにちは！</div>
          <div style={s.greetingName}>{currentUser?.full_name || 'メンバー'} さん</div>
        </div>
      </div>

      <div style={s.cardWrap}>
        <div style={s.grid}>
          {visibleMenus.map(menu => (
            <button
              key={menu.path}
              className="menu-card"
              style={{ ...s.menuCard, background: menu.color }}
              onClick={() => navigate(menu.path)}
            >
              <div style={s.iconCircle}>{menu.icon}</div>
              <span style={s.menuLabel}>{menu.label}</span>
              <span style={s.arrow}>→</span>
            </button>
          ))}
        </div>
        <a
          href="/soundcity/GUIDE.html"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            margin: '16px 12px 4px',
            padding: '13px',
            background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)',
            border: '1.5px solid #86efac',
            borderRadius: 14,
            fontSize: 14, color: '#166534', fontWeight: 700,
            textDecoration: 'none', letterSpacing: 0.3,
          }}
        >
          📖 使い方ガイドを見る
          <span style={{ fontSize: 12, color: '#4ade80' }}>→</span>
        </a>
      </div>

    </div>
  )
}
