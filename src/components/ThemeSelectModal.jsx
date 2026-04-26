import { useApp } from '../context/AppContext.jsx'
import { THEMES, THEME_IDS } from '../theme.js'

export default function ThemeSelectModal({ onClose }) {
  const { themeId, changeTheme } = useApp()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card-bg)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480, padding: '20px 20px 40px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>テーマを選択</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>好みのデザインに変更できます</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {THEME_IDS.map(id => {
            const t = THEMES[id]
            const isActive = themeId === id
            const cardBg   = t.vars['--card-bg']
            const pageBg   = t.vars['--page-bg']
            const textCol  = t.vars['--text']
            const mutedCol = t.vars['--text-sub']
            const primary  = t.vars['--primary']
            return (
              <button
                key={id}
                onClick={() => { changeTheme(id); onClose() }}
                style={{
                  background: cardBg,
                  border: isActive ? `2.5px solid ${primary}` : `2px solid ${t.vars['--border']}`,
                  borderRadius: 14, padding: '14px 12px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                  position: 'relative',
                  boxShadow: isActive ? `0 0 0 2px ${primary}40` : 'none',
                }}
              >
                {/* Mini page preview */}
                <div style={{
                  background: pageBg, borderRadius: 8, padding: '6px 8px',
                  marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4,
                  border: `1px solid ${t.vars['--border']}`,
                }}>
                  {/* Header bar */}
                  <div style={{ height: 8, borderRadius: 4, background: primary, width: '70%' }} />
                  {/* Card rows */}
                  <div style={{ height: 6, borderRadius: 3, background: cardBg, width: '100%' }} />
                  <div style={{ height: 6, borderRadius: 3, background: cardBg, width: '85%' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: textCol, marginBottom: 2 }}>
                  {t.emoji} {t.name}
                </div>
                <div style={{ fontSize: 10, color: mutedCol, fontWeight: 500 }}>
                  {t.desc}
                </div>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 800,
                  }}>✓</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
