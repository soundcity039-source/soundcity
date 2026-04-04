import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, deletePlan, getLives } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
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
    marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  planName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 10 },
  partList: { marginBottom: 12 },
  partRow: { fontSize: 13, color: '#555', padding: '3px 0' },
  actionRow: { display: 'flex', gap: 8 },
  editBtn: {
    flex: 1, padding: '8px', background: '#e6f9ed', border: 'none',
    borderRadius: 8, color: '#06C755', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  deleteBtn: {
    flex: 1, padding: '8px', background: '#fff5f5', border: 'none',
    borderRadius: 8, color: '#e53e3e', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function ApplicationListPage() {
  const navigate = useNavigate()
  const { currentUser, setFormState } = useApp()
  const [plans, setPlans] = useState([])
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPlans({ leader_uid: currentUser.line_uid }),
      getLives({}),
    ])
      .then(([plansRes, livesRes]) => {
        setPlans(plansRes.plans || plansRes || [])
        setLives(livesRes.lives || livesRes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.line_uid])

  function getLive(liveId) {
    return lives.find(l => l.live_id === liveId)
  }

  function isBeforeDeadline(plan) {
    const live = getLive(plan.live_id)
    if (!live || !live.deadline) return true
    return new Date(live.deadline) > new Date()
  }

  function handleEdit(plan) {
    const live = getLive(plan.live_id)
    setFormState({
      live_id: plan.live_id,
      live_name: live?.live_name || '',
      band_name: plan.band_name,
      song_count: String(plan.song_count),
      parts: (plan.casts || []).map(c => ({
        part: c.part,
        member: c.member || null,
      })),
      save_as_template: false,
      editing_plan_id: plan.plan_id,
    })
    navigate('/apply/a')
  }

  async function handleDelete(plan) {
    if (!window.confirm(`「${plan.band_name}」の応募を取り消しますか？`)) return
    try {
      await deletePlan({ plan_id: plan.plan_id })
      setPlans(prev => prev.filter(p => p.plan_id !== plan.plan_id))
    } catch (e) {
      alert('エラーが発生しました。もう一度お試しください')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        応募一覧
      </div>
      <div style={s.content}>
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && plans.length === 0 && <div style={s.empty}>応募した企画がありません</div>}
        {!loading && plans.map(plan => {
          const live = getLive(plan.live_id)
          const canEdit = isBeforeDeadline(plan)
          return (
            <div key={plan.plan_id} style={s.card}>
              <div style={s.planName}>{plan.band_name}</div>
              <div style={s.meta}>
                {live?.live_name || 'ライブ名不明'} / {plan.song_count}曲
              </div>
              <div style={s.partList}>
                {(plan.casts || []).map((c, i) => (
                  <div key={i} style={s.partRow}>
                    {c.part}：{c.member?.full_name || '（未定）'}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div style={s.actionRow}>
                  <button style={s.editBtn} onClick={() => handleEdit(plan)}>編集</button>
                  <button style={s.deleteBtn} onClick={() => handleDelete(plan)}>取り消し</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
