import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, deletePlan, getLives, createTemplate } from '../api.js'
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
  content: { padding: '10px 12px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 12, marginBottom: 8,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden',
  },
  cardMain: {
    padding: '10px 14px 10px',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
    cursor: 'pointer',
  },
  cardLeft: { flex: 1, minWidth: 0 },
  bandName: { fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  liveMeta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  liveTag: {
    fontSize: 11, fontWeight: 600, color: '#06C755',
    background: '#dcfce7', padding: '2px 7px', borderRadius: 6,
  },
  songTag: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    background: '#f1f5f9', padding: '2px 7px', borderRadius: 6,
  },
  partsWrap: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  partChip: {
    fontSize: 11, padding: '2px 7px', borderRadius: 6,
    background: '#f8f4ff', color: '#5b21b6', fontWeight: 600, whiteSpace: 'nowrap',
  },
  partChipEmpty: {
    fontSize: 11, padding: '2px 7px', borderRadius: 6,
    background: '#f1f5f9', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap',
  },
  chevron: { fontSize: 14, color: '#94a3b8', marginTop: 2, flexShrink: 0, transition: 'transform 0.15s' },
  // Expanded area
  expandArea: { padding: '0 14px 12px', borderTop: '1px solid #f8fafc' },
  fullPartRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: 13,
  },
  partBadge: {
    fontSize: 11, fontWeight: 700, color: '#5b21b6',
    background: '#ede9fe', padding: '2px 8px', borderRadius: 6, minWidth: 36, textAlign: 'center',
  },
  partMember: { color: '#334155', fontSize: 13 },
  partEmpty: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },
  actionRow: { display: 'flex', gap: 6, marginTop: 10 },
  editBtn:     { flex: 1, padding: '8px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  deleteBtn:   { flex: 1, padding: '8px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  templateBtn: { flex: 1, padding: '8px', background: '#ede9fe', border: 'none', borderRadius: 8, color: '#5b21b6', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  empty:   { textAlign: 'center', color: '#94a3b8', padding: '60px 20px', fontSize: 15, fontWeight: 500 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: { textAlign: 'center', color: '#94a3b8', padding: 40 },
}

export default function ApplicationListPage() {
  const navigate = useNavigate()
  const { currentUser, setFormState } = useApp()
  const [plans, setPlans] = useState([])
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    Promise.all([
      getPlans({ leader_id: currentUser.member_id }),
      getLives({}),
    ])
      .then(([plansRes, livesRes]) => {
        setPlans(plansRes || [])
        setLives(livesRes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.member_id])

  function getLive(liveId) { return lives.find(l => l.live_id === liveId) }

  function isBeforeDeadline(plan) {
    const live = getLive(plan.live_id)
    if (!live || !live.deadline) return true
    return new Date(live.deadline) > new Date()
  }

  function toggleExpand(planId) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(planId) ? next.delete(planId) : next.add(planId)
      return next
    })
  }

  function handleEdit(plan) {
    const live = getLive(plan.live_id)
    setFormState({
      live_id: plan.live_id,
      live_name: live?.live_name || '',
      band_name: plan.band_name,
      song_count: String(plan.song_count),
      parts: (plan.casts || []).map(c => ({ part: c.part, member: c.member || null })),
      save_as_template: false,
      editing_plan_id: plan.plan_id,
    })
    navigate('/apply/a')
  }

  async function handleSaveTemplate(plan) {
    try {
      await createTemplate({
        band_name: plan.band_name,
        creator_id: currentUser.member_id,
        casts: (plan.casts || []).map(c => ({ part: c.part, member_id: c.member_id || null })),
      })
      alert(`「${plan.band_name}」をテンプレートに保存しました`)
    } catch (e) {
      alert('テンプレート保存エラー: ' + (e.message || JSON.stringify(e)))
    }
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
    <div style={s.page} className="page-fade">
      <div style={s.header}>
        <div style={s.headerCircle}/>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>ライブ応募一覧</span>
      </div>
      <div style={s.content}>
        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && plans.length === 0 && (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🎸</div>
            応募した企画がありません
          </div>
        )}
        {!loading && plans.map(plan => {
          const live    = getLive(plan.live_id)
          const canEdit = isBeforeDeadline(plan)
          const isOpen  = expanded.has(plan.plan_id)
          const casts   = plan.casts || []

          return (
            <div key={plan.plan_id} style={s.card} className="tap-card">
              {/* Collapsed header row */}
              <div style={s.cardMain} onClick={() => toggleExpand(plan.plan_id)}>
                <div style={s.cardLeft}>
                  <div style={s.bandName}>{plan.band_name}</div>
                  <div style={s.liveMeta}>
                    <span style={s.liveTag}>{live?.live_name || 'ライブ名不明'}</span>
                    <span style={s.songTag}>{plan.song_count}曲</span>
                  </div>
                  {/* Parts summary chips */}
                  <div style={s.partsWrap}>
                    {casts.map((c, i) => (
                      <span key={i} style={c.member?.full_name ? s.partChip : s.partChipEmpty}>
                        {c.part}{c.member?.full_name ? `：${c.member.full_name}` : '：未定'}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ ...s.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={s.expandArea}>
                  {casts.map((c, i) => (
                    <div key={i} style={s.fullPartRow}>
                      <span style={s.partBadge}>{c.part}</span>
                      <span style={c.member?.full_name ? s.partMember : s.partEmpty}>
                        {c.member?.full_name || '未定'}
                      </span>
                    </div>
                  ))}
                  <div style={s.actionRow}>
                    <button style={s.templateBtn} onClick={() => handleSaveTemplate(plan)}>テンプレ保存</button>
                    {canEdit && (
                      <>
                        <button style={s.editBtn} onClick={() => handleEdit(plan)}>編集</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(plan)}>取り消し</button>
                      </>
                    )}
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
