import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext.jsx'
import { getRoomReservations, createRoomReservation, deleteRoomReservation } from '../api.js'

const SLOTS = [
  { key: '1-2限', label: '1・2限', time: '9:00〜12:30'  },
  { key: '3-4限', label: '3・4限', time: '13:30〜17:00' },
  { key: '5-6限', label: '5・6限', time: '17:10〜20:40' },
]
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns array of {date, blank} for the calendar grid (blanks at start)
function buildCalendarCells(year, month) {
  const cells = []
  const first = new Date(year, month - 1, 1)
  const last  = new Date(year, month, 0)
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month - 1, d))
  return cells
}

// ---- Export helpers ----

function cellText(r) {
  if (!r) return ''
  return r.usage_type === 'バンド'
    ? `${r.member_name}（バンド：${r.plan_name}）`
    : `${r.member_name}（個人使用）`
}

function buildRows(year, month, reservations) {
  const last = new Date(year, month, 0).getDate()
  const rows = []
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month - 1, d)
    const dateStr = toDateStr(date)
    const wd = WEEKDAYS[date.getDay()]
    const row = { 日付: `${month}/${d}`, 曜日: wd }
    for (const slot of SLOTS) {
      const r = reservations.find(r => r.date === dateStr && r.slot === slot.key)
      row[`${slot.label}（${slot.time}）`] = cellText(r)
    }
    rows.push(row)
  }
  return rows
}

function exportCSV(year, month, reservations) {
  const rows = buildRows(year, month, reservations)
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')),
  ]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `練習室予約_${year}年${month}月.csv`; a.click()
  URL.revokeObjectURL(url)
}

function exportXLSX(year, month, reservations) {
  const rows = buildRows(year, month, reservations)
  const ws = XLSX.utils.json_to_sheet(rows)
  // Column widths
  ws['!cols'] = [{ wch: 8 }, { wch: 4 }, { wch: 24 }, { wch: 24 }, { wch: 24 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${month}月`)
  XLSX.writeFile(wb, `練習室予約_${year}年${month}月.xlsx`)
}

function exportPDF(year, month, reservations) {
  const rows = buildRows(year, month, reservations)
  const headers = Object.keys(rows[0])
  const thHTML = headers.map(h => `<th>${h}</th>`).join('')
  const tbHTML = rows.map(row =>
    `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
  ).join('')

  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>練習室予約 ${year}年${month}月</title>
<style>
  body{font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:11px;padding:16px}
  h2{font-size:14px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;word-break:break-all}
  th{background:#e8f4f8;font-weight:700}
  tr:nth-child(even){background:#f9f9f9}
  @media print{@page{size:A4 landscape;margin:10mm}}
</style></head><body>
<h2>音楽練習室5 予約表　${year}年${month}月</h2>
<table><thead><tr>${thHTML}</tr></thead><tbody>${tbHTML}</tbody></table>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

// ---- Component ----

export default function RoomReservationPage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()

  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)   // Date object
  // per-slot booking form state
  const [bookingSlot, setBookingSlot] = useState(null) // slot key
  const [usageType, setUsageType] = useState('個人')
  const [planName, setPlanName]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRoomReservations(year, month)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const resMap = {}
  for (const r of reservations) resMap[`${r.date}:${r.slot}`] = r

  function slotStatus(dateStr, slotKey) {
    const r = resMap[`${dateStr}:${slotKey}`]
    if (!r) return { res: null, isMe: false }
    return { res: r, isMe: r.member_id === currentUser?.member_id }
  }

  function openDay(day) {
    setSelected(day)
    setBookingSlot(null)
    setUsageType('個人')
    setPlanName('')
  }

  function startBooking(slotKey) {
    setBookingSlot(slotKey)
    setUsageType('個人')
    setPlanName('')
  }

  async function handleReserve() {
    if (usageType === 'バンド' && !planName.trim()) {
      alert('企画名を入力してください')
      return
    }
    setSaving(true)
    const dateStr = toDateStr(selected)
    try {
      const created = await createRoomReservation({
        date: dateStr,
        slot: bookingSlot,
        member_id: currentUser.member_id,
        member_name: currentUser.full_name,
        usage_type: usageType,
        plan_name: usageType === 'バンド' ? planName.trim() : null,
      })
      setReservations(prev => [...prev, created])
      setBookingSlot(null)
    } catch (e) {
      if (e.code === '23505') {
        alert('この枠はすでに予約されています')
        const fresh = await getRoomReservations(year, month)
        setReservations(fresh)
      } else {
        alert('エラー: ' + e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(reservationId) {
    if (!window.confirm('予約を取り消しますか？')) return
    setSaving(true)
    try {
      await deleteRoomReservation(reservationId)
      setReservations(prev => prev.filter(r => r.reservation_id !== reservationId))
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const todayStr  = toDateStr(today)
  const cells     = buildCalendarCells(year, month)
  const selectedStr = selected ? toDateStr(selected) : null

  // Dot color for a slot in a day cell
  function dotColor(dateStr, slotKey, isPast) {
    if (isPast) return '#e2e8f0'
    const { res, isMe } = slotStatus(dateStr, slotKey)
    if (!res)   return '#bbf7d0'   // available → light green
    if (isMe)   return '#0891b2'   // mine → cyan
    return '#94a3b8'               // others → gray
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        color: '#fff', padding: '16px 20px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }}/>
        <button style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          width: 36, height: 36, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative',
        }} onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' }}>
          音楽練習室5 予約
        </span>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
      }}>
        <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', fontSize: 20, cursor: 'pointer', color: '#1e293b' }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', fontSize: 20, cursor: 'pointer', color: '#1e293b' }}>›</button>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', margin: '12px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        {/* Week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #f1f5f9' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{
              textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 700,
              color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#64748b',
            }}>{w}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading
          ? <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`blank-${i}`}/>

                const dateStr = toDateStr(day)
                const isPast  = dateStr < todayStr
                const isToday = dateStr === todayStr
                const isSel   = dateStr === selectedStr
                const wd      = day.getDay()

                return (
                  <button key={dateStr} onClick={() => openDay(day)} style={{
                    background: isSel ? '#ecfeff' : 'transparent',
                    border: 'none', cursor: isPast ? 'default' : 'pointer',
                    padding: '6px 0 8px', borderRadius: 0,
                    borderBottom: '1px solid #f8fafc',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    {/* Date number */}
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? '#0891b2' : 'transparent',
                      color: isToday ? '#fff'
                        : isPast ? '#cbd5e1'
                        : wd === 0 ? '#ef4444'
                        : wd === 6 ? '#3b82f6'
                        : '#1e293b',
                    }}>{day.getDate()}</span>

                    {/* 3 slot dots */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      {SLOTS.map(slot => (
                        <span key={slot.key} style={{
                          width: 7, height: 7, borderRadius: 2,
                          background: dotColor(dateStr, slot.key, isPast),
                          display: 'inline-block',
                        }}/>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '0 16px 12px', alignItems: 'center' }}>
        {[
          { color: '#bbf7d0', label: '空き' },
          { color: '#0891b2', label: '自分' },
          { color: '#94a3b8', label: '他の人' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }}/>
            {label}
          </span>
        ))}
      </div>

      {/* Export bar */}
      <div style={{ padding: '4px 12px 16px' }}>
        <div style={{
          background: '#fff', borderRadius: 14,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>
            📥 エクスポート（{year}年{month}月）
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'CSV',  icon: '📄', fn: () => exportCSV(year, month, reservations)  },
              { label: 'XLSX', icon: '📊', fn: () => exportXLSX(year, month, reservations) },
              { label: 'PDF',  icon: '🖨',  fn: () => exportPDF(year, month, reservations)  },
            ].map(({ label, icon, fn }) => (
              <button key={label} onClick={fn} style={{
                flex: 1, padding: '9px 0',
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#0e7490',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setBookingSlot(null) } }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 480, padding: '16px 20px 40px',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' }}/>

            {/* Sheet header */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>
                {month}月{selected.getDate()}日（{WEEKDAYS[selected.getDay()]}）
              </span>
            </div>

            {/* Slot rows */}
            {SLOTS.map(slot => {
              const dateStr = toDateStr(selected)
              const isPast  = dateStr < todayStr
              const { res, isMe } = slotStatus(dateStr, slot.key)
              const isExpanded = bookingSlot === slot.key

              return (
                <div key={slot.key} style={{
                  borderRadius: 12, marginBottom: 8,
                  border: '1.5px solid',
                  borderColor: isExpanded ? '#0891b2' : '#e2e8f0',
                  overflow: 'hidden',
                  background: isExpanded ? '#ecfeff' : '#fff',
                }}>
                  {/* Slot header row */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{slot.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{slot.time}</div>
                    </div>

                    {/* Status */}
                    {isPast ? (
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>終了</span>
                    ) : !res ? (
                      <button onClick={() => startBooking(isExpanded ? null : slot.key)} style={{
                        padding: '7px 16px', background: isExpanded ? '#0891b2' : 'linear-gradient(135deg,#0891b2,#0e7490)',
                        color: '#fff', border: 'none', borderRadius: 20,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(8,145,178,0.3)',
                      }}>
                        {isExpanded ? '閉じる' : '予約する'}
                      </button>
                    ) : isMe ? (
                      <button onClick={() => handleDelete(res.reservation_id)} disabled={saving} style={{
                        padding: '7px 14px', background: '#fff5f5', color: '#ef4444',
                        border: '1.5px solid #fecaca', borderRadius: 20,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}>
                        取り消し
                      </button>
                    ) : (
                      <span style={{
                        padding: '5px 10px', background: '#f1f5f9', borderRadius: 20,
                        fontSize: 12, color: '#64748b', fontWeight: 600,
                      }}>
                        {res.member_name}
                      </span>
                    )}
                  </div>

                  {/* Existing reservation detail (others) */}
                  {res && !isMe && (
                    <div style={{ padding: '0 14px 10px', fontSize: 12, color: '#94a3b8' }}>
                      {res.usage_type === 'バンド' ? `バンド使用（${res.plan_name}）` : '個人使用'}
                    </div>
                  )}

                  {/* My reservation detail */}
                  {res && isMe && (
                    <div style={{ padding: '0 14px 10px', fontSize: 12, color: '#0e7490', fontWeight: 600 }}>
                      {res.usage_type === 'バンド' ? `バンド使用（${res.plan_name}）` : '個人使用'} ・ 自分の予約
                    </div>
                  )}

                  {/* Booking form (inline expand) */}
                  {isExpanded && !res && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid #cffafe' }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, marginTop: 10 }}>
                        予約者：<strong style={{ color: '#1e293b' }}>{currentUser?.full_name}</strong>
                      </div>
                      {/* Usage type */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>使用用途</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['個人', 'バンド'].map(t => (
                            <button key={t} onClick={() => setUsageType(t)} style={{
                              flex: 1, padding: '9px 0',
                              border: '1.5px solid',
                              borderColor: usageType === t ? '#0891b2' : '#e2e8f0',
                              borderRadius: 10, fontSize: 13, fontWeight: 700,
                              background: usageType === t ? '#ecfeff' : '#fff',
                              color: usageType === t ? '#0e7490' : '#94a3b8',
                              cursor: 'pointer',
                            }}>
                              {t === '個人' ? '個人使用' : 'バンド使用'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {usageType === 'バンド' && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>企画名 *</div>
                          <input
                            style={{
                              width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
                              borderRadius: 10, fontSize: 14, background: '#f8fafc', boxSizing: 'border-box',
                            }}
                            placeholder="バンド名・企画名を入力"
                            value={planName}
                            onChange={e => setPlanName(e.target.value)}
                          />
                        </div>
                      )}
                      <button onClick={handleReserve} disabled={saving} style={{
                        width: '100%', padding: '11px',
                        background: 'linear-gradient(135deg,#0891b2,#0e7490)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(8,145,178,0.35)', marginTop: 2,
                      }}>
                        {saving ? '予約中...' : '予約を確定する'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            <button onClick={() => { setSelected(null); setBookingSlot(null) }} style={{
              width: '100%', padding: '11px', background: '#f1f5f9',
              border: 'none', borderRadius: 12, fontSize: 14,
              cursor: 'pointer', color: '#64748b', fontWeight: 600, marginTop: 4,
            }}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}
