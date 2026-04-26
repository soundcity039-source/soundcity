import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, getLives, deletePlan } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

function parseSeNote(seNote) {
  if (!seNote) return []
  const lines = seNote.split('\n')
  const items = []
  if (lines[0]?.trim()) items.push({ label: 'SE', value: lines[0].trim() })
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim()) items.push({ label: `${i}曲目`, value: lines[i].trim() })
  }
  return items
}

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
  content: { padding: '10px 12px', maxWidth: 480, margin: '0 auto' },
  liveSection: { marginBottom: 20 },
  liveHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 4px 8px',
  },
  liveName: { fontSize: 15, fontWeight: 800, color: 'var(--text)' },
  liveCount: {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    background: '#f1f5f9', padding: '2px 8px', borderRadius: 6,
  },
  card: {
    background: 'var(--card-bg)', borderRadius: 12, marginBottom: 8,
    boxShadow: 'var(--card-shadow)', border: '1px solid var(--card-border)', overflow: 'hidden',
  },
  cardMain: {
    padding: '10px 14px', display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8, cursor: 'pointer',
  },
  cardLeft: { flex: 1, minWidth: 0 },
  bandName: { fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  songTag: { fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: 6 },
  leaderTag: { fontSize: 11, fontWeight: 600, color: '#94a3b8' },
  partsWrap: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  partChip: { fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#f8f4ff', color: '#5b21b6', fontWeight: 600 },
  partChipEmpty: { fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#f1f5f9', color: '#94a3b8', fontWeight: 500 },
  chevron: { fontSize: 14, color: '#94a3b8', marginTop: 2, flexShrink: 0, transition: 'transform 0.15s' },
  expandArea: { padding: '0 14px 12px', borderTop: '1px solid var(--card-border)' },
  fullPartRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13,
  },
  partBadge: { fontSize: 11, fontWeight: 700, color: '#5b21b6', background: '#ede9fe', padding: '2px 8px', borderRadius: 6, minWidth: 36, textAlign: 'center' },
  partMember: { color: 'var(--text)', fontSize: 13 },
  partEmpty: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },
  noteSection: { marginTop: 10 },
  noteRow: { marginBottom: 8 },
  noteLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 2 },
  noteValue: { fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--page-bg)', borderRadius: 6, padding: '6px 8px' },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px', fontSize: 15, fontWeight: 500 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: { textAlign: 'center', color: 'var(--text-muted)', padding: 40 },
  actionRow: { display: 'flex', gap: 6, marginTop: 10 },
  editBtn:   { flex: 1, padding: '8px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  deleteBtn: { flex: 1, padding: '8px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)',
    boxSizing: 'border-box', marginBottom: 12,
  },
}

export default function AllApplicationsPage() {
  const navigate = useNavigate()
  const { setFormState } = useApp()
  const [plans, setPlans] = useState([])
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [filterLiveId, setFilterLiveId] = useState('')

  useEffect(() => {
    Promise.all([getPlans({}), getLives({})])
      .then(([plansRes, livesRes]) => {
        setPlans(plansRes || [])
        setLives(livesRes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(planId) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(planId) ? next.delete(planId) : next.add(planId)
      return next
    })
  }

  function handleEdit(plan) {
    const live = lives.find(l => l.live_id === plan.live_id)
    setFormState({
      live_id: plan.live_id,
      live_name: live?.live_name || '',
      band_name: plan.band_name,
      song_count: String(plan.song_count),
      parts: (plan.casts || []).map(c => ({ part: c.part, member: c.member || null })),
      save_as_template: false,
      editing_plan_id: plan.plan_id,
      editing_leader_id: plan.leader_id,
      return_path: '/admin/applications',
      mic_note: plan.mic_note || '',
      sound_note: plan.sound_note || '',
      se_note: plan.se_note || '',
      light_note: plan.light_note || '',
    })
    navigate('/apply/a')
  }

  async function handleDelete(plan) {
    if (!window.confirm(`「${plan.band_name}」の応募を削除しますか？`)) return
    try {
      await deletePlan({ plan_id: plan.plan_id })
      setPlans(prev => prev.filter(p => p.plan_id !== plan.plan_id))
    } catch (e) {
      alert('エラーが発生しました。もう一度お試しください')
    }
  }

  const filteredPlans = filterLiveId
    ? plans.filter(p => p.live_id === filterLiveId)
    : plans

  // Group by live
  const grouped = lives
    .filter(l => filteredPlans.some(p => p.live_id === l.live_id))
    .map(live => ({
      live,
      plans: filteredPlans.filter(p => p.live_id === live.live_id),
    }))

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>全応募一覧</span>
      </div>
      <div style={s.content}>
        <select style={s.select} value={filterLiveId} onChange={e => setFilterLiveId(e.target.value)}>
          <option value="">全ライブ</option>
          {lives.map(l => (
            <option key={l.live_id} value={l.live_id}>{l.live_name}</option>
          ))}
        </select>

        {loading && <div style={s.loading}>読み込み中...</div>}
        {!loading && filteredPlans.length === 0 && (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🎸</div>
            応募がありません
          </div>
        )}
        {!loading && grouped.map(({ live, plans: livePlans }) => (
          <div key={live.live_id} style={s.liveSection}>
            <div style={s.liveHeader}>
              <span style={s.liveName}>{live.live_name}</span>
              <span style={s.liveCount}>{livePlans.length}企画</span>
            </div>
            {livePlans.map(plan => {
              const isOpen = expanded.has(plan.plan_id)
              const casts = plan.casts || []
              const hasNotes = plan.mic_note || plan.sound_note || plan.se_note
              return (
                <div key={plan.plan_id} style={s.card}>
                  <div style={s.cardMain} onClick={() => toggleExpand(plan.plan_id)}>
                    <div style={s.cardLeft}>
                      <div style={s.bandName}>{plan.band_name}</div>
                      <div style={s.metaRow}>
                        <span style={s.songTag}>{plan.song_count}曲</span>
                        <span style={s.leaderTag}>代表：{plan.leader?.full_name || '不明'}</span>
                      </div>
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
                      {hasNotes && (
                        <div style={s.noteSection}>
                          {plan.mic_note && (
                            <div style={s.noteRow}>
                              <div style={s.noteLabel}>マイク</div>
                              <div style={s.noteValue}>{plan.mic_note}</div>
                            </div>
                          )}
                          {plan.sound_note && (
                            <div style={s.noteRow}>
                              <div style={s.noteLabel}>音響要望</div>
                              <div style={s.noteValue}>{plan.sound_note}</div>
                            </div>
                          )}
                          {plan.light_note && (
                            <div style={s.noteRow}>
                              <div style={s.noteLabel}>照明</div>
                              <div style={s.noteValue}>{plan.light_note}</div>
                            </div>
                          )}
                          {parseSeNote(plan.se_note).length > 0 && (
                            <div style={s.noteRow}>
                              <div style={s.noteLabel}>SE・曲目</div>
                              <div style={s.noteValue}>
                                {parseSeNote(plan.se_note).map((item, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', minWidth: 40 }}>{item.label}</span>
                                    <span>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div style={s.actionRow}>
                        <button style={s.editBtn} onClick={() => handleEdit(plan)}>編集</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(plan)}>削除</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
