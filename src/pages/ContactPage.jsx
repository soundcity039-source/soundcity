import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const TYPES = ['バグ報告', '機能要望', '質問', 'その他']
const TO = 'soundcity039@gmail.com'

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
    background: 'rgba(255,255,255,0.1)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  infoBox: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    border: '1px solid #7dd3fc', borderRadius: 14,
    padding: '14px 16px', fontSize: 13, color: '#0c4a6e', marginBottom: 14,
    lineHeight: 1.7, display: 'flex', gap: 10, alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  infoText: {},
  card: {
    background: 'var(--card-bg)', borderRadius: 16, padding: '20px 16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)',
  },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: 0.3 },
  required: { color: '#ef4444', marginLeft: 4 },
  select: {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, background: 'var(--input-bg)', boxSizing: 'border-box',
    outline: 'none', appearance: 'none',
  },
  textarea: {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, boxSizing: 'border-box',
    resize: 'vertical', minHeight: 150, fontFamily: 'inherit',
    background: 'var(--input-bg)', outline: 'none',
  },
  fieldGroup: { marginBottom: 18 },
  sendBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
    letterSpacing: 0.3,
  },
  disabledBtn: { opacity: 0.5, cursor: 'not-allowed' },
  error: { color: '#ef4444', fontSize: 12, marginTop: 5, fontWeight: 500 },
}

export default function ContactPage() {
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleSend() {
    if (!type) { setError('種別を選択してください'); return }
    if (!message.trim()) { setError('内容を入力してください'); return }
    setError('')

    const subject = encodeURIComponent(`[SoundCity] ${type}`)
    const body = encodeURIComponent(
      `【種別】${type}\n【送信者】${currentUser?.full_name || '不明'}\n\n【内容】\n${message}`
    )
    window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>運営への連絡</span>
      </div>
      <div style={s.content}>
        <div style={s.infoBox}>
          <span style={s.infoIcon}>✉️</span>
          <div style={s.infoText}>
            バグ報告・機能要望などはこちらから。<br />
            送信ボタンでメールアプリが開きます。<br />
            <strong>{TO}</strong>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.fieldGroup}>
            <label style={s.label}>種別<span style={s.required}>*</span></label>
            <select style={s.select} value={type} onChange={e => { setType(e.target.value); setError('') }}>
              <option value="">選択してください</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>内容<span style={s.required}>*</span></label>
            <textarea
              style={s.textarea}
              placeholder="内容を入力してください..."
              value={message}
              onChange={e => { setMessage(e.target.value); setError('') }}
            />
          </div>
          {error && <div style={s.error}>{error}</div>}
        </div>
        <button
          style={{ ...s.sendBtn, ...(!type || !message.trim() ? s.disabledBtn : {}) }}
          onClick={handleSend}
        >
          メールアプリで送信
        </button>
      </div>
    </div>
  )
}
