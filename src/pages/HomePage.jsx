import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import ThemeSelectModal from '../components/ThemeSelectModal.jsx'

const menus = [
  { label: 'ライブ',         icon: '🎸', path: '/live',            accent: '#06C755', num: '01', desc: '応募・応募一覧を確認', adminOnly: false },
  { label: 'カレンダー',     icon: '📆', path: '/calendar',        accent: '#3b82f6', num: '02', desc: 'ライブ・合宿・予約を確認', adminOnly: false },
  { label: 'メンバー一覧',   icon: '👥', path: '/members',         accent: '#a855f7', num: '03', desc: 'サークル員のプロフィール', adminOnly: false },
  { label: '練習室予約',     icon: '🎵', path: '/room-reservation',accent: '#06b6d4', num: '04', desc: '空きコマを確認・予約', adminOnly: false },
  { label: '過去ライブ動画', icon: '🎬', path: '/live-videos',     accent: '#ec4899', num: '05', desc: '過去のライブ動画を視聴', adminOnly: false },
  { label: 'プロフィール',   icon: '👤', path: '/profile/edit',    accent: '#f97316', num: '06', desc: '名前・パート・写真を編集', adminOnly: false },
  { label: '運営へ連絡',     icon: '✉️', path: '/contact',         accent: '#64748b', num: '07', desc: '幹部へメッセージを送る', adminOnly: false },
  { label: '管理画面',       icon: '⚙️', path: '/admin',           accent: '#ef4444', num: '08', desc: '幹部専用の管理メニュー', adminOnly: true },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [showTheme, setShowTheme] = useState(false)
  const [pressed, setPressed] = useState(null)
  const visibleMenus = menus.filter(m => !m.adminOnly || currentUser?.is_admin)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', paddingBottom: 80, fontFamily: 'inherit' }} className="page-fade">

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: 'linear-gradient(160deg, #0d0d18 0%, #111827 60%, #0a150f 100%)',
        padding: '20px 20px 56px',
        position: 'relative',
        overflow: 'hidden',
        clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
      }}>
        {/* 背景の幾何学装飾 */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, background: 'radial-gradient(circle at 80% 20%, rgba(6,199,85,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 20, left: -30, width: 120, height: 120, background: 'rgba(6,199,85,0.05)', transform: 'rotate(30deg)', pointerEvents: 'none' }} />
        {/* 右上の斜めストライプ装飾 */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 80, height: '100%',
          background: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(6,199,85,0.04) 6px, rgba(6,199,85,0.04) 12px)',
          pointerEvents: 'none',
        }} />

        {/* TOP ROW */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <img src="/soundcity/logo.jpg" alt="SoundCity" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: -2, borderRadius: 12, border: '1.5px solid #06C755', opacity: 0.6 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#06C755', fontWeight: 800, textTransform: 'uppercase' }}>SoundCity</div>
              <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>MUSIC CIRCLE TOOL</div>
            </div>
          </div>
          <div
            onClick={() => navigate('/profile/edit')}
            style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid rgba(6,199,85,0.5)', position: 'relative' }}
          >
            {currentUser?.photo_url
              ? <img src={currentUser.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
            }
          </div>
        </div>

        {/* GREETING */}
        <div style={{ marginTop: 28, position: 'relative' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Welcome back</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{currentUser?.full_name || 'メンバー'}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>さん</span>
          </div>
          {/* グリーンのアンダーライン装飾 */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 2, background: '#06C755', borderRadius: 1 }} />
            <div style={{ width: 8, height: 2, background: 'rgba(6,199,85,0.4)', borderRadius: 1 }} />
            <div style={{ width: 4, height: 2, background: 'rgba(6,199,85,0.2)', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* ═══ MENU LIST ═══ */}
      <div style={{ padding: '0 16px', marginTop: -8 }}>

        {/* セクションラベル */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingLeft: 4 }}>
          <div style={{ width: 3, height: 14, background: '#06C755', borderRadius: 2 }} />
          <span style={{ fontSize: 10, letterSpacing: 2.5, color: '#06C755', fontWeight: 800, textTransform: 'uppercase' }}>Main Menu</span>
        </div>

        {visibleMenus.map((menu, idx) => {
          const isPressed = pressed === idx
          return (
            <button
              key={menu.label}
              onPointerDown={() => setPressed(idx)}
              onPointerUp={() => { setPressed(null); navigate(menu.path) }}
              onPointerLeave={() => setPressed(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                width: '100%', border: 'none', cursor: 'pointer',
                marginBottom: 8, borderRadius: 10, overflow: 'hidden',
                background: 'transparent', padding: 0,
                transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                transition: 'transform 0.1s',
              }}
            >
              {/* 左: カラーアクセントバー */}
              <div style={{
                width: 4, alignSelf: 'stretch', background: menu.accent, flexShrink: 0,
              }} />

              {/* 番号 */}
              <div style={{
                width: 36, background: '#111827', alignSelf: 'stretch',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>{menu.num}</span>
              </div>

              {/* アイコン */}
              <div style={{
                width: 52, background: '#111827', alignSelf: 'stretch',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${menu.accent}18`,
                  border: `1px solid ${menu.accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {menu.icon}
                </div>
              </div>

              {/* テキスト */}
              <div style={{
                flex: 1, background: isPressed ? '#1a1f2e' : '#141824',
                padding: '13px 12px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.1s',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: 0.2, marginBottom: 2 }}>
                  {menu.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  {menu.desc}
                </div>
              </div>

              {/* 矢印 */}
              <div style={{
                width: 36, background: isPressed ? '#1a1f2e' : '#141824',
                alignSelf: 'stretch',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 14, color: menu.accent, fontWeight: 700, opacity: 0.8 }}>›</span>
              </div>
            </button>
          )
        })}

        {/* ─── フッターボタン群 ─── */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowTheme(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px',
              background: '#141824',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            🎨 テーマ変更
          </button>
          <a
            href="/soundcity/GUIDE.html"
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px',
              background: 'linear-gradient(135deg, rgba(6,199,85,0.15), rgba(6,199,85,0.05))',
              border: '1px solid rgba(6,199,85,0.3)',
              borderRadius: 10,
              fontSize: 12, color: '#06C755', fontWeight: 700,
              textDecoration: 'none', letterSpacing: 0.5,
            }}
          >
            📖 使い方ガイド →
          </a>
        </div>
      </div>

      {showTheme && <ThemeSelectModal onClose={() => setShowTheme(false)} />}
    </div>
  )
}
