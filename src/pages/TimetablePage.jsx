import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getPlans, getTimetable, updateTimetable, confirmTimetable } from '../api.js'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#2d3748', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, background: '#fff', boxSizing: 'border-box', marginBottom: 16,
  },
  tabRow: { display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #ddd' },
  tab: {
    flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
    background: '#fff', border: 'none', fontSize: 14, fontWeight: 600, color: '#888',
  },
  tabActive: { background: '#2d3748', color: '#fff' },
  unassignedSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  planCard: {
    background: '#fff', borderRadius: 10, padding: '12px 14px',
    marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  planInfo: {},
  planName: { fontSize: 15, fontWeight: 700 },
  planMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  orderNum: {
    minWidth: 28, height: 28, borderRadius: '50%', background: '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: '#4a5568', marginRight: 10,
  },
  moveBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: 6,
    padding: '4px 8px', fontSize: 16, cursor: 'pointer', color: '#555',
    marginLeft: 4,
  },
  assignBtns: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  assignBtn: {
    padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6,
    background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555',
  },
  removeBtn: {
    padding: '5px 10px', border: '1px solid #e53e3e', borderRadius: 6,
    background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: '#e53e3e',
  },
  confirmBtn: {
    width: '100%', padding: '14px', background: '#2d3748',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 16,
  },
  saveBtn: {
    width: '100%', padding: '12px', background: '#4a5568',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
    cursor: 'pointer', marginTop: 8,
  },
}

export default function TimetablePage() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])
  const [selectedLiveId, setSelectedLiveId] = useState('')
  const [plans, setPlans] = useState([])
  const [timetable, setTimetable] = useState([])
  const [activeDay, setActiveDay] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getLives({})
      .then(res => {
        const list = res.lives || res || []
        setLives(list)
        if (list.length > 0) setSelectedLiveId(list[0].live_id)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedLiveId) return
    setLoading(true)
    Promise.all([
      getPlans({ live_id: selectedLiveId }),
      getTimetable(selectedLiveId),
    ])
      .then(([plansRes, ttRes]) => {
        setPlans(plansRes.plans || plansRes || [])
        setTimetable(ttRes.timetable || ttRes || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedLiveId])

  const selectedLive = lives.find(l => l.live_id === selectedLiveId)
  const hasTwodays = selectedLive?.date2

  // Derive day assignments from timetable
  const ttByDay = (day) => timetable
    .filter(t => t.day === day)
    .sort((a, b) => a.order - b.order)

  const assignedPlanIds = new Set(timetable.map(t => t.plan_id))
  const unassigned = plans.filter(p => !assignedPlanIds.has(p.plan_id))

  function assignToDay(planId, day) {
    setTimetable(prev => {
      const existing = prev.filter(t => t.plan_id !== planId)
      const dayItems = existing.filter(t => t.day === day)
      const newOrder = dayItems.length > 0 ? Math.max(...dayItems.map(t => t.order)) + 1 : 1
      return [...existing, { live_id: selectedLiveId, day, order: newOrder, plan_id: planId }]
    })
  }

  function removeFromDay(planId) {
    setTimetable(prev => prev.filter(t => t.plan_id !== planId))
  }

  function moveUp(planId, day) {
    setTimetable(prev => {
      const dayItems = prev.filter(t => t.day === day).sort((a, b) => a.order - b.order)
      const idx = dayItems.findIndex(t => t.plan_id === planId)
      if (idx <= 0) return prev
      const newItems = [...dayItems]
      ;[newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]]
      const updated = newItems.map((item, i) => ({ ...item, order: i + 1 }))
      return [...prev.filter(t => t.day !== day), ...updated]
    })
  }

  function moveDown(planId, day) {
    setTimetable(prev => {
      const dayItems = prev.filter(t => t.day === day).sort((a, b) => a.order - b.order)
      const idx = dayItems.findIndex(t => t.plan_id === planId)
      if (idx >= dayItems.length - 1) return prev
      const newItems = [...dayItems]
      ;[newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]]
      const updated = newItems.map((item, i) => ({ ...item, order: i + 1 }))
      return [...prev.filter(t => t.day !== day), ...updated]
    })
  }

  function getPlan(planId) {
    return plans.find(p => p.plan_id === planId) || { band_name: '不明', song_count: '?' }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTimetable({ live_id: selectedLiveId, timetable })
      alert('保存しました')
    } catch (e) {
      alert('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirm() {
    if (!window.confirm('タイムテーブルを確定しますか？初回確定時は全員に通知が送信されます。')) return
    setSaving(true)
    try {
      await updateTimetable({ live_id: selectedLiveId, timetable })
      await confirmTimetable(selectedLiveId)
      alert('タイムテーブルを確定しました')
    } catch (e) {
      alert('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const dayItems = ttByDay(activeDay)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        タイムテーブル
      </div>
      <div style={s.content}>
        <select style={s.select} value={selectedLiveId} onChange={e => setSelectedLiveId(e.target.value)}>
          <option value="">ライブを選択</option>
          {lives.map(l => <option key={l.live_id} value={l.live_id}>{l.live_name}</option>)}
        </select>

        {selectedLiveId && (
          <>
            <div style={s.tabRow}>
              <button
                style={{ ...s.tab, ...(activeDay === 1 ? s.tabActive : {}) }}
                onClick={() => setActiveDay(1)}
              >1日目</button>
              {hasTwodays && (
                <button
                  style={{ ...s.tab, ...(activeDay === 2 ? s.tabActive : {}) }}
                  onClick={() => setActiveDay(2)}
                >2日目</button>
              )}
            </div>

            {loading
              ? <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>
              : (
                <>
                  {dayItems.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#aaa', padding: 20, fontSize: 14 }}>
                      まだ企画が割り当てられていません
                    </div>
                  )}
                  {dayItems.map((t, i) => {
                    const plan = getPlan(t.plan_id)
                    return (
                      <div key={t.plan_id} style={s.planCard}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div style={s.orderNum}>{i + 1}</div>
                          <div style={s.planInfo}>
                            <div style={s.planName}>{plan.band_name}</div>
                            <div style={s.planMeta}>{plan.song_count}曲</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button style={s.moveBtn} onClick={() => moveUp(t.plan_id, activeDay)} disabled={i === 0}>↑</button>
                          <button style={s.moveBtn} onClick={() => moveDown(t.plan_id, activeDay)} disabled={i === dayItems.length - 1}>↓</button>
                          <button style={s.removeBtn} onClick={() => removeFromDay(t.plan_id)}>×</button>
                        </div>
                      </div>
                    )
                  })}

                  {unassigned.length > 0 && (
                    <div style={s.unassignedSection}>
                      <div style={s.sectionLabel}>未割り当ての企画</div>
                      {unassigned.map(plan => (
                        <div key={plan.plan_id} style={s.planCard}>
                          <div style={s.planInfo}>
                            <div style={s.planName}>{plan.band_name}</div>
                            <div style={s.planMeta}>{plan.song_count}曲</div>
                          </div>
                          <div style={s.assignBtns}>
                            <button style={s.assignBtn} onClick={() => assignToDay(plan.plan_id, 1)}>1日目へ</button>
                            {hasTwodays && (
                              <button style={s.assignBtn} onClick={() => assignToDay(plan.plan_id, 2)}>2日目へ</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? '保存中...' : '変更を保存'}
                  </button>
                  <button style={s.confirmBtn} onClick={handleConfirm} disabled={saving}>
                    タイムテーブルを確定する
                  </button>
                </>
              )}
          </>
        )}
      </div>
    </div>
  )
}
