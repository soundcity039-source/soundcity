import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getCalendarEvents, getRoomReservations, getMyPlans } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const EVENT_COLOR   = { live: '#16a34a', camp: '#ea580c', other: '#4f46e5', room: '#be185d' }
const EVENT_BG      = { live: '#dcfce7', camp: '#ffedd5', other: '#ede9fe', room: '#fce7f3' }
const EVENT_BG_CHIP = { live: '#bbf7d0', camp: '#fed7aa', other: '#c7d2fe', room: '#fbcfe8' }
const EVENT_NAME    = { live: 'ライブ', camp: '合宿', other: 'イベント', room: '練習室' }
const EVENT_ICON    = { live: '🎸', camp: '🏕️', other: '📅', room: '🎵' }
const WEEKDAYS      = ['日', '月', '火', '水', '木', '金', '土']

function chipText(ev) {
  if (ev.type === 'room') {
    const name = ev.label.length > 4 ? ev.label.slice(0, 4) + '…' : ev.label
    return `${name} ${ev.sublabel}`
  }
  const t = ev.label || ''
  return t.length > 5 ? t.slice(0, 5) + '…' : t
}

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function buildCells(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const lastDate = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(d)
  return cells
}

function shiftMonth(year, month, delta) {
  let m = month + delta, y = year
  if (m > 12) { m = 1; y++ }
  if (m < 1)  { m = 12; y-- }
  return { year: y, month: m }
}

function getEventsForDay(ymd, lives, calendarEvents, myReservations) {
  const events = []
  for (const live of lives) {
    const inRange = live.date2
      ? live.date1 <= ymd && live.date2 >= ymd
      : live.date1 === ymd
    if (inRange) events.push({ type: 'live', label: live.live_name, id: live.live_id })
  }
  for (const ev of calendarEvents) {
    const inRange = ev.date_end
      ? ev.date_start <= ymd && ev.date_end >= ymd
      : ev.date_start === ymd
    if (inRange) events.push({ type: ev.type, label: ev.title, note: ev.note, id: ev.event_id })
  }
  for (const res of myReservations) {
    if (res.date === ymd) {
      events.push({ type: 'room', label: res.plan_name || '個人練習', sublabel: res.slot, id: res.reservation_id })
    }
  }
  return events
}

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'var(--header-grad)', color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
  },
  headerCircle: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthLabel: { fontSize: 17, fontWeight: 800 },
  navBtn: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '6px 14px', fontSize: 16, cursor: 'pointer', color: 'var(--text)' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginBottom: 14 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-sub)' },
  weekdayRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 },
  weekday: { textAlign: 'center', fontSize: 11, fontWeight: 700, paddingBottom: 4 },
  sliderWrap: { overflow: 'hidden', touchAction: 'pan-y' },
  slider: { display: 'flex', willChange: 'transform' },
  panel: { minWidth: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 16 },
  cell: {
    minHeight: 64, borderRadius: 8, padding: '4px 3px 3px',
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    cursor: 'pointer', overflow: 'hidden',
  },
  cellEmpty: { background: 'transparent', border: 'none', cursor: 'default', minHeight: 64 },
  cellToday: { border: '2px solid var(--primary)' },
  cellSelected: { border: '2px solid #06C755', background: '#f0fdf4' },
  dateNum: { fontSize: 12, fontWeight: 600, textAlign: 'center', lineHeight: 1.4, marginBottom: 2 },
  chip: {
    fontSize: 9, fontWeight: 700,
    padding: '2px 3px', borderRadius: 3, marginBottom: 2,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    lineHeight: 1.4,
  },
  moreChip: { fontSize: 8, fontWeight: 600, textAlign: 'center', color: 'var(--text-muted)', lineHeight: 1.4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '16px 16px 40px', boxSizing: 'border-box', maxHeight: '60vh', overflowY: 'auto' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 14px' },
  sheetDate: { fontSize: 15, fontWeight: 800, marginBottom: 14, color: 'var(--text)' },
  eventItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 8 },
  eventIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  eventLabel: { fontSize: 14, fontWeight: 700 },
  eventNote: { fontSize: 12, color: 'var(--text-sub)', marginTop: 2 },
  noEvent: { textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 },
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const today = new Date()
  const todayYMD = toYMD(today)

  // 3パネル循環方式: panels[1] が常に表示中の月
  const initMonth = { year: today.getFullYear(), month: today.getMonth() + 1 }
  const [panels, setPanels] = useState([
    shiftMonth(initMonth.year, initMonth.month, -1),
    initMonth,
    shiftMonth(initMonth.year, initMonth.month,  1),
  ])
  const curr = panels[1]

  const [lives, setLives] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [myPlanIds, setMyPlanIds] = useState(new Set())
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  const sliderRef   = useRef(null)
  const touchStartX = useRef(null)
  const pendingNav  = useRef(null)
  const isAnimating = useRef(false)
  const needsReset  = useRef(false)

  // ペイント前にスライダー位置をリセット（ちらつき・フリーズなし）
  useLayoutEffect(() => {
    if (needsReset.current && sliderRef.current) {
      needsReset.current = false
      sliderRef.current.style.transition = 'none'
      sliderRef.current.style.transform  = 'translateX(-100%)'
    }
  })

  useEffect(() => {
    Promise.all([getLives({ all: true }), getCalendarEvents(), getMyPlans(currentUser.member_id)])
      .then(([livesRes, evRes, plansRes]) => {
        setLives(livesRes || [])
        setCalendarEvents(evRes || [])
        setMyPlanIds(new Set((plansRes || []).map(p => p.plan_id)))
      }).catch(console.error).finally(() => setLoading(false))
  }, [currentUser.member_id])

  useEffect(() => {
    getRoomReservations(curr.year, curr.month)
      .then(rows => setMyReservations((rows || []).filter(r =>
        r.member_id === currentUser.member_id ||
        (r.plan_id && myPlanIds.has(r.plan_id))
      )))
      .catch(console.error)
  }, [curr.year, curr.month, currentUser.member_id, myPlanIds])

  // パネルを前月方向に回転
  function rotatePrev() {
    setPanels(p => [shiftMonth(p[0].year, p[0].month, -1), p[0], p[1]])
    setSelectedDay(null)
    needsReset.current = true
  }
  // パネルを次月方向に回転
  function rotateNext() {
    setPanels(p => [p[1], p[2], shiftMonth(p[2].year, p[2].month, 1)])
    setSelectedDay(null)
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
    // スナップバック時は何もしない（スライダーはすでに -100% にある）
  }

  function handlePrev() {
    if (isAnimating.current) return
    pendingNav.current = 'prev'
    animateTo(0)
  }
  function handleNext() {
    if (isAnimating.current) return
    pendingNav.current = 'next'
    animateTo(-200)
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
      pendingNav.current = 'prev'
      animateTo(0)
    } else if (dx < -50) {
      pendingNav.current = 'next'
      animateTo(-200)
    } else {
      // スナップバック: isAnimating を立てずに直接リセット
      // （transform が変わらない場合 transitionend が発火しないため isAnimating が固まるのを防ぐ）
      const el = sliderRef.current
      if (el) {
        el.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)'
        el.style.transform  = 'translateX(-100%)'
      }
    }
  }

  function renderCells(y, m) {
    return buildCells(y, m).map((day, idx) => {
      if (!day) return <div key={`e${idx}`} style={s.cellEmpty} />
      const ymd = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      const events     = getEventsForDay(ymd, lives, calendarEvents, myReservations)
      const isToday    = ymd === todayYMD
      const isSelected = selectedDay === ymd
      const dow = new Date(y, m - 1, day).getDay()
      const dateColor = dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : 'var(--text)'
      return (
        <div
          key={day}
          style={{ ...s.cell, ...(isToday ? s.cellToday : {}), ...(isSelected ? s.cellSelected : {}) }}
          onClick={() => setSelectedDay(isSelected ? null : ymd)}
        >
          <div style={{ ...s.dateNum, color: isToday ? 'var(--primary)' : dateColor, fontWeight: isToday ? 800 : 600 }}>
            {day}
          </div>
          {events.slice(0, 3).map((ev, i) => (
            <div key={i} style={{ ...s.chip, background: EVENT_BG_CHIP[ev.type], color: EVENT_COLOR[ev.type] }}>
              {chipText(ev)}
            </div>
          ))}
          {events.length > 3 && <div style={s.moreChip}>+{events.length - 3}</div>}
        </div>
      )
    })
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>カレンダー</span>
      </div>
      <div style={s.content}>
        <div style={s.monthNav}>
          <button style={s.navBtn} onClick={handlePrev}>‹</button>
          <span style={s.monthLabel}>{curr.year}年{curr.month}月</span>
          <button style={s.navBtn} onClick={handleNext}>›</button>
        </div>

        <div style={s.legend}>
          {Object.keys(EVENT_NAME).map(type => (
            type !== 'room' || myReservations.length > 0 ? (
              <span key={type} style={s.legendItem}>
                <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: EVENT_BG_CHIP[type], color: EVENT_COLOR[type] }}>
                  {EVENT_NAME[type]}
                </span>
              </span>
            ) : null
          ))}
        </div>

        <div style={s.weekdayRow}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ ...s.weekday, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-muted)' }}>{w}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>読み込み中...</div>
        ) : (
          <div style={s.sliderWrap} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div ref={sliderRef} style={{ ...s.slider, transform: 'translateX(-100%)' }} onTransitionEnd={onTransitionEnd}>
              {panels.map((p, i) => (
                <div key={i} style={s.panel}>
                  <div style={s.grid}>{renderCells(p.year, p.month)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)', fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: 13 }}>📌 カレンダーについて</div>
          <div>・🎸 <b>ライブ</b>：ライブの開催日程</div>
          <div>・🏕️ <b>合宿</b>：合宿の日程</div>
          <div>・📅 <b>イベント</b>：その他のサークルイベント</div>
          <div>・🎵 <b>練習室</b>：自分が予約した練習室の枠</div>
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--page-bg)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 11 }}>
            ※ 今後のライブ日程・合宿日程などは随時更新されます
          </div>
        </div>
      </div>

      {selectedDay && (() => {
        const events = getEventsForDay(selectedDay, lives, calendarEvents, myReservations)
        const d = new Date(selectedDay)
        const label = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
        return (
          <div style={s.overlay} onClick={() => setSelectedDay(null)}>
            <div style={s.sheet} onClick={e => e.stopPropagation()}>
              <div style={s.sheetHandle} />
              <div style={s.sheetDate}>{label}</div>
              {events.length === 0
                ? <div style={s.noEvent}>予定はありません</div>
                : events.map((ev, i) => (
                    <div key={i} style={{ ...s.eventItem, background: EVENT_BG[ev.type] }}>
                      <span style={s.eventIcon}>{EVENT_ICON[ev.type]}</span>
                      <div>
                        <div style={{ ...s.eventLabel, color: EVENT_COLOR[ev.type] }}>{EVENT_NAME[ev.type]}</div>
                        <div style={s.eventLabel}>{ev.label}</div>
                        {ev.sublabel && <div style={s.eventNote}>{ev.sublabel}</div>}
                        {ev.note && <div style={s.eventNote}>{ev.note}</div>}
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )
      })()}
    </div>
  )
}
