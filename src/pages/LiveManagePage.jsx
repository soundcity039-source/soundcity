import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, createLive, updateLive } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

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
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  addBtn: {
    width: '100%', padding: '12px', background: '#2d3748', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16,
  },
  card: {
    background: 'var(--card-bg)', borderRadius: 12, padding: '16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)', border: '1px solid var(--card-border)',
  },
  liveName: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  meta: { fontSize: 13, color: '#666', marginBottom: 4 },
  badge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 12,
    fontSize: 12, fontWeight: 600, marginTop: 6, marginRight: 6,
  },
  badgeOpen: { background: '#e6f9ed', color: '#06C755' },
  badgeClosed: { background: '#fff3e0', color: '#e67e22' },
  badgeDone: { background: '#f5f5f5', color: '#888' },
  editBtn: {
    marginTop: 10, padding: '7px 14px', background: '#eef2ff', border: 'none',
    borderRadius: 8, color: '#4c51bf', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
  },
  modalBox: {
    background: 'var(--card-bg)', borderRadius: '16px 16px 0 0', width: '100%',
    maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px 32px',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'var(--input-bg)',
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 15, background: 'var(--card-bg)', boxSizing: 'border-box',
  },
  feeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 },
  saveBtn: {
    width: '100%', padding: '13px', background: '#2d3748', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
  cancelBtn: {
    width: '100%', padding: '11px', background: '#f5f5f5',
    border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer', marginTop: 8, color: '#555',
  },
}

const STATUS_LABELS = { open: '応募受付中', closed: '締切済み', done: '終了' }
const STATUS_STYLES = { open: s.badgeOpen, closed: s.badgeClosed, done: s.badgeDone }

function getDisplayStatus(live) {
  if (live.status === 'open' && live.deadline && new Date(live.deadline) < new Date()) {
    return 'closed'
  }
  return live.status
}

const EMPTY_FORM = {
  live_name: '', date1: '', date2: '', deadline: '',
  fee_mode: 'flat', fee_flat: '', fee_1plan: '', fee_2plan: '', fee_3plan: '',
  status: 'open',
  max_cast_plans: '', max_leader_plans: '',
}

function formatDateForInput(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function formatDatetimeForInput(dtStr) {
  if (!dtStr) return ''
  return dtStr.slice(0, 16)
}

export default function LiveManagePage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLive, setEditingLive] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getLives({})
      .then(res => setLives(res.lives || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditingLive(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(live) {
    setEditingLive(live)
    setForm({
      live_name: live.live_name || '',
      date1: formatDateForInput(live.date1),
      date2: formatDateForInput(live.date2),
      deadline: formatDatetimeForInput(live.deadline),
      fee_mode: live.fee_mode || 'flat',
      fee_flat: live.fee_flat != null ? String(live.fee_flat) : '',
      fee_1plan: live.fee_1plan != null ? String(live.fee_1plan) : '',
      fee_2plan: live.fee_2plan != null ? String(live.fee_2plan) : '',
      fee_3plan: live.fee_3plan != null ? String(live.fee_3plan) : '',
      status: live.status || 'open',
      max_cast_plans: live.max_cast_plans != null ? String(live.max_cast_plans) : '',
      max_leader_plans: live.max_leader_plans != null ? String(live.max_leader_plans) : '',
    })
    setShowModal(true)
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.live_name.trim() || !form.date1 || !form.deadline) {
      alert('ライブ名・日程・締切は必須です')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        caller_uid: currentUser.line_uid,
        fee_flat: form.fee_flat ? Number(form.fee_flat) : null,
        fee_1plan: form.fee_1plan ? Number(form.fee_1plan) : null,
        fee_2plan: form.fee_2plan ? Number(form.fee_2plan) : null,
        fee_3plan: form.fee_3plan ? Number(form.fee_3plan) : null,
        max_cast_plans: form.max_cast_plans ? Number(form.max_cast_plans) : null,
        max_leader_plans: form.max_leader_plans ? Number(form.max_leader_plans) : null,
      }
      if (editingLive) {
        const result = await updateLive({ ...payload, live_id: editingLive.live_id })
        setLives(prev => prev.map(l => l.live_id === editingLive.live_id ? (result || { ...l, ...payload }) : l))
      } else {
        const result = await createLive(payload)
        setLives(prev => [...prev, result.live || result])
      }
      setShowModal(false)
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>ライブ管理</span>
      </div>
      <div style={s.content}>
        <button style={s.addBtn} onClick={openAdd}>＋ 新規ライブ作成</button>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>読み込み中...</div>}
        {!loading && lives.map(live => (
          <div key={live.live_id} style={s.card}>
            <div style={s.liveName}>{live.live_name}</div>
            <div style={s.meta}>📅 {live.date1}{live.date2 ? ` / ${live.date2}` : ''}</div>
            <div style={s.meta}>⏰ 締切：{live.deadline}</div>
            <div style={s.meta}>料金モード：{live.fee_mode === 'flat' ? `一律 ${live.fee_flat}円` : '段階制'}</div>
            <span style={{ ...s.badge, ...(STATUS_STYLES[getDisplayStatus(live)] || s.badgeDone) }}>
              {STATUS_LABELS[getDisplayStatus(live)] || live.status}
            </span>
            <div>
              <button style={s.editBtn} onClick={() => openEdit(live)}>編集</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={s.modal} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>{editingLive ? 'ライブ編集' : '新規ライブ作成'}</div>

            <div style={s.fieldGroup}>
              <label style={s.label}>ライブ名 *</label>
              <input style={s.input} value={form.live_name} onChange={e => handleFormChange('live_name', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>開催日1 *</label>
              <input style={s.input} type="date" value={form.date1} onChange={e => handleFormChange('date1', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>開催日2（任意）</label>
              <input style={s.input} type="date" value={form.date2} onChange={e => handleFormChange('date2', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>応募締切 *</label>
              <input style={s.input} type="datetime-local" value={form.deadline} onChange={e => handleFormChange('deadline', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>ステータス</label>
              <select style={s.select} value={form.status} onChange={e => handleFormChange('status', e.target.value)}>
                <option value="open">応募受付中</option>
                <option value="closed">締切済み</option>
                <option value="done">終了</option>
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>料金モード</label>
              <select style={s.select} value={form.fee_mode} onChange={e => handleFormChange('fee_mode', e.target.value)}>
                <option value="flat">一律</option>
                <option value="tiered">段階制</option>
              </select>
            </div>
            {form.fee_mode === 'flat' ? (
              <div style={s.fieldGroup}>
                <label style={s.label}>金額（円）</label>
                <input style={s.input} type="number" value={form.fee_flat} onChange={e => handleFormChange('fee_flat', e.target.value)} />
              </div>
            ) : (
              <div style={s.fieldGroup}>
                <label style={s.label}>段階制料金</label>
                <div style={s.feeGrid}>
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>1企画</div>
                    <input style={s.input} type="number" value={form.fee_1plan} onChange={e => handleFormChange('fee_1plan', e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>2企画</div>
                    <input style={s.input} type="number" value={form.fee_2plan} onChange={e => handleFormChange('fee_2plan', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>3企画以上</div>
                    <input style={s.input} type="number" value={form.fee_3plan} onChange={e => handleFormChange('fee_3plan', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div style={s.fieldGroup}>
              <label style={s.label}>出演企画数の上限（空欄＝無制限）</label>
              <input style={s.input} type="number" min="1" placeholder="例：2"
                value={form.max_cast_plans} onChange={e => handleFormChange('max_cast_plans', e.target.value)} />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>1人が出演できる企画数の上限（キャストとして含まれる企画の合計）</div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>代表者応募数の上限（空欄＝無制限）</label>
              <input style={s.input} type="number" min="1" placeholder="例：1"
                value={form.max_leader_plans} onChange={e => handleFormChange('max_leader_plans', e.target.value)} />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>1人が代表者として応募できる企画数の上限</div>
            </div>

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存する'}
            </button>
            <button style={s.cancelBtn} onClick={() => setShowModal(false)}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  )
}
