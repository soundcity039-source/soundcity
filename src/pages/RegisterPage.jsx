import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerMember } from '../api.js'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'

const MAIN_PARTS = ['Vo', 'Gt', 'Ba', 'Dr', 'Key', 'DJ', 'Sax', 'その他']
const WANT_PARTS_OPTIONS = ['Vo', 'Gt', 'Ba', 'Dr', 'Key', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  page: { minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text)', paddingBottom: 40 },
  header: {
    background: 'var(--header-grad)',
    color: '#fff', padding: '28px 20px 20px',
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', top: -40, right: -40, width: 140, height: 140,
    borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
  },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' },
  headerTitle: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    padding: '6px 12px', borderRadius: 8,
  },
  form: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: 'var(--card-bg)', borderRadius: 16, padding: '20px 16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)',
  },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: 0.3 },
  required: { color: '#ef4444', marginLeft: 4 },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, boxSizing: 'border-box',
    background: 'var(--input-bg)', outline: 'none',
  },
  select: {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 15, background: 'var(--input-bg)', boxSizing: 'border-box',
    outline: 'none', appearance: 'none',
  },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center',
    padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 20,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', userSelect: 'none',
    background: 'var(--input-bg)', color: 'var(--text-sub)',
  },
  checkboxLabelActive: { borderColor: '#06C755', background: '#dcfce7', color: '#166534', fontWeight: 700 },
  fieldGroup: { marginBottom: 18 },
  submitBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 4,
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
    letterSpacing: 0.3,
  },
  error: { color: '#ef4444', fontSize: 12, marginTop: 5, fontWeight: 500 },
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setCurrentUser } = useApp()
  const [formData, setFormData] = useState({ last_name: '', first_name: '', grade: '', gender: '', main_part: [], fav_bands: '', want_parts: [] })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  function toggleMainPart(part) {
    setFormData(prev => ({
      ...prev,
      main_part: prev.main_part.includes(part)
        ? prev.main_part.filter(p => p !== part)
        : [...prev.main_part, part],
    }))
  }

  function toggleWantPart(part) {
    setFormData(prev => ({
      ...prev,
      want_parts: prev.want_parts.includes(part)
        ? prev.want_parts.filter(p => p !== part)
        : [...prev.want_parts, part],
    }))
  }

  async function handleSubmit() {
    const newErrors = {}
    if (!formData.last_name.trim()) newErrors.last_name = '苗字を入力してください'
    if (!formData.first_name.trim()) newErrors.first_name = '名前を入力してください'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    const full_name = `${formData.last_name.trim()} ${formData.first_name.trim()}`
    setSubmitting(true)
    try {
      const member = await registerMember({
        ...formData,
        full_name,
        grade: formData.grade ? Number(formData.grade) : null,
      })
      setCurrentUser(member)
      navigate('/home')
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <div style={s.headerTop}>
          <div>
            <div style={s.headerTitle}>🎸 メンバー登録</div>
            <div style={s.headerSub}>SoundCity へようこそ！</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>ログアウト</button>
        </div>
      </div>
      <div style={s.form}>
        <div style={s.card}>
          <div style={s.fieldGroup}>
            <label style={s.label}>氏名<span style={s.required}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <input style={s.input} placeholder="山田（苗字）" value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} />
                {errors.last_name && <div style={s.error}>{errors.last_name}</div>}
              </div>
              <div>
                <input style={s.input} placeholder="太郎（名前）" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} />
                {errors.first_name && <div style={s.error}>{errors.first_name}</div>}
              </div>
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>学年</label>
            <select style={s.select} value={formData.grade} onChange={e => handleChange('grade', e.target.value)}>
              <option value="">選択してください</option>
              {GRADES.map(g => <option key={g} value={g}>{g}年生</option>)}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>性別</label>
            <select style={s.select} value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
              <option value="">選択してください</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>メインパート（複数選択可）</label>
            <div style={s.checkboxGroup}>
              {MAIN_PARTS.map(p => (
                <label key={p} style={{ ...s.checkboxLabel, ...(formData.main_part.includes(p) ? s.checkboxLabelActive : {}) }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.main_part.includes(p)} onChange={() => toggleMainPart(p)} />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>好きなバンド・アーティスト</label>
            <input style={s.input} placeholder="例：RADWIMPS, Mr.Children" value={formData.fav_bands} onChange={e => handleChange('fav_bands', e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>いつかやりたいパート</label>
            <div style={s.checkboxGroup}>
              {WANT_PARTS_OPTIONS.map(p => (
                <label key={p} style={{ ...s.checkboxLabel, ...(formData.want_parts.includes(p) ? s.checkboxLabelActive : {}) }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.want_parts.includes(p)} onChange={() => toggleWantPart(p)} />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button style={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? '送信中...' : '登録する'}
        </button>
      </div>
    </div>
  )
}
