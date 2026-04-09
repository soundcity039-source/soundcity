import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
    color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 16, padding: '18px',
    marginBottom: 12, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '2px solid transparent', transition: 'border-color 0.15s, transform 0.1s',
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardOpen: { borderColor: '#06C755' },
  cardDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  liveNameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  liveName: { fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 8,
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  badgeOpen: { background: '#dcfce7', color: '#166534' },
  badgeClosed: { background: '#f1f5f9', color: '#94a3b8' },
  metaList: { display: 'flex', flexDirection: 'column', gap: 4 },
  meta: { fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  empty: {
    textAlign: 'center', color: '#94a3b8', padding: '60px 20px',
    fontSize: 15, fontWeight: 500,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: { textAlign: 'center', color: '#94a3b8', padding: 40 },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

function formatDeadline(dtStr) {
  if (!dtStr) return ''
  const d = new Date(dtStr)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 締切`
}

export default function LiveSelectPage() {
  const navigate = useNavigate()
  const { setFormState } = useApp()
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLives({ status: 'open' })
      .then(res => setLives(res.lives || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(live) {
    if (live.status !== 'open') return
    setFormState(prev => ({
      ...prev,
      live_id: live.live_id,
      live_name: live.live_name,
      band_name: '',
      song_count: '',
      parts: [],
      save_as_template: false,
      editing_plan_id: null,
    }))
    navigate('/apply/a')
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>ライブを選択</span>
      </div>
      <div style={s.content}>
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && lives.length === 0 && (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🎤</div>
            応募受付中のライブがありません
          </div>
        )}
        {!loading && lives.map(live => {
          const isOpen = live.status === 'open'
          return (
            <div
              key={live.live_id}
              style={{ ...s.card, ...(isOpen ? s.cardOpen : s.cardDisabled) }}
              onClick={() => handleSelect(live)}
            >
              <div style={s.liveNameRow}>
                <div style={s.liveName}>{live.live_name}</div>
                <span style={{ ...s.badge, ...(isOpen ? s.badgeOpen : s.badgeClosed) }}>
                  {isOpen ? '受付中' : '締切済'}
                </span>
              </div>
              <div style={s.metaList}>
                <div style={s.meta}>
                  <span>📅</span>
                  {formatDate(live.date1)}{live.date2 ? ` / ${formatDate(live.date2)}` : ''}
                </div>
                <div style={s.meta}><span>⏰</span>{formatDeadline(live.deadline)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
