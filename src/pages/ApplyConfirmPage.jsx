import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { createPlan, updatePlan, createTemplate } from '../api.js'

function parseSeNote(seNote) {
  if (!seNote) return []
  const lines = seNote.split('\n')
  const items = []
  if (lines[0]?.trim()) items.push({ label: 'SE', value: lines[0].trim() })
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim()) items.push({ label: `${i}曲目`, value: lines[i].trim() })
  }
  return items
}

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
    background: 'var(--card-bg)', borderRadius: 16, padding: '20px 16px',
    marginBottom: 12, boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--card-border)',
  },
  title: { fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 14, letterSpacing: 0.3 },
  row: {
    display: 'flex', alignItems: 'center',
    borderBottom: '1px solid #f8fafc', padding: '10px 0',
  },
  rowLabel: { minWidth: 80, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  rowValue: { fontSize: 14, color: 'var(--text)', flex: 1, fontWeight: 600 },
  partList: { paddingLeft: 0, listStyle: 'none', margin: 0 },
  partRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f8fafc' },
  partBadge: {
    fontSize: 11, fontWeight: 700, color: '#5b21b6',
    background: '#ede9fe', padding: '2px 8px', borderRadius: 6, minWidth: 40, textAlign: 'center',
  },
  memberName: { fontSize: 14, color: '#334155', fontWeight: 500 },
  memberEmpty: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  templateBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', background: '#dcfce7',
    borderRadius: 10, color: '#166534', fontSize: 13, fontWeight: 700, marginBottom: 14,
    border: '1px solid #86efac',
  },
  submitBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6,199,85,0.3)',
    letterSpacing: 0.3,
  },
  submittingBtn: { opacity: 0.6, cursor: 'not-allowed', boxShadow: 'none' },
  success: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #06C755 150%)',
    color: '#fff',
  },
}

export default function ApplyConfirmPage() {
  const navigate = useNavigate()
  const { formState, setFormState, currentUser } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const castData = formState.parts.map(p => ({
        part: p.part,
        member_id: p.member?.member_id || null,
      }))

      const planPayload = {
        live_id: formState.live_id,
        band_name: formState.band_name,
        song_count: Number(formState.song_count),
        leader_id: formState.editing_leader_id || currentUser.member_id,
        casts: castData,
        mic_note: formState.mic_note || null,
        sound_note: formState.sound_note || null,
        se_note: formState.se_note || null,
        light_note: formState.light_note || null,
      }

      if (formState.editing_plan_id) {
        await updatePlan({ ...planPayload, plan_id: formState.editing_plan_id })
      } else {
        await createPlan(planPayload)
        if (formState.save_as_template) {
          await createTemplate({
            band_name: formState.band_name,
            creator_id: currentUser.member_id,
            casts: castData,
          }).catch(e => {
            console.error('template save error:', e)
            alert('テンプレート保存エラー: ' + (e.message || JSON.stringify(e)))
          })
        }
      }

      setDone(true)
      setTimeout(() => navigate(formState.return_path || '/applications'), 2000)
    } catch (e) {
      alert('エラーが発生しました。もう一度お試しください')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={s.success}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>応募完了！</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 14 }}>応募一覧に移動します...</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>応募確認</span>
        <div style={s.stepIndicator}>
          <div style={s.step} />
          <div style={s.step} />
          <div style={{ ...s.step, ...s.stepActive }} />
        </div>
      </div>
      <div style={s.content}>
        <div style={s.card}>
          <div style={s.title}>📋 入力内容の確認</div>
          {formState.live_name && (
            <div style={s.row}>
              <span style={s.rowLabel}>ライブ</span>
              <span style={s.rowValue}>{formState.live_name}</span>
            </div>
          )}
          <div style={s.row}>
            <span style={s.rowLabel}>バンド名</span>
            <span style={s.rowValue}>{formState.band_name}</span>
          </div>
          <div style={s.row}>
            <span style={s.rowLabel}>曲数</span>
            <span style={s.rowValue}>{formState.song_count}曲</span>
          </div>
          <div style={{ paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>パート一覧</div>
            <ul style={s.partList}>
              {formState.parts.map((p, i) => (
                <li key={i} style={s.partRow}>
                  <span style={s.partBadge}>{p.part}</span>
                  <span style={p.member?.full_name ? s.memberName : s.memberEmpty}>
                    {p.member?.full_name || '未定'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {formState.mic_note && (
            <div style={{ ...s.row, flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ ...s.rowLabel, marginBottom: 4 }}>マイク</span>
              <span style={{ ...s.rowValue, fontSize: 13, whiteSpace: 'pre-wrap' }}>{formState.mic_note}</span>
            </div>
          )}
          {formState.sound_note && (
            <div style={{ ...s.row, flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ ...s.rowLabel, marginBottom: 4 }}>音響要望</span>
              <span style={{ ...s.rowValue, fontSize: 13, whiteSpace: 'pre-wrap' }}>{formState.sound_note}</span>
            </div>
          )}
          {parseSeNote(formState.se_note).length > 0 && (
            <div style={{ ...s.row, flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ ...s.rowLabel, marginBottom: 6 }}>SE・曲目</span>
              <div>
                {parseSeNote(formState.se_note).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', minWidth: 40 }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formState.light_note && (
            <div style={{ ...s.row, flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none' }}>
              <span style={{ ...s.rowLabel, marginBottom: 4 }}>照明</span>
              <span style={{ ...s.rowValue, fontSize: 13, whiteSpace: 'pre-wrap' }}>{formState.light_note}</span>
            </div>
          )}
        </div>

        {formState.save_as_template && (
          <div style={s.templateBadge}>📂 テンプレートとして保存</div>
        )}

        <button
          style={{ ...s.submitBtn, ...(submitting ? s.submittingBtn : {}) }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '送信中...' : formState.editing_plan_id ? '変更を保存' : '応募する 🎸'}
        </button>
      </div>
    </div>
  )
}
