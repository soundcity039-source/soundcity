import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PartSelector from '../components/PartSelector.jsx'

const PRESET_PARTS = ['Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#06C755', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 12 },
  addPartArea: { marginTop: 12 },
  addPartRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  addSelect: {
    flex: 1, padding: '8px 10px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, background: '#fff',
  },
  addCustomInput: {
    flex: 1, padding: '8px 10px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14,
  },
  addBtn: {
    padding: '8px 14px', background: '#06C755', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
  templateCheck: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 0', fontSize: 14, cursor: 'pointer',
  },
  checkbox: { width: 18, height: 18, cursor: 'pointer' },
  error: { color: '#e53e3e', fontSize: 13, padding: '8px 0' },
  nextBtn: {
    width: '100%', padding: '14px', background: '#06C755',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
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
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        企画応募（2/3）
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
