import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { getRoomReservations, createRoomReservation, deleteRoomReservation, getMyPlans } from '../api.js'

const SLOTS = [
  { key: '1-2限', label: '1・2限', time: '9:00〜12:30'  },
  { key: '3-4限', label: '3・4限', time: '13:30〜17:00' },
  { key: '5-6限', label: '5・6限', time: '17:10〜20:40' },
]
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function buildCalendarCells(year, month) {
  const cells = []
  const first = new Date(year, month - 1, 1)
  const last  = new Date(year, month, 0)
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month - 1, d))
  return cells
}

function shiftMonth(year, month, delta) {
  let m = month + delta, y = year
  if (m > 12) { m = 1; y++ }
  if (m < 1)  { m = 12; y-- }
  return { year: y, month: m }
}

export default function RoomReservationPage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()

  const today    = new Date()
  const todayStr = toDateStr(today)
  const maxDate  = new Date(today)
  maxDate.setDate(maxDate.getDate() + 7)
  const maxDateStr = toDateStr(maxDate)

  const initMonth = { year: today.getFullYear(), month: today.getMonth() + 1 }
  const [panels, setPanels] = useState([
    shiftMonth(initMonth.year, initMonth.month, -1),
    initMonth,
    shiftMonth(initMonth.year, initMonth.month,  1),
  ])
  const curr = panels[1]

  const [reservations, setReservations] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [bookingSlot, setBookingSlot] = useState(null)
  const [usageType, setUsageType] = useState('個人')
  const [planName, setPlanName]   = useState('')
  const [planId, setPlanId]       = useState(null)
  const [myPlans, setMyPlans]     = useState([])
  const [saving, setSaving] = useState(false)

  const sliderRef   = useRef(null)
  const touchStartX = useRef(null)
  const pendingNav  = useRef(null)
  const isAnimating = useRef(false)
  const needsReset  = useRef(false)

  useLayoutEffect(() => {
    if (needsReset.current && sliderRef.current) {
      needsReset.current = false
      sliderRef.current.style.transition = 'none'
      sliderRef.current.style.transform  = 'translateX(-100%)'
    }
  })

  useEffect(() => {
    getMyPlans(currentUser.member_id).then(setMyPlans).catch(console.error)
  }, [currentUser.member_id])

  useEffect(() => {
    setLoading(true)
    getRoomReservations(curr.year, curr.month)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [curr.year, curr.month])

  function rotatePrev() {
    setPanels(p => [shiftMonth(p[0].year, p[0].month, -1), p[0], p[1]])
    setSelected(null); setBookingSlot(null)
    needsReset.current = true
  }
  function rotateNext() {
    setPanels(p => [p[1], p[2], shiftMonth(p[2].year, p[2].month, 1)])
    setSelected(null); setBookingSlot(null)
    needsReset.current = true
  }

  function animateTo(pct) {
    const el = sliderRef.current
    if (!el) return
    isAnimating.current = true
    el.style.transition = 'transform 0.32s cubic-bezier(0.4,0,0.2,1)'
    el.style.transform  = `translateX(${pct}%)`
  }
  function onTransitionEnd() {
    isAnimating.current = false
    const nav = pendingNav.current
    pendingNav.current = null
    if (nav === 'prev') rotatePrev()
    else if (nav === 'next') rotateNext()
  }
  function handlePrev() {
    if (isAnimating.current) return
    pendingNav.current = 'prev'; animateTo(0)
  }
  function handleNext() {
    if (isAnimating.current) return
    pendingNav.current = 'next'; animateTo(-200)
  }
  function onTouchStart(e) {
    if (isAnimating.current) return
    touchStartX.current = e.touches[0].clientX
    sliderRef.current.style.transition = 'none'
  }
  function onTouchMove(e) {
    if (touchStartX.current === null || isAnimating.current) return
    const dx  = e.touches[0].clientX - touchStartX.current
    const w   = sliderRef.current.parentElement.offsetWidth
    const pct = -100 + (dx / w * 100)
    sliderRef.current.style.transform = `translateX(${Math.max(-160, Math.min(-40, pct))}%)`
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx > 50) {
      pendingNav.current = 'prev'; animateTo(0)
    } else if (dx < -50) {
      pendingNav.current = 'next'; animateTo(-200)
    } else {
      const el = sliderRef.current
      if (el) {
        el.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)'
        el.style.transform  = 'translateX(-100%)'
      }
    }
  }

  const resMap = {}
  for (const r of reservations) resMap[`${r.date}:${r.slot}`] = r

  function slotStatus(dateStr, slotKey) {
    const r = resMap[`${dateStr}:${slotKey}`]
    if (!r) return { res: null, isMe: false }
    return { res: r, isMe: r.member_id === currentUser?.member_id }
  }

  function openDay(day) {
    setSelected(day); setBookingSlot(null); setUsageType('個人'); setPlanName(''); setPlanId(null)
  }
  function startBooking(slotKey) {
    setBookingSlot(slotKey); setUsageType('個人'); setPlanName(''); setPlanId(null)
  }
  function selectPlan(plan) {
    setPlanName(plan.band_name)
    setPlanId(plan.plan_id)
  }

  async function handleReserve() {
    if (usageType === 'バンド' && !planName.trim()) { alert('企画名を入力してください'); return }
    const dateStr = toDateStr(selected)
    if (usageType === '個人' && dateStr > maxDateStr) {
      alert('個人練習は1週間先までしか予約できません'); return
    }
    setSaving(true)
    try {
      const created = await createRoomReservation({
        date: dateStr, slot: bookingSlot,
        member_id: currentUser.member_id, member_name: currentUser.full_name,
        usage_type: usageType,
        plan_name: usageType === 'バンド' ? planName.trim() : null,
        plan_id: usageType === 'バンド' ? (planId || null) : null,
      })
      setReservations(prev => [...prev, created])
      setBookingSlot(null)
    } catch (e) {
      if (e.code === '23505') {
        alert('この枠はすでに予約されています')
        const fresh = await getRoomReservations(curr.year, curr.month)
        setReservations(fresh)
      } else {
        alert('エラー: ' + e.message)
      }
    } finally { setSaving(false) }
  }

  async function handleDelete(reservationId) {
    if (!window.confirm('予約を取り消しますか？')) return
    setSaving(true)
    try {
      await deleteRoomReservation(reservationId)
      setReservations(prev => prev.filter(r => r.reservation_id !== reservationId))
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally { setSaving(false) }
  }

  function dotColor(dateStr, slotKey, isPast) {
    if (isPast) return '#e2e8f0'
    const { res, isMe } = slotStatus(dateStr, slotKey)
    if (!res)  return '#bbf7d0'
    if (isMe)  return '#0891b2'
    return '#94a3b8'
  }

  function renderCells(y, m) {
    return buildCalendarCells(y, m).map((day, i) => {
      if (!day) return <div key={`blank-${i}`} />
      const dateStr = toDateStr(day)
      const isPast  = dateStr < todayStr
      const isToday = dateStr === todayStr
      const isSel   = selected && toDateStr(selected) === dateStr
      const wd      = day.getDay()
      return (
        <button key={dateStr} onClick={() => openDay(day)} style={{
          background: isSel ? '#ecfeff' : 'transparent',
          border: 'none', cursor: isPast ? 'default' : 'pointer',
          padding: '6px 0 8px', borderRadius: 0,
          borderBottom: '1px solid #f8fafc',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isToday ? '#0891b2' : 'transparent',
            color: isToday ? '#fff' : isPast ? '#cbd5e1' : wd === 0 ? '#ef4444' : wd === 6 ? '#3b82f6' : '#1e293b',
          }}>{day.getDate()}</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {SLOTS.map(slot => (
              <span key={slot.key} style={{
                width: 7, height: 7, borderRadius: 2,
                background: dotColor(dateStr, slot.key, isPast), display: 'inline-block',
              }}/>
            ))}
          </div>
        </button>
      )
    })
  }

  const selectedStr = selected ? toDateStr(selected) : null
  const isOverWeek  = selectedStr && selectedStr > maxDateStr

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        color: '#fff', padding: '16px 20px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}/>
        <button style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }} onClick={() => navigate(-1)}>←</button>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>音楽練習室5 予約</span>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={handlePrev} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--page-bg)', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{curr.year}年{curr.month}月</span>
        <button onClick={handleNext} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--page-bg)', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }}>›</button>
      </div>

      {/* Calendar slider */}
      <div style={{ margin: '12px', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--card-shadow)', background: 'var(--card-bg)' }}>
        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #f1f5f9' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{
              textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 700,
              color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#64748b',
            }}>{w}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>
        ) : (
          <div style={{ overflow: 'hidden', touchAction: 'pan-y' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div ref={sliderRef} style={{ display: 'flex', willChange: 'transform', transform: 'translateX(-100%)' }} onTransitionEnd={onTransitionEnd}>
              {panels.map((p, idx) => (
                <div key={idx} style={{ minWidth: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                    {renderCells(p.year, p.month)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* Terms of use */}
      <div style={{ margin: '4px 12px 24px', background: '#fff7ed', borderRadius: 14, border: '1.5px solid #fed7aa', padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', marginBottom: 10 }}>📋 練習室利用規約</div>
        <div style={{ fontSize: 12, color: '#7c2d12', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>・<strong>個人練習</strong>の予約は<strong>本日から1週間先まで</strong>のみ可能です。</span>
          <span>・本サークルのメンバー以外の<strong>外部の人を練習室に入室させることは禁止</strong>です。</span>
          <span>・練習室は<strong>音楽練習目的のみ</strong>利用可能です。練習以外の目的での使用は禁止します。</span>
          <span>・予約を無断でキャンセル・無断占有した場合、<strong>次回以降の予約を制限する等の罰則</strong>を科す場合があります。</span>
          <span>・上記規約に違反した場合、幹部の判断により<strong>利用停止等の処分</strong>を行うことがあります。</span>
        </div>
      </div>

      {/* Day detail sheet */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setBookingSlot(null) } }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 480, padding: '16px 20px 40px',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }}/>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
                {curr.month}月{selected.getDate()}日（{WEEKDAYS[selected.getDay()]}）
              </span>
            </div>

            {SLOTS.map(slot => {
              const dateStr   = toDateStr(selected)
              const isPast    = dateStr < todayStr
              const { res, isMe } = slotStatus(dateStr, slot.key)
              const isExpanded = bookingSlot === slot.key

              return (
                <div key={slot.key} style={{
                  borderRadius: 12, marginBottom: 8,
                  border: '1.5px solid', borderColor: isExpanded ? '#0891b2' : 'var(--border)',
                  overflow: 'hidden',
                  background: isExpanded ? 'rgba(8,145,178,0.08)' : 'var(--card-bg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{slot.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{slot.time}</div>
                    </div>
                    {isPast ? (
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>終了</span>
                    ) : !res ? (
                      <button onClick={() => startBooking(isExpanded ? null : slot.key)} style={{
                        padding: '7px 16px',
                        background: isExpanded ? '#0891b2' : 'linear-gradient(135deg,#0891b2,#0e7490)',
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
                      }}>取り消し</button>
                    ) : (
                      <span style={{
                        padding: '5px 10px', background: 'var(--page-bg)', borderRadius: 20,
                        fontSize: 12, color: 'var(--text-sub)', fontWeight: 600,
                      }}>{res.member_name}</span>
                    )}
                  </div>

                  {res && !isMe && (
                    <div style={{ padding: '0 14px 10px', fontSize: 12, color: '#94a3b8' }}>
                      {res.usage_type === 'バンド' ? `バンド使用（${res.plan_name}）` : '個人使用'}
                    </div>
                  )}
                  {res && isMe && (
                    <div style={{ padding: '0 14px 10px', fontSize: 12, color: '#0e7490', fontWeight: 600 }}>
                      {res.usage_type === 'バンド' ? `バンド使用（${res.plan_name}）` : '個人使用'} ・ 自分の予約
                    </div>
                  )}

                  {isExpanded && !res && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 10, marginTop: 10 }}>
                        予約者：<strong style={{ color: 'var(--text)' }}>{currentUser?.full_name}</strong>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6 }}>使用用途</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['個人', 'バンド'].map(t => (
                            <button key={t} onClick={() => setUsageType(t)} style={{
                              flex: 1, padding: '9px 0',
                              border: '1.5px solid',
                              borderColor: usageType === t ? '#0891b2' : 'var(--border)',
                              borderRadius: 10, fontSize: 13, fontWeight: 700,
                              background: usageType === t ? 'rgba(8,145,178,0.1)' : 'var(--input-bg)',
                              color: usageType === t ? '#0e7490' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}>
                              {t === '個人' ? '個人使用' : 'バンド使用'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 個人練習 1週間制限の警告 */}
                      {usageType === '個人' && isOverWeek && (
                        <div style={{
                          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                          padding: '8px 12px', fontSize: 12, color: '#991b1b', marginBottom: 10,
                        }}>
                          ⚠️ 個人練習は1週間先（{maxDate.getMonth()+1}/{maxDate.getDate()}）までしか予約できません
                        </div>
                      )}

                      {usageType === 'バンド' && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6 }}>企画を選択 *</div>
                          {myPlans.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                              {myPlans.map(plan => (
                                <button
                                  key={plan.plan_id}
                                  onClick={() => selectPlan(plan)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                                    border: '1.5px solid',
                                    borderColor: planId === plan.plan_id ? '#0891b2' : 'var(--border)',
                                    background: planId === plan.plan_id ? 'rgba(8,145,178,0.1)' : 'var(--input-bg)',
                                    textAlign: 'left',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{plan.band_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{plan.live?.live_name}</div>
                                  </div>
                                  {planId === plan.plan_id && <span style={{ color: '#0891b2', fontSize: 16 }}>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>上記にない場合は直接入力</div>
                          <input
                            style={{
                              width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)',
                              borderRadius: 10, fontSize: 14, background: 'var(--input-bg)',
                              color: 'var(--text)', boxSizing: 'border-box',
                            }}
                            placeholder="バンド名・企画名を入力"
                            value={planName}
                            onChange={e => { setPlanName(e.target.value); setPlanId(null) }}
                          />
                        </div>
                      )}
                      <button
                        onClick={handleReserve}
                        disabled={saving || (usageType === '個人' && isOverWeek)}
                        style={{
                          width: '100%', padding: '11px',
                          background: (usageType === '個人' && isOverWeek)
                            ? '#e2e8f0'
                            : 'linear-gradient(135deg,#0891b2,#0e7490)',
                          color: (usageType === '個人' && isOverWeek) ? '#94a3b8' : '#fff',
                          border: 'none', borderRadius: 10,
                          fontSize: 14, fontWeight: 700,
                          cursor: (usageType === '個人' && isOverWeek) ? 'not-allowed' : 'pointer',
                          boxShadow: (usageType === '個人' && isOverWeek) ? 'none' : '0 3px 10px rgba(8,145,178,0.35)',
                          marginTop: 2,
                        }}
                      >
                        {saving ? '予約中...' : '予約を確定する'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            <button onClick={() => { setSelected(null); setBookingSlot(null) }} style={{
              width: '100%', padding: '11px', background: 'var(--page-bg)',
              border: 'none', borderRadius: 12, fontSize: 14,
              cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 600, marginTop: 4,
            }}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}
