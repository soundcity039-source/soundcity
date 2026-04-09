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
import { getLives, getPlans, getTimetable, updateTimetable, confirmTimetable } from '../api.js'

// ── helpers ─────────────────────────────────────────────
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
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
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
    borderRadius: 10, fontSize: 15, background: '#fff', boxSizing: 'border-box', marginBottom: 16,
    outline: 'none',
  },
  columnsRow: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  column: { flex: 1, minWidth: 0 },
  columnHeader: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#fff', borderRadius: '12px 12px 0 0',
    padding: '10px 12px', fontSize: 14, fontWeight: 700, textAlign: 'center',
  },
  dropZone: {
    background: '#fff', borderRadius: '0 0 8px 8px',
    border: '1px solid #ddd', borderTop: 'none',
    minHeight: 80, padding: 8,
  },
  dropZoneOver: { background: '#f0fdf4', borderColor: '#06C755' },
  planCard: {
    background: '#fff', borderRadius: 8, padding: '8px 10px',
    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #eee',
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
  planMeta: { fontSize: 11, color: '#888', marginTop: 1 },
  dragHandle: { cursor: 'grab', color: '#ccc', fontSize: 16, flexShrink: 0, lineHeight: 1 },
  arrowBtns: { display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 },
  arrowBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: 4,
    padding: '1px 5px', fontSize: 10, cursor: 'pointer', color: '#555', lineHeight: 1.4,
  },
  removeBtn: {
    background: 'none', border: 'none', fontSize: 16,
    cursor: 'pointer', color: '#ccc', padding: '0 2px', flexShrink: 0, lineHeight: 1,
  },
  emptyHint: { textAlign: 'center', color: '#ccc', fontSize: 12, padding: '16px 0' },
  unassignedSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 },
  unassignedCard: {
    background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #eee',
    userSelect: 'none', touchAction: 'none', cursor: 'grab',
  },
  assignBtns: { display: 'flex', gap: 4 },
  assignBtn: {
    padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6,
    background: '#fff', fontSize: 11, cursor: 'pointer', color: '#555', whiteSpace: 'nowrap',
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
}

// ── SortableCard ─────────────────────────────────────────
function SortableCard({ planId, plan, index, total, colKey, onMoveUp, onMoveDown, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: planId })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={{ ...style, ...(isDragging ? s.planCardDragging : {}) }}>
      <div style={s.planCard}>
        <span style={s.dragHandle} {...attributes} {...listeners}>⠿</span>
        <div style={s.orderNum}>{index + 1}</div>
        <div style={s.planInfo}>
          <div style={s.planName}>{plan?.band_name || '不明'}</div>
          <div style={s.planMeta}>{plan?.song_count}曲</div>
        </div>
        <div style={s.arrowBtns}>
          <button style={s.arrowBtn} onClick={onMoveUp} disabled={index === 0}>▲</button>
          <button style={s.arrowBtn} onClick={onMoveDown} disabled={index === total - 1}>▼</button>
        </div>
        <button style={s.removeBtn} onClick={onRemove}>×</button>
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
      <div style={{ ...s.unassignedCard }}>
        <div style={{ ...s.dragHandle, marginRight: 8 }} {...attributes} {...listeners}>⠿</div>
        <div style={{ ...s.planInfo }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{plan?.band_name || '不明'}</div>
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

  // ── move helpers ──────────────────────────────────────
  function moveWithinColumn(colKey, planId, dir) {
    setColumns(prev => {
      const arr = [...prev[colKey]]
      const idx = arr.indexOf(planId)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= arr.length) return prev
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return { ...prev, [colKey]: arr }
    })
  }

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

  // ── DnD handlers ──────────────────────────────────────
  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    const activeId = active.id
    const overId = over.id
    const activeCol = findColumn(columns, activeId)
    // over could be a droppable zone id ('day1','day2','unassigned') or a plan_id
    const overCol = ['day1', 'day2', 'unassigned'].includes(overId)
      ? overId
      : findColumn(columns, overId)
    if (!overCol || activeCol === overCol) return

    setColumns(prev => {
      const fromItems = prev[activeCol].filter(id => id !== activeId)
      const toItems = [...prev[overCol]]
      const overIndex = toItems.indexOf(overId)
      const insertAt = overIndex >= 0 ? overIndex : toItems.length
      toItems.splice(insertAt, 0, activeId)
      return { ...prev, [activeCol]: fromItems, [overCol]: toItems }
    })
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const activeId = active.id
    const overId = over.id
    const activeCol = findColumn(columns, activeId)
    const overCol = ['day1', 'day2', 'unassigned'].includes(overId)
      ? overId
      : findColumn(columns, overId)
    if (!overCol || activeCol !== overCol) return
    // within same column: reorder
    const oldIdx = columns[activeCol].indexOf(activeId)
    const newIdx = columns[activeCol].indexOf(overId)
    if (oldIdx !== newIdx && newIdx >= 0) {
      setColumns(prev => ({
        ...prev,
        [activeCol]: arrayMove(prev[activeCol], oldIdx, newIdx),
      }))
    }
  }

  // ── save / confirm ────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const entries = columnsToEntries(columns, selectedLiveId)
      await updateTimetable({ live_id: selectedLiveId, entries })
      alert('保存しました')
    } catch (e) {
      alert('保存エラー: ' + (e.message || JSON.stringify(e)))
      console.error(e)
    } finally { setSaving(false) }
  }

  async function handleConfirm() {
    if (!window.confirm('タイムテーブルを確定しますか？')) return
    setSaving(true)
    try {
      const entries = columnsToEntries(columns, selectedLiveId)
      await updateTimetable({ live_id: selectedLiveId, entries })
      await confirmTimetable(selectedLiveId)
      alert('タイムテーブルを確定しました')
    } catch (e) {
      alert('確定エラー: ' + (e.message || JSON.stringify(e)))
      console.error(e)
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
              {/* Day columns */}
              <div style={s.columnsRow}>
                {['day1', hasTwodays ? 'day2' : null].filter(Boolean).map(colKey => (
                  <div key={colKey} style={s.column}>
                    <div style={s.columnHeader}>{colKey === 'day1' ? '1日目' : '2日目'}</div>
                    <SortableContext items={columns[colKey]} strategy={verticalListSortingStrategy}>
                      <DroppableZone id={colKey} isEmpty={columns[colKey].length === 0}>
                        {columns[colKey].map((planId, i) => (
                          <SortableCard
                            key={planId}
                            planId={planId}
                            plan={planMap[planId]}
                            index={i}
                            total={columns[colKey].length}
                            colKey={colKey}
                            onMoveUp={() => moveWithinColumn(colKey, planId, -1)}
                            onMoveDown={() => moveWithinColumn(colKey, planId, 1)}
                            onRemove={() => removeFromColumn(colKey, planId)}
                          />
                        ))}
                      </DroppableZone>
                    </SortableContext>
                  </div>
                ))}
              </div>

              {/* Unassigned */}
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

              {/* Drag overlay (ghost) */}
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
            <button style={s.confirmBtn} onClick={handleConfirm} disabled={saving}>
              タイムテーブルを確定する
            </button>
          </>
        )}
      </div>
    </div>
  )
}
