import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { getCastCountsByMember } from '../api.js'
import PartSelector from '../components/PartSelector.jsx'

const ALL_PARTS = ['Vo', 'Gt', 'Ba', 'Dr', 'Key', 'Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']

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
  card: {
    background: 'var(--card-bg)', borderRadius: 16, padding: '16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)',
  },
  sectionTitle: { fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 12, letterSpacing: 0.3 },
  addPartArea: { marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' },
  addPartRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  addCustomInput: {
    flex: 1, padding: '9px 10px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 14, background: 'var(--input-bg)', outline: 'none',
  },
  addBtn: {
    padding: '9px 16px', background: '#06C755', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 700,
  },
  inactivePartsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  inactiveChip: {
    padding: '6px 12px', border: '1.5px dashed #cbd5e1', borderRadius: 20,
    fontSize: 13, color: '#94a3b8', background: '#f8fafc', cursor: 'pointer',
    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
  },
  templateCheck: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 0', fontSize: 14, cursor: 'pointer',
    color: '#334155', fontWeight: 500,
  },
  checkbox: { width: 18, height: 18, cursor: 'pointer', accentColor: '#06C755' },
  error: { color: '#ef4444', fontSize: 12, padding: '6px 0', fontWeight: 500 },
  noteLabel: { fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, marginTop: 14 },
  noteTextarea: {
    width: '100%', padding: '9px 10px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  seRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  seLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, minWidth: 50 },
  seInput: {
    flex: 1, padding: '7px 10px', border: '1.5px solid var(--border)',
    borderRadius: 8, fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  },
  nextBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
  },
}

// Parse se_note as per-song lines: "SE\n1曲目\n2曲目..."
function parseSelines(seNote, songCount) {
  const lines = (seNote || '').split('\n')
  // lines[0] = SE line, lines[1..n] = songs
  const se = lines[0] || ''
  const songs = []
  for (let i = 1; i <= songCount; i++) {
    songs.push(lines[i] || '')
  }
  return { se, songs }
}
function buildSeNote(se, songs) {
  return [se, ...songs].join('\n').trimEnd()
}

export default function ApplyPageB() {
  const navigate = useNavigate()
  const { formState, setFormState, currentUser } = useApp()
  const [customPart, setCustomPart] = useState('')
  const [error, setError] = useState('')
  const [castCounts, setCastCounts] = useState({})

  const maxCastPlans = formState.max_cast_plans
  const editingPlanId = formState.editing_plan_id

  useEffect(() => {
    if (formState.live_id && maxCastPlans != null) {
      getCastCountsByMember(formState.live_id).then(setCastCounts).catch(console.error)
    }
  }, [formState.live_id, maxCastPlans])

  // 編集中の企画に既に入っているメンバーは上限チェック対象外（当企画での出演は除外）
  const editingMemberIds = new Set(
    (formState.parts || []).map(p => p.member?.member_id).filter(Boolean)
  )
  const castFullMemberIds = maxCastPlans != null
    ? new Set(
        Object.entries(castCounts)
          .filter(([id, count]) => count >= maxCastPlans && !editingMemberIds.has(id))
          .map(([id]) => id)
      )
    : null

  const songCount = Number(formState.song_count) || 0
  const { se: seLine, songs: songLines } = parseSelines(formState.se_note, songCount)

  function updateSeLine(val) {
    const { songs } = parseSelines(formState.se_note, songCount)
    setFormState(prev => ({ ...prev, se_note: buildSeNote(val, songs) }))
  }
  function updateSongLine(idx, val) {
    const { se, songs } = parseSelines(formState.se_note, songCount)
    const next = [...songs]
    next[idx] = val
    setFormState(prev => ({ ...prev, se_note: buildSeNote(se, next) }))
  }

  function handleMemberChange(index, member) {
    setFormState(prev => {
      const parts = [...prev.parts]
      parts[index] = { ...parts[index], member }
      return { ...prev, parts }
    })
  }

  function handlePartChange(index, newPart) {
    setFormState(prev => {
      const parts = [...prev.parts]
      parts[index] = { ...parts[index], part: newPart }
      return { ...prev, parts }
    })
  }

  function handleRemovePart(index) {
    setFormState(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }))
  }

  function handleAddPart(partName) {
    const name = partName || customPart.trim()
    if (!name) return
    setFormState(prev => ({
      ...prev,
      parts: [...prev.parts, { part: name, member: null }],
    }))
    setCustomPart('')
  }

  function handleNext() {
    if (formState.parts.length === 0) {
      setError('最低1つのパートが必要です')
      return
    }
    if (!formState.editing_plan_id) {
      const isSelf = formState.parts.some(p => p.member?.member_id === currentUser.member_id)
      if (!isSelf) {
        setError('自分自身をいずれかのパートに入れてください')
        return
      }
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
              onPartChange={newPart => handlePartChange(i, newPart)}
              disabledMemberIds={[]}
              castFullMemberIds={castFullMemberIds}
            />
          ))}
          {error && <div style={s.error}>{error}</div>}

          <div style={s.addPartArea}>
            <div style={s.sectionTitle}>追加できるパート</div>
            <div style={s.inactivePartsWrap}>
              {ALL_PARTS
                .filter(p => p !== 'Vo' || !formState.parts.some(fp => fp.part === 'Vo' || fp.part.startsWith('Vo/')))
                .filter(p => p === 'Vo' || !formState.parts.some(fp => fp.part === p))
                .map(p => (
                  <button key={p} style={s.inactiveChip} onClick={() => handleAddPart(p)}>
                    <span>＋</span>{p}
                  </button>
                ))
              }
            </div>
            <div style={s.addPartRow}>
              <input
                style={s.addCustomInput}
                placeholder="その他（自由入力）"
                value={customPart}
                onChange={e => setCustomPart(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPart()}
              />
              <button style={s.addBtn} onClick={() => handleAddPart()}>追加</button>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>音響・機材メモ</div>

          <div style={s.noteLabel}>マイクの位置・本数（任意）</div>
          <textarea
            style={s.noteTextarea}
            placeholder="例：Vo×1（センター）、コーラス×2（左右）"
            value={formState.mic_note}
            onChange={e => setFormState(prev => ({ ...prev, mic_note: e.target.value }))}
          />

          <div style={s.noteLabel}>音響要望（任意）</div>
          <textarea
            style={s.noteTextarea}
            placeholder="例：アンプはステージ右側、ドラムは同期あり"
            value={formState.sound_note}
            onChange={e => setFormState(prev => ({ ...prev, sound_note: e.target.value }))}
          />

          <div style={s.noteLabel}>照明メモ（任意）</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
            ※ 下高井戸GROCKSまたは合宿スタジオでのみ指定可能
          </div>
          <textarea
            style={s.noteTextarea}
            placeholder="例：全体的に赤で、サビは白で"
            value={formState.light_note}
            onChange={e => setFormState(prev => ({ ...prev, light_note: e.target.value }))}
          />
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>SE・曲目メモ</div>
          <div style={s.seRow}>
            <span style={s.seLabel}>SE</span>
            <input
              style={s.seInput}
              placeholder="（任意）"
              value={seLine}
              onChange={e => updateSeLine(e.target.value)}
            />
          </div>
          {Array.from({ length: songCount }, (_, i) => (
            <div key={i} style={s.seRow}>
              <span style={s.seLabel}>{i + 1}曲目</span>
              <input
                style={s.seInput}
                placeholder="（任意）"
                value={songLines[i] || ''}
                onChange={e => updateSongLine(i, e.target.value)}
              />
            </div>
          ))}
          {songCount === 0 && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>ステップ1で曲数を入力すると欄が表示されます</div>
          )}
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
