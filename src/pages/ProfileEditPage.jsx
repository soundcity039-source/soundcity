import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../api.js'
import { useApp } from '../context/AppContext.jsx'
import PhotoUpload from '../components/PhotoUpload.jsx'
const MAIN_PARTS = ['Vo', 'ギタボ', 'Gt', 'Ba', 'Dr', 'Key', 'DJ', 'Sax', 'その他']
const WANT_PARTS_OPTIONS = ['Vo', 'ギタボ', 'Gt', 'Gt2', 'Ba', 'Dr', 'Key', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
  form: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 16, padding: '20px 16px',
    marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: 13, fontWeight: 800, color: '#475569',
    marginBottom: 16, letterSpacing: 0.3,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.3 },
  required: { color: '#ef4444', marginLeft: 4 },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, boxSizing: 'border-box',
    background: '#f8fafc', outline: 'none',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, background: '#f8fafc', boxSizing: 'border-box',
    outline: 'none', appearance: 'none',
  },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center',
    padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: 20,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', userSelect: 'none',
    background: '#f8fafc', color: '#64748b',
    transition: 'all 0.12s',
  },
  checkboxLabelActive: { borderColor: '#06C755', background: '#dcfce7', color: '#166534', fontWeight: 700 },
  fieldGroup: { marginBottom: 18 },
  submitBtn: {
    width: '100%', padding: '15px', background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
    letterSpacing: 0.3,
  },
  error: { color: '#ef4444', fontSize: 12, marginTop: 5, fontWeight: 500 },
}

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { currentUser, setCurrentUser } = useApp()

  const initialMainParts = currentUser?.main_part
    ? (typeof currentUser.main_part === 'string' ? currentUser.main_part.split(',').filter(Boolean) : currentUser.main_part)
    : []
  const initialWantParts = currentUser?.want_parts
    ? (typeof currentUser.want_parts === 'string' ? currentUser.want_parts.split(',').filter(Boolean) : currentUser.want_parts)
    : []

  function splitFullName(fullName) {
    if (!fullName) return { last: '', first: '' }
    const i = fullName.search(/[\s　]/)
    if (i === -1) return { last: fullName, first: '' }
    return { last: fullName.slice(0, i), first: fullName.slice(i + 1).trim() }
  }
  const { last: initLast, first: initFirst } = splitFullName(currentUser?.full_name)

  const [formData, setFormData] = useState({
    last_name: initLast,
    first_name: initFirst,
    photo_url: currentUser?.photo_url || '',
    grade: currentUser?.grade ? String(currentUser.grade) : '',
    gender: currentUser?.gender || '',
    main_part: initialMainParts,
    fav_bands: currentUser?.fav_bands || '',
    want_parts: initialWantParts,
  })
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
      const payload = {
        member_id: currentUser.member_id,
        ...formData,
        full_name,
        main_part: formData.main_part.join(','),
        want_parts: formData.want_parts.join(','),
        grade: formData.grade ? Number(formData.grade) : null,
      }
      const result = await updateProfile(payload)
      setCurrentUser({ ...currentUser, ...result })
      navigate(-1)
    } catch (e) {
      alert('エラー: ' + e.message)
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>プロフィール編集</span>
      </div>
      <div style={s.form}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <PhotoUpload currentUrl={formData.photo_url} onUpload={url => handleChange('photo_url', url)} />
          </div>

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
                <label
                  key={p}
                  style={{ ...s.checkboxLabel, ...(formData.main_part.includes(p) ? s.checkboxLabelActive : {}) }}
                >
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.main_part.includes(p)} onChange={() => toggleMainPart(p)} />
                  {p}
                </label>
              ))}
            </div>
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
          {submitting ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
