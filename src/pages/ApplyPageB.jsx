import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PartSelector from '../components/PartSelector.jsx'

const PRESET_PARTS = ['Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', paddingBottom: 40 },
  header: {
    background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
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
  card: {
    background: '#fff', borderRadius: 16, padding: '16px',
    marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  sectionTitle: { fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 12, letterSpacing: 0.3 },
  addPartArea: { marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' },
  addPartRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  addSelect: {
    flex: 1, padding: '9px 10px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, background: '#f8fafc', outline: 'none',
  },
  addCustomInput: {
    flex: 1, padding: '9px 10px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, background: '#f8fafc', outline: 'none',
  },
  addBtn: {
    padding: '9px 16px', background: '#06C755', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 700,
  },
  templateCheck: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 0', fontSize: 14, cursor: 'pointer',
    color: '#334155', fontWeight: 500,
  },
  checkbox: { width: 18, height: 18, cursor: 'pointer', accentColor: '#06C755' },
  error: { color: '#ef4444', fontSize: 12, padding: '6px 0', fontWeight: 500 },
  nextBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #06C755 0%, #00a846 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
  },
}

export default function ApplyPageB() {
  const navigate = useNavigate()
  const { formState, setFormState } = useApp()
  const [addPartMode, setAddPartMode] = useState('preset')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [customPart, setCustomPart] = useState('')
  const [error, setError] = useState('')

  const disabledMemberIds = formState.parts
    .filter(p => p.member)
    .map(p => p.member.member_id)

  function handleMemberChange(index, member) {
    setFormState(prev => {
      const parts = [...prev.parts]
      parts[index] = { ...parts[index], member }
      return { ...prev, parts }
    })
  }

  function handleRemovePart(index) {
    setFormState(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }))
  }

  function handleAddPart() {
    const partName = addPartMode === 'preset' ? selectedPreset : customPart.trim()
    if (!partName) return
    setFormState(prev => ({
      ...prev,
      parts: [...prev.parts, { part: partName, member: null }],
    }))
    setSelectedPreset('')
    setCustomPart('')
  }

  function handleNext() {
    if (formState.parts.length === 0) {
      setError('最低1つのパートが必要です')
      return
    }
    setError('')
    navigate('/apply/confirm')
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>企画応募</span>
        <div style={s.stepIndicator}>
          <div style={s.step} />
          <div style={{ ...s.step, ...s.stepActive }} />
          <div style={s.step} />
        </div>
      </div>
      <div style={s.content}>
        <div style={s.card}>
          <div style={s.sectionTitle}>パート・メンバー</div>
          {formState.parts.map((p, i) => (
            <PartSelector
              key={i}
              part={p.part}
              member={p.member}
              onMemberChange={m => handleMemberChange(i, m)}
              onRemove={() => handleRemovePart(i)}
              disabledMemberIds={disabledMemberIds.filter(id => p.member?.member_id !== id)}
            />
          ))}
          {error && <div style={s.error}>{error}</div>}

          <div style={s.addPartArea}>
            <div style={s.sectionTitle}>パートを追加</div>
            <div style={s.addPartRow}>
              <select
                style={s.addSelect}
                value={addPartMode === 'preset' ? selectedPreset : '__custom__'}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setAddPartMode('custom')
                    setSelectedPreset('')
                  } else {
                    setAddPartMode('preset')
                    setSelectedPreset(e.target.value)
                  }
                }}
              >
                <option value="">パートを選択</option>
                {PRESET_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="__custom__">自由入力...</option>
              </select>
              {addPartMode === 'custom' && (
                <input
                  style={s.addCustomInput}
                  placeholder="パート名を入力"
                  value={customPart}
                  onChange={e => setCustomPart(e.target.value)}
                />
              )}
              <button style={s.addBtn} onClick={handleAddPart}>追加</button>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <label style={s.templateCheck}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={formState.save_as_template}
              onChange={e => setFormState(prev => ({ ...prev, save_as_template: e.target.checked }))}
            />
            <span>テンプレートとして保存する</span>
          </label>
        </div>

        <button style={s.nextBtn} onClick={handleNext}>
          確認へ →
        </button>
      </div>
    </div>
  )
}
