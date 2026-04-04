import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7' },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '20px 16px', maxWidth: 480, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 12, padding: '20px 16px', marginBottom: 16 },
  liveLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  liveName: { fontWeight: 700, color: '#333', fontSize: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  required: { color: '#e53e3e', marginLeft: 4 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box',
  },
  error: { color: '#e53e3e', fontSize: 13, marginTop: 4 },
  templateBtn: {
    width: '100%', padding: '12px', background: '#fff',
    border: '1px dashed #06C755', borderRadius: 8, color: '#06C755',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
  },
  nextBtn: {
    width: '100%', padding: '14px', background: '#06C755',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
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
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        企画応募（1/3）
      </div>
      <div style={s.content}>
        {formState.live_name && (
          <div style={s.card}>
            <div style={s.liveLabel}>応募先ライブ</div>
            <div style={s.liveName}>{formState.live_name}</div>
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
