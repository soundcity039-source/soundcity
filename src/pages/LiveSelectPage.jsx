import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7' },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 12, padding: '16px',
    marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '2px solid transparent', transition: 'border 0.1s',
  },
  cardDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  liveName: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  meta: { fontSize: 13, color: '#666', marginBottom: 4 },
  badge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 12,
    fontSize: 12, fontWeight: 600, marginTop: 6,
  },
  badgeOpen: { background: '#e6f9ed', color: '#06C755' },
  badgeClosed: { background: '#f5f5f5', color: '#888' },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
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
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        ライブを選択
      </div>
      <div style={s.content}>
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && lives.length === 0 && <div style={s.empty}>応募受付中のライブがありません</div>}
        {!loading && lives.map(live => {
          const isOpen = live.status === 'open'
          return (
            <div
              key={live.live_id}
              style={{ ...s.card, ...(isOpen ? {} : s.cardDisabled) }}
              onClick={() => handleSelect(live)}
            >
              <div style={s.liveName}>{live.live_name}</div>
              <div style={s.meta}>
                📅 {formatDate(live.date1)}{live.date2 ? ` / ${formatDate(live.date2)}` : ''}
              </div>
              <div style={s.meta}>⏰ {formatDeadline(live.deadline)}</div>
              <div>
                <span style={{ ...s.badge, ...(isOpen ? s.badgeOpen : s.badgeClosed) }}>
                  {isOpen ? '応募受付中' : '締切済み'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
