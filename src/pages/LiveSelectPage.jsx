import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getMyPlans } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'var(--header-grad)',
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
    background: 'var(--card-bg)', borderRadius: 16, padding: '18px',
    marginBottom: 12, cursor: 'pointer', boxShadow: 'var(--card-shadow)',
    border: '2px solid transparent', transition: 'border-color 0.15s, transform 0.1s',
    borderColor: 'var(--card-border)',
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
  meta: { fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 6 },
  empty: {
    textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px',
    fontSize: 15, fontWeight: 500,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: { textAlign: 'center', color: 'var(--text-muted)', padding: 40 },
  myPlansSection: { marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--card-border)' },
  myPlansLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 },
  myPlanChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, padding: '3px 8px', borderRadius: 8,
    background: '#f0fdf4', color: '#166534', fontWeight: 600, marginRight: 4, marginBottom: 4,
    border: '1px solid #86efac',
  },
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

function isLivePast(live) {
  const lastDate = live.date2 || live.date1
  if (!lastDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(lastDate) < today
}

function isDeadlinePast(live) {
  if (!live.deadline) return false
  return new Date(live.deadline) < new Date()
}

export default function LiveSelectPage() {
  const navigate = useNavigate()
  const { setFormState, currentUser } = useApp()
  const [lives, setLives] = useState([])
  const [myPlans, setMyPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getLives({ status: 'open' }),
      getMyPlans(currentUser.member_id),
    ])
      .then(([livesRes, plansRes]) => {
        const all = livesRes.lives || livesRes || []
        setLives(all.filter(l => !isLivePast(l)))
        setMyPlans(plansRes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.member_id])

  function leaderCount(liveId) {
    return myPlans.filter(p => p.live_id === liveId && p.leader_id === currentUser.member_id).length
  }
  function castCount(liveId) {
    return myPlans.filter(p => p.live_id === liveId).length
  }

  function handleSelect(live) {
    if (live.status !== 'open') return
    if (isDeadlinePast(live)) return
    if (live.max_leader_plans != null && leaderCount(live.live_id) >= live.max_leader_plans) return
    setFormState(prev => ({
      ...prev,
      live_id: live.live_id,
      live_name: live.live_name,
      max_cast_plans: live.max_cast_plans ?? null,
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
          const deadlinePast = isDeadlinePast(live)
          const liveMyPlans = myPlans.filter(p => p.live_id === live.live_id)
          const myLeaderCount = leaderCount(live.live_id)
          const myCastCount   = castCount(live.live_id)
          const leaderFull    = live.max_leader_plans != null && myLeaderCount >= live.max_leader_plans
          const castFull      = live.max_cast_plans   != null && myCastCount   >= live.max_cast_plans
          const disabled = !isOpen || deadlinePast || leaderFull
          return (
            <div
              key={live.live_id}
              style={{ ...s.card, ...(disabled ? s.cardDisabled : s.cardOpen) }}
              onClick={() => handleSelect(live)}
            >
              <div style={s.liveNameRow}>
                <div style={s.liveName}>{live.live_name}</div>
                <span style={{ ...s.badge, ...(!disabled ? s.badgeOpen : s.badgeClosed) }}>
                  {!isOpen ? '締切済' : deadlinePast ? '受付終了' : '受付中'}
                </span>
              </div>
              <div style={s.metaList}>
                <div style={s.meta}>
                  <span>📅</span>
                  {formatDate(live.date1)}{live.date2 ? ` / ${formatDate(live.date2)}` : ''}
                </div>
                <div style={{ ...s.meta, color: deadlinePast ? '#ef4444' : 'var(--text-sub)', fontWeight: deadlinePast ? 700 : 400 }}>
                  <span>⏰</span>{formatDeadline(live.deadline)}{deadlinePast ? '（受付終了）' : ''}
                </div>
                {live.max_cast_plans != null && (
                  <div style={{ ...s.meta, color: castFull ? '#ef4444' : 'var(--text-sub)' }}>
                    <span>🎸</span>
                    出演企画：{myCastCount} / {live.max_cast_plans}企画まで
                    {castFull && <span style={{ fontWeight: 700, color: '#ef4444' }}>（上限）</span>}
                  </div>
                )}
                {live.max_leader_plans != null && (
                  <div style={{ ...s.meta, color: leaderFull ? '#ef4444' : 'var(--text-sub)' }}>
                    <span>👑</span>
                    代表者応募：{myLeaderCount} / {live.max_leader_plans}企画まで
                    {leaderFull && <span style={{ fontWeight: 700, color: '#ef4444' }}>（上限・応募不可）</span>}
                  </div>
                )}
              </div>
              {leaderFull && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                  代表者として応募できる企画数の上限に達しています
                </div>
              )}
              {liveMyPlans.length > 0 && (
                <div style={s.myPlansSection}>
                  <div style={s.myPlansLabel}>自分の応募済み企画</div>
                  <div>
                    {liveMyPlans.map(p => (
                      <span key={p.plan_id} style={s.myPlanChip}>
                        🎸 {p.band_name}（{p.song_count}曲）
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
