import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import * as XLSX from 'xlsx'
import { getLives, getPlans, getTimetable, updateTimetable, confirmTimetable } from '../api.js'

// ── time helper ──────────────────────────────────────────
function calcTime(startTime, index) {
  const [h, m] = (startTime || '13:00').split(':').map(Number)
  const total = h * 60 + m + index * 30
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// ── SE note parser ───────────────────────────────────────
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

// ── helpers ──────────────────────────────────────────────
function buildColumns(ttData, plansData) {
  const day1 = ttData.filter(t => t.day === 1).sort((a, b) => a.order - b.order).map(t => t.plan_id)
  const day2 = ttData.filter(t => t.day === 2).sort((a, b) => a.order - b.order).map(t => t.plan_id)
  const assigned = new Set([...day1, ...day2])
  const unassigned = plansData.filter(p => !assigned.has(p.plan_id)).map(p => p.plan_id)
  return { day1, day2, unassigned }
}

function columnsToEntries(columns, liveId) {
  return [
    ...columns.day1.map((pid, i) => ({ live_id: liveId, day: 1, order: i + 1, plan_id: pid })),
    ...columns.day2.map((pid, i) => ({ live_id: liveId, day: 2, order: i + 1, plan_id: pid })),
  ]
}

function findColumn(columns, planId) {
  if (columns.day1.includes(planId)) return 'day1'
  if (columns.day2.includes(planId)) return 'day2'
  return 'unassigned'
}

// ── styles ───────────────────────────────────────────────
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
    background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 800, margin: '0 auto' },
  select: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)',
    boxSizing: 'border-box', marginBottom: 12, outline: 'none',
  },
  guide: {
    fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--card-bg)', borderRadius: 8, padding: '7px 12px',
    marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center',
    border: '1px solid var(--card-border)',
  },
  guideItem: { display: 'flex', alignItems: 'center', gap: 4 },
  columnsRow: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  column: { flex: 1, minWidth: 0 },
  columnHeader: {
    background: 'var(--header-grad)',
    color: '#fff', borderRadius: '12px 12px 0 0',
    padding: '10px 12px', fontSize: 14, fontWeight: 700, textAlign: 'center',
  },
  dropZone: {
    background: 'var(--card-bg)', borderRadius: '0 0 8px 8px',
    border: '1px solid var(--card-border)', borderTop: 'none',
    minHeight: 80, padding: 8,
  },
  dropZoneOver: { background: '#f0fdf4', borderColor: '#06C755' },
  planCard: {
    background: 'var(--card-bg)', borderRadius: 8, padding: '8px 10px',
    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: 'var(--card-shadow)', border: '1px solid var(--card-border)',
    userSelect: 'none', touchAction: 'none',
  },
  planCardDragging: { opacity: 0.35, border: '1px dashed #aaa' },
  orderNum: {
    minWidth: 22, height: 22, borderRadius: '50%', background: '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#4a5568', flexShrink: 0,
  },
  planInfo: { flex: 1, minWidth: 0 },
  planName: { fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  planMeta: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },
  dragHandle: { cursor: 'grab', color: '#ccc', fontSize: 16, flexShrink: 0, lineHeight: 1 },
  removeBtn: {
    background: 'none', border: 'none', fontSize: 17,
    cursor: 'pointer', color: '#cbd5e1', padding: '0 2px', flexShrink: 0, lineHeight: 1,
  },
  emptyHint: { textAlign: 'center', color: '#ccc', fontSize: 12, padding: '16px 0' },
  unassignedSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 8 },
  unassignedCard: {
    background: 'var(--card-bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: 'var(--card-shadow)', border: '1px solid var(--card-border)',
    userSelect: 'none', touchAction: 'none', cursor: 'grab',
  },
  assignBtns: { display: 'flex', gap: 4 },
  assignBtn: {
    padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6,
    background: 'var(--card-bg)', fontSize: 11, cursor: 'pointer', color: 'var(--text-sub)', whiteSpace: 'nowrap',
  },
  saveBtn: {
    width: '100%', padding: '12px', background: '#4a5568',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', marginTop: 8,
  },
  confirmBtn: {
    width: '100%', padding: '14px', background: '#2d3748',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 8,
  },
  // modal
  seRow: { display: 'flex', alignItems: 'baseline', gap: 6, padding: '4px 0' },
  seLabel: { fontSize: 11, fontWeight: 700, color: '#6366f1', minWidth: 40, flexShrink: 0 },
  seValue: { fontSize: 13, color: 'var(--text)' },
}

// ── SortableCard ──────────────────────────────────────────
function SortableCard({ planId, plan, index, colKey, time, onRemove, onInfoClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: planId })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ ...s.planCard, ...(isDragging ? s.planCardDragging : {}) }}>
        <span style={s.dragHandle} {...attributes} {...listeners}>⠿</span>
        <div style={s.orderNum}>{index + 1}</div>
        <div style={{ ...s.planInfo, cursor: 'pointer' }} onClick={onInfoClick}>
          <div style={s.planName}>{plan?.band_name || '不明'}</div>
          <div style={s.planMeta}>
            {time && <span style={{ color: '#6366f1', fontWeight: 700 }}>{time}・</span>}
            {plan?.song_count}曲
          </div>
        </div>
        <button style={s.removeBtn} onClick={onRemove} title="未割り当てに戻す">×</button>
      </div>
    </div>
  )
}

// ── DroppableZone ────────────────────────────────────────
function DroppableZone({ id, children, isEmpty }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ ...s.dropZone, ...(isOver ? s.dropZoneOver : {}) }}>
      {isEmpty && <div style={s.emptyHint}>ここにドロップ</div>}
      {children}
    </div>
  )
}

// ── UnassignedSortableCard ───────────────────────────────
function UnassignedSortableCard({ planId, plan, onAssign1, onAssign2, hasTwodays }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: planId })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }
  return (
    <div ref={setNodeRef} style={style}>
      <div style={s.unassignedCard}>
        <div style={{ ...s.dragHandle, marginRight: 8 }} {...attributes} {...listeners}>⠿</div>
        <div style={s.planInfo}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan?.band_name || '不明'}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{plan?.song_count}曲</div>
        </div>
        <div style={s.assignBtns}>
          <button style={s.assignBtn} onClick={onAssign1}>1日目へ</button>
          {hasTwodays && <button style={s.assignBtn} onClick={onAssign2}>2日目へ</button>}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function TimetablePage() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])
  const [selectedLiveId, setSelectedLiveId] = useState('')
  const [plans, setPlans] = useState([])
  const [columns, setColumns] = useState({ day1: [], day2: [], unassigned: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [startTimes, setStartTimes] = useState({ day1: '13:00', day2: '13:00' })
  const [detailPlanId, setDetailPlanId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  useEffect(() => {
    getLives({}).then(res => {
      const list = res.lives || res || []
      setLives(list)
      if (list.length > 0) setSelectedLiveId(list[0].live_id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedLiveId) return
    setLoading(true)
    Promise.all([getPlans({ live_id: selectedLiveId }), getTimetable(selectedLiveId)])
      .then(([plansRes, ttRes]) => {
        const p = plansRes.plans || plansRes || []
        const tt = ttRes.timetable || ttRes || []
        setPlans(p)
        setColumns(buildColumns(tt, p))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedLiveId])

  const planMap = Object.fromEntries(plans.map(p => [p.plan_id, p]))
  const selectedLive = lives.find(l => l.live_id === selectedLiveId)
  const hasTwodays = !!selectedLive?.date2

  function removeFromColumn(colKey, planId) {
    setColumns(prev => ({
      ...prev,
      [colKey]: prev[colKey].filter(id => id !== planId),
      unassigned: [...prev.unassigned, planId],
    }))
  }

  function assignToDay(planId, day) {
    const colKey = day === 1 ? 'day1' : 'day2'
    setColumns(prev => ({
      ...prev,
      unassigned: prev.unassigned.filter(id => id !== planId),
      day1: prev.day1.filter(id => id !== planId),
      day2: prev.day2.filter(id => id !== planId),
      [colKey]: [...prev[colKey], planId],
    }))
  }

  function handleDragStart({ active }) { setActiveId(active.id) }

  function handleDragOver({ active, over }) {
    if (!over) return
    const aId = active.id
    const oId = over.id
    const activeCol = findColumn(columns, aId)
    const overCol = ['day1', 'day2', 'unassigned'].includes(oId) ? oId : findColumn(columns, oId)
    if (!overCol || activeCol === overCol) return
    setColumns(prev => {
      const fromItems = prev[activeCol].filter(id => id !== aId)
      const toItems = [...prev[overCol]]
      const overIndex = toItems.indexOf(oId)
      const insertAt = overIndex >= 0 ? overIndex : toItems.length
      toItems.splice(insertAt, 0, aId)
      return { ...prev, [activeCol]: fromItems, [overCol]: toItems }
    })
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const aId = active.id
    const oId = over.id
    const activeCol = findColumn(columns, aId)
    const overCol = ['day1', 'day2', 'unassigned'].includes(oId) ? oId : findColumn(columns, oId)
    if (!overCol || activeCol !== overCol) return
    const oldIdx = columns[activeCol].indexOf(aId)
    const newIdx = columns[activeCol].indexOf(oId)
    if (oldIdx !== newIdx && newIdx >= 0) {
      setColumns(prev => ({ ...prev, [activeCol]: arrayMove(prev[activeCol], oldIdx, newIdx) }))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTimetable({ live_id: selectedLiveId, entries: columnsToEntries(columns, selectedLiveId) })
      alert('保存しました')
    } catch (e) {
      alert('保存エラー: ' + (e.message || JSON.stringify(e)))
    } finally { setSaving(false) }
  }

  function handleExport() {
    const wb = XLSX.utils.book_new()
    const dayKeys = hasTwodays ? ['day1', 'day2'] : ['day1']
    dayKeys.forEach((colKey, di) => {
      const rows = [['出演順', '時刻', 'バンド名', '曲数', 'キャスト']]
      columns[colKey].forEach((planId, i) => {
        const plan = planMap[planId]
        const time = calcTime(startTimes[colKey], i)
        const casts = (plan?.casts || []).map(c => `${c.part}:${c.member?.full_name || '未定'}`).join(' / ')
        rows.push([i + 1, time, plan?.band_name || '不明', `${plan?.song_count ?? '-'}曲`, casts])
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 7 }, { wch: 7 }, { wch: 22 }, { wch: 6 }, { wch: 55 }]
      XLSX.utils.book_append_sheet(wb, ws, di === 0 ? '1日目' : '2日目')
    })
    XLSX.writeFile(wb, `${selectedLive?.live_name || 'タイムテーブル'}_タイムテーブル.xlsx`)
  }

  async function handleConfirm() {
    if (!window.confirm('タイムテーブルを確定しますか？')) return
    setSaving(true)
    try {
      await updateTimetable({ live_id: selectedLiveId, entries: columnsToEntries(columns, selectedLiveId) })
      await confirmTimetable(selectedLiveId)
      alert('タイムテーブルを確定しました')
    } catch (e) {
      alert('確定エラー: ' + (e.message || JSON.stringify(e)))
    } finally { setSaving(false) }
  }

  const activePlan = activeId ? planMap[activeId] : null

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>タイムテーブル</span>
      </div>
      <div style={s.content}>
        <select style={s.select} value={selectedLiveId} onChange={e => setSelectedLiveId(e.target.value)}>
          <option value="">ライブを選択</option>
          {lives.map(l => <option key={l.live_id} value={l.live_id}>{l.live_name}</option>)}
        </select>

        {selectedLiveId && !loading && (
          <div style={s.guide}>
            <span style={s.guideItem}>↕️ ドラッグで並び替え</span>
            <span style={s.guideItem}>👆 タップで詳細表示</span>
            <span style={s.guideItem}>× で未割り当てに戻す</span>
          </div>
        )}

        {selectedLiveId && (loading
          ? <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>
          : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div style={s.columnsRow}>
                {['day1', hasTwodays ? 'day2' : null].filter(Boolean).map(colKey => (
                  <div key={colKey} style={s.column}>
                    <div style={s.columnHeader}>{colKey === 'day1' ? '1日目' : '2日目'}</div>
                    <div style={{ background: 'var(--input-bg)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, whiteSpace: 'nowrap' }}>開始</span>
                      <input
                        type="time"
                        value={startTimes[colKey]}
                        onChange={e => setStartTimes(prev => ({ ...prev, [colKey]: e.target.value }))}
                        style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', background: 'var(--card-bg)', color: 'var(--text)', flex: 1 }}
                      />
                    </div>
                    <SortableContext items={columns[colKey]} strategy={verticalListSortingStrategy}>
                      <DroppableZone id={colKey} isEmpty={columns[colKey].length === 0}>
                        {columns[colKey].map((planId, i) => (
                          <SortableCard
                            key={planId}
                            planId={planId}
                            plan={planMap[planId]}
                            index={i}
                            colKey={colKey}
                            time={calcTime(startTimes[colKey], i)}
                            onRemove={() => removeFromColumn(colKey, planId)}
                            onInfoClick={() => setDetailPlanId(planId)}
                          />
                        ))}
                      </DroppableZone>
                    </SortableContext>
                  </div>
                ))}
              </div>

              {columns.unassigned.length > 0 && (
                <div style={s.unassignedSection}>
                  <div style={s.sectionLabel}>未割り当て（{columns.unassigned.length}企画）</div>
                  <SortableContext items={columns.unassigned} strategy={verticalListSortingStrategy}>
                    {columns.unassigned.map(planId => (
                      <UnassignedSortableCard
                        key={planId}
                        planId={planId}
                        plan={planMap[planId]}
                        hasTwodays={hasTwodays}
                        onAssign1={() => assignToDay(planId, 1)}
                        onAssign2={() => assignToDay(planId, 2)}
                      />
                    ))}
                  </SortableContext>
                </div>
              )}

              <DragOverlay>
                {activePlan && (
                  <div style={{ ...s.planCard, boxShadow: '0 8px 20px rgba(0,0,0,0.15)', cursor: 'grabbing' }}>
                    <span style={s.dragHandle}>⠿</span>
                    <div style={s.planInfo}>
                      <div style={s.planName}>{activePlan.band_name}</div>
                      <div style={s.planMeta}>{activePlan.song_count}曲</div>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )
        )}

        {selectedLiveId && !loading && (
          <>
            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '変更を保存'}
            </button>
            <button style={{ ...s.saveBtn, background: '#0ea5e9', marginTop: 6 }} onClick={handleExport}>
              Excelエクスポート
            </button>
            <button style={s.confirmBtn} onClick={handleConfirm} disabled={saving}>
              タイムテーブルを確定する
            </button>
          </>
        )}
      </div>

      {/* Plan detail modal */}
      {detailPlanId && (() => {
        const p = planMap[detailPlanId]
        const seItems = parseSeNote(p?.se_note)
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={() => setDetailPlanId(null)}
          >
            <div
              style={{ background: 'var(--card-bg)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, padding: '20px 20px 32px', boxSizing: 'border-box', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{p?.band_name || '不明'}</div>
                <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }} onClick={() => setDetailPlanId(null)}>×</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 14 }}>{p?.song_count}曲</div>

              {(p?.casts || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <span style={{ minWidth: 44, fontSize: 11, fontWeight: 700, color: '#5b21b6', background: '#ede9fe', borderRadius: 6, padding: '2px 8px', textAlign: 'center' }}>{c.part}</span>
                  <span style={{ fontSize: 14, color: c.member?.full_name ? 'var(--text)' : 'var(--text-muted)', fontStyle: c.member?.full_name ? 'normal' : 'italic' }}>
                    {c.member?.full_name || '未定'}
                  </span>
                </div>
              ))}
              {(!p?.casts || p.casts.length === 0) && (
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>パート情報なし</div>
              )}

              {(p?.mic_note || p?.sound_note || seItems.length > 0 || p?.light_note) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--card-border)' }}>
                  {p.mic_note && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>マイク</div>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{p.mic_note}</div>
                    </div>
                  )}
                  {p.sound_note && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>音響要望</div>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{p.sound_note}</div>
                    </div>
                  )}
                  {seItems.length > 0 && (
                    <div style={{ marginBottom: p?.light_note ? 10 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>SE・曲目</div>
                      {seItems.map((item, i) => (
                        <div key={i} style={s.seRow}>
                          <span style={s.seLabel}>{item.label}</span>
                          <span style={s.seValue}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {p?.light_note && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>照明</div>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{p.light_note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
