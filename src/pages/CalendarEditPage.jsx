import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../api.js'

const TYPE_OPTIONS = [
  { value: 'camp',  label: '合宿',      icon: '🏕️', color: '#ffedd5', textColor: '#c2410c' },
  { value: 'other', label: 'その他',    icon: '📅', color: '#ede9fe', textColor: '#5b21b6' },
]

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'var(--header-grad)', color: '#fff', padding: '16px 20px 20px',
    display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
  },
  headerCircle: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' },
  backBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  addBtn: {
    width: '100%', padding: '12px', background: 'var(--primary)',
    color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginBottom: 20,
  },
  sectionLabel: { fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card: {
    background: 'var(--card-bg)', borderRadius: 12, marginBottom: 8,
    border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden',
  },
  cardBody: { padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 },
  cardIcon: { fontSize: 22, flexShrink: 0, marginTop: 1 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  cardDate: { fontSize: 12, color: 'var(--text-sub)' },
  cardNote: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  cardBtns: { display: 'flex', gap: 6, padding: '0 14px 10px' },
  editBtn: { flex: 1, padding: '6px', background: '#dcfce7', border: 'none', borderRadius: 8, color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  delBtn:  { flex: 1, padding: '6px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  liveCard: { padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--card-border)' },
  liveTag: { fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: 6, flexShrink: 0 },
  liveName: { fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  liveDate: { fontSize: 11, color: 'var(--text-muted)' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal: { background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '20px 16px 40px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 16px' },
  modalTitle: { fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text)' },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 5, marginTop: 12, display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--input-bg)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none', minHeight: 70, resize: 'vertical', fontFamily: 'inherit' },
  typeRow: { display: 'flex', gap: 8, marginTop: 4 },
  typeChip: { flex: 1, padding: '10px 6px', borderRadius: 10, border: '2px solid transparent', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, transition: 'border-color 0.15s' },
  typeChipActive: { borderColor: '#6366f1' },
  saveBtn: { width: '100%', padding: '13px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20 },
  cancelBtn: { width: '100%', padding: '10px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, cursor: 'pointer', marginTop: 8 },
}

function formatDate(d) {
  if (!d) return ''
  return d.replace(/-/g, '/').replace(/^(\d+)\/0?(\d+)\/0?(\d+)$/, '$1/$2/$3')
}

const EMPTY_FORM = { title: '', type: 'camp', date_start: '', date_end: '', note: '' }

export default function CalendarEditPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [lives, setLives] = useState([])
  const [modal, setModal] = useState(null) // null | 'add' | event object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getCalendarEvents(), getLives({ all: true })])
      .then(([evRes, livesRes]) => {
        setEvents(evRes || [])
        setLives((livesRes || []).sort((a, b) => a.date1 < b.date1 ? 1 : -1))
      })
      .catch(console.error)
  }, [])

  function openAdd() {
    setForm(EMPTY_FORM)
    setModal('add')
  }

  function openEdit(ev) {
    setForm({ title: ev.title, type: ev.type, date_start: ev.date_start, date_end: ev.date_end || '', note: ev.note || '' })
    setModal(ev)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date_start) { alert('タイトルと開始日は必須です'); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        date_start: form.date_start,
        date_end: form.date_end || null,
        note: form.note.trim() || null,
      }
      if (modal === 'add') {
        const ev = await createCalendarEvent(payload)
        setEvents(prev => [...prev, ev].sort((a, b) => a.date_start < b.date_start ? -1 : 1))
      } else {
        const ev = await updateCalendarEvent({ event_id: modal.event_id, ...payload })
        setEvents(prev => prev.map(e => e.event_id === ev.event_id ? ev : e))
      }
      setModal(null)
    } catch (e) {
      alert('保存エラー: ' + (e.message || JSON.stringify(e)))
    } finally { setSaving(false) }
  }

  async function handleDelete(ev) {
    if (!window.confirm(`「${ev.title}」を削除しますか？`)) return
    try {
      await deleteCalendarEvent(ev.event_id)
      setEvents(prev => prev.filter(e => e.event_id !== ev.event_id))
    } catch (e) {
      alert('削除エラー: ' + (e.message || JSON.stringify(e)))
    }
  }

  const typeInfo = (type) => TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[1]

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>カレンダー編集</span>
      </div>
      <div style={s.content}>
        <button style={s.addBtn} onClick={openAdd}>＋ 新しいイベントを追加</button>

        {/* Custom events */}
        <div style={s.sectionLabel}>合宿・イベント</div>
        {events.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>イベントはまだありません</div>}
        {events.map(ev => {
          const t = typeInfo(ev.type)
          return (
            <div key={ev.event_id} style={s.card}>
              <div style={s.cardBody}>
                <span style={s.cardIcon}>{t.icon}</span>
                <div style={s.cardInfo}>
                  <div style={s.cardTitle}>{ev.title}</div>
                  <div style={s.cardDate}>
                    {formatDate(ev.date_start)}{ev.date_end && ev.date_end !== ev.date_start ? ` 〜 ${formatDate(ev.date_end)}` : ''}
                  </div>
                  {ev.note && <div style={s.cardNote}>{ev.note}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textColor, background: t.color, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{t.label}</span>
              </div>
              <div style={s.cardBtns}>
                <button style={s.editBtn} onClick={() => openEdit(ev)}>編集</button>
                <button style={s.delBtn} onClick={() => handleDelete(ev)}>削除</button>
              </div>
            </div>
          )
        })}

        {/* Lives (read-only reference) */}
        <div style={{ ...s.sectionLabel, marginTop: 20 }}>ライブ日程（ライブ管理から自動反映）</div>
        <div style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden', marginBottom: 8 }}>
          {lives.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>ライブはまだありません</div>}
          {lives.map(live => (
            <div key={live.live_id} style={s.liveCard}>
              <span style={s.liveTag}>🎸</span>
              <span style={s.liveName}>{live.live_name}</span>
              <span style={s.liveDate}>
                {formatDate(live.date1)}{live.date2 ? `〜${formatDate(live.date2)}` : ''}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          ライブ日程は「ライブ管理」画面で設定してください
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal !== null && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHandle} />
            <div style={s.modalTitle}>{modal === 'add' ? '新しいイベント' : 'イベントを編集'}</div>

            <label style={s.label}>種類</label>
            <div style={s.typeRow}>
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  style={{ ...s.typeChip, background: t.color, color: t.textColor, ...(form.type === t.value ? s.typeChipActive : {}) }}
                  onClick={() => setForm(prev => ({ ...prev, type: t.value }))}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <label style={s.label}>タイトル *</label>
            <input style={s.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="例：春合宿 2026" />

            <label style={s.label}>開始日 *</label>
            <input type="date" style={s.input} value={form.date_start} onChange={e => setForm(p => ({ ...p, date_start: e.target.value }))} />

            <label style={s.label}>終了日（複数日の場合）</label>
            <input type="date" style={s.input} value={form.date_end} onChange={e => setForm(p => ({ ...p, date_end: e.target.value }))} />

            <label style={s.label}>メモ（任意）</label>
            <textarea style={s.textarea} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="場所・集合時間など" />

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存する'}</button>
            <button style={s.cancelBtn} onClick={() => setModal(null)}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  )
}
