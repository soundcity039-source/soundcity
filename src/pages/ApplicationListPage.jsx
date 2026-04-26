import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyPlans, deletePlan, getLives, createTemplate } from '../api.js'
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
  card: {
    background: 'var(--card-bg)', borderRadius: 12, marginBottom: 8,
    boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)', overflow: 'hidden',
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
    background: '#f8f4ff', color: '#5b21b6', fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
  },
  partChipEmpty: {
    fontSize: 11, padding: '2px 7px', borderRadius: 6,
    background: '#f1f5f9', color: '#94a3b8', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
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
  noteSection: { marginTop: 10, paddingTop: 8, borderTop: '1px solid #f8fafc' },
  noteBlock: { marginBottom: 8 },
  noteLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 },
  noteValue: { fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--page-bg)', borderRadius: 6, padding: '5px 8px' },
  seRow: { display: 'flex', gap: 8, marginBottom: 2 },
  seRowLabel: { fontSize: 11, fontWeight: 700, color: '#6366f1', minWidth: 40 },
  seRowValue: { fontSize: 12, color: 'var(--text)' },
  actionRow: { display: 'flex', gap: 6, marginTop: 10 },
  editBtn:     { flex: 1, padding: '8px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  deleteBtn:   { flex: 1, padding: '8px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  templateBtn: { flex: 1, padding: '8px', background: '#ede9fe', border: 'none', borderRadius: 8, color: '#5b21b6', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  empty:   { textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px', fontSize: 15, fontWeight: 500 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: { textAlign: 'center', color: 'var(--text-muted)', padding: 40 },
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
      getMyPlans(currentUser.member_id),
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
      mic_note: plan.mic_note || '',
      sound_note: plan.sound_note || '',
      se_note: plan.se_note || '',
      light_note: plan.light_note || '',
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
          const isOwn   = plan.leader_id === currentUser.member_id

          return (
            <div key={plan.plan_id} style={s.card} className="tap-card">
              {/* Collapsed header row */}
              <div style={s.cardMain} onClick={() => toggleExpand(plan.plan_id)}>
                <div style={s.cardLeft}>
                  <div style={s.bandName}>{plan.band_name}</div>
                  <div style={s.liveMeta}>
                    <span style={s.liveTag}>{live?.live_name || 'ライブ名不明'}</span>
                    <span style={s.songTag}>{plan.song_count}曲</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>代表：{plan.leader?.full_name || '不明'}</span>
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

                  {(plan.mic_note || plan.sound_note || parseSeNote(plan.se_note).length > 0 || plan.light_note) && (
                    <div style={s.noteSection}>
                      {plan.mic_note && (
                        <div style={s.noteBlock}>
                          <div style={s.noteLabel}>マイク</div>
                          <div style={s.noteValue}>{plan.mic_note}</div>
                        </div>
                      )}
                      {plan.sound_note && (
                        <div style={s.noteBlock}>
                          <div style={s.noteLabel}>音響要望</div>
                          <div style={s.noteValue}>{plan.sound_note}</div>
                        </div>
                      )}
                      {parseSeNote(plan.se_note).length > 0 && (
                        <div style={s.noteBlock}>
                          <div style={s.noteLabel}>SE・曲目</div>
                          <div style={{ background: 'var(--page-bg)', borderRadius: 6, padding: '5px 8px' }}>
                            {parseSeNote(plan.se_note).map((item, i) => (
                              <div key={i} style={s.seRow}>
                                <span style={s.seRowLabel}>{item.label}</span>
                                <span style={s.seRowValue}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {plan.light_note && (
                        <div style={s.noteBlock}>
                          <div style={s.noteLabel}>照明</div>
                          <div style={s.noteValue}>{plan.light_note}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={s.actionRow}>
                    {isOwn && <button style={s.templateBtn} onClick={() => handleSaveTemplate(plan)}>テンプレ保存</button>}
                    {isOwn && canEdit && (
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
