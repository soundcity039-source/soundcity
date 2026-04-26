import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 17, fontWeight: 800, position: 'relative' },
  stepIndicator: {
    display: 'flex', gap: 4, alignItems: 'center', position: 'relative', marginLeft: 'auto',
  },
  step: { width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' },
  stepActive: { background: '#fff', width: 20, borderRadius: 4 },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  liveCard: {
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderRadius: 14, padding: '14px 16px', marginBottom: 12,
    border: '1px solid #86efac',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  liveIcon: { fontSize: 24 },
  liveInfo: {},
  liveLabel: { fontSize: 11, color: '#166534', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 },
  liveName: { fontWeight: 800, color: '#14532d', fontSize: 15 },
  card: {
    background: 'var(--card-bg)', borderRadius: 16, padding: '20px 16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)',
  },
  fieldGroup: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: 0.3 },
  required: { color: '#ef4444', marginLeft: 4 },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, boxSizing: 'border-box',
    background: 'var(--input-bg)', outline: 'none',
  },
  error: { color: '#ef4444', fontSize: 12, marginTop: 5, fontWeight: 500 },
  templateBtn: {
    width: '100%', padding: '13px', background: '#fff',
    border: '1.5px dashed #06C755', borderRadius: 12, color: '#06C755',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12,
  },
  nextBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
  },
}

export default function ApplyPageA() {
  const navigate = useNavigate()
  const { formState, setFormState } = useApp()
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  function handleNext() {
    const newErrors = {}
    if (!formState.band_name.trim()) newErrors.band_name = 'バンド名を入力してください'
    const count = Number(formState.song_count)
    if (!formState.song_count || !Number.isInteger(count) || count < 1) {
      newErrors.song_count = '1以上の整数を入力してください'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    if (formState.parts.length === 0) {
      setFormState(prev => ({
        ...prev,
        parts: [
          { part: 'Vo', member: null },
          { part: 'Gt', member: null },
          { part: 'Ba', member: null },
          { part: 'Dr', member: null },
          { part: 'Key', member: null },
        ],
      }))
    }
    navigate('/apply/b')
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>企画応募</span>
        <div style={s.stepIndicator}>
          <div style={{ ...s.step, ...s.stepActive }} />
          <div style={s.step} />
          <div style={s.step} />
        </div>
      </div>
      <div style={s.content}>
        {formState.live_name && (
          <div style={s.liveCard}>
            <span style={s.liveIcon}>🎤</span>
            <div style={s.liveInfo}>
              <div style={s.liveLabel}>応募先ライブ</div>
              <div style={s.liveName}>{formState.live_name}</div>
            </div>
          </div>
        )}
        <div style={s.card}>
          <div style={s.fieldGroup}>
            <label style={s.label}>バンド名<span style={s.required}>*</span></label>
            <input
              style={s.input}
              placeholder="バンド名を入力"
              value={formState.band_name}
              onChange={e => handleChange('band_name', e.target.value)}
            />
            {errors.band_name && <div style={s.error}>{errors.band_name}</div>}
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>曲数<span style={s.required}>*</span></label>
            <input
              style={s.input}
              type="number"
              min="1"
              placeholder="例：2"
              value={formState.song_count}
              onChange={e => handleChange('song_count', e.target.value)}
            />
            {errors.song_count && <div style={s.error}>{errors.song_count}</div>}
          </div>
        </div>
        <button style={s.templateBtn} onClick={() => navigate('/templates', { state: { from: 'apply' } })}>
          📂 テンプレートから引用
        </button>
        <button style={s.nextBtn} onClick={handleNext}>
          次へ →
        </button>
      </div>
    </div>
  )
}
