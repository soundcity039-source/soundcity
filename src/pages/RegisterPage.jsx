import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerMember } from '../api.js'
import { useApp } from '../context/AppContext.jsx'
import PhotoUpload from '../components/PhotoUpload.jsx'

const MAIN_PARTS = ['Vo', 'ギタボ', 'Gt', 'Ba', 'Dr', 'Key', 'DJ', 'Sax', 'その他']
const WANT_PARTS_OPTIONS = ['Vo', 'ギタボ', 'Gt', 'Gt2', 'Ba', 'Dr', 'Key', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#06C755', color: '#fff', padding: '20px 20px 16px',
    fontSize: 20, fontWeight: 700,
  },
  form: { padding: '20px 16px', maxWidth: 480, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 12, padding: '20px 16px', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  required: { color: '#e53e3e', marginLeft: 4 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, background: '#fff', boxSizing: 'border-box',
  },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', border: '1px solid #ddd', borderRadius: 20,
    fontSize: 13, cursor: 'pointer', userSelect: 'none',
  },
  checkboxLabelActive: { borderColor: '#06C755', background: '#e6f9ed', color: '#06C755' },
  fieldGroup: { marginBottom: 16 },
  submitBtn: {
    width: '100%', padding: '14px', background: '#06C755',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    marginTop: 8,
  },
  error: { color: '#e53e3e', fontSize: 13, marginTop: 4 },
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setCurrentUser, liff } = useApp()
  const [formData, setFormData] = useState({
    full_name: '',
    photo_url: '',
    grade: '',
    gender: '',
    main_part: '',
    fav_bands: '',
    want_parts: [],
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
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
    if (!formData.full_name.trim()) newErrors.full_name = '名前を入力してください'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSubmitting(true)
    try {
      let lineUid = 'dev-uid'
      if (liff) {
        const profile = await liff.getProfile()
        lineUid = profile.userId
      }
      const payload = {
        ...formData,
        line_uid: lineUid,
        want_parts: formData.want_parts.join(','),
        grade: formData.grade ? Number(formData.grade) : null,
      }
      const result = await registerMember(payload)
      setCurrentUser(result.member || result)
      navigate('/home')
    } catch (e) {
      alert('エラーが発生しました。もう一度お試しください')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>メンバー登録</div>
      <div style={s.form}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <PhotoUpload currentUrl={formData.photo_url} onUpload={url => handleChange('photo_url', url)} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>フルネーム<span style={s.required}>*</span></label>
            <input
              style={s.input}
              placeholder="山田 太郎"
              value={formData.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
            />
            {errors.full_name && <div style={s.error}>{errors.full_name}</div>}
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
            <label style={s.label}>メインパート</label>
            <select style={s.select} value={formData.main_part} onChange={e => handleChange('main_part', e.target.value)}>
              <option value="">選択してください</option>
              {MAIN_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>好きなバンド・アーティスト</label>
            <input
              style={s.input}
              placeholder="例：RADWIMPS, Mr.Children"
              value={formData.fav_bands}
              onChange={e => handleChange('fav_bands', e.target.value)}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>いつかやりたいパート</label>
            <div style={s.checkboxGroup}>
              {WANT_PARTS_OPTIONS.map(p => (
                <label
                  key={p}
                  style={{
                    ...s.checkboxLabel,
                    ...(formData.want_parts.includes(p) ? s.checkboxLabelActive : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ display: 'none' }}
                    checked={formData.want_parts.includes(p)}
                    onChange={() => toggleWantPart(p)}
                  />
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
