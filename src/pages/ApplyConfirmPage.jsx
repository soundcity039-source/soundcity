import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { createPlan, updatePlan, createTemplate } from '../api.js'

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
  card: { background: '#fff', borderRadius: 12, padding: '20px 16px', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: 700, color: '#555', marginBottom: 16 },
  row: { display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '10px 0' },
  rowLabel: { minWidth: 80, fontSize: 13, color: '#888' },
  rowValue: { fontSize: 14, color: '#333', flex: 1 },
  partList: { paddingLeft: 0, listStyle: 'none', margin: 0 },
  partRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8f8f8' },
  partName: { fontSize: 13, color: '#555', minWidth: 64 },
  memberName: { fontSize: 14, color: '#333' },
  templateBadge: {
    display: 'inline-block', padding: '4px 12px', background: '#e6f9ed',
    borderRadius: 12, color: '#06C755', fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  submitBtn: {
    width: '100%', padding: '14px', background: '#06C755',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
  },
  submittingBtn: { opacity: 0.6, cursor: 'not-allowed' },
  success: {
    textAlign: 'center', padding: 40, color: '#06C755', fontFamily: 'sans-serif',
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
        leader_uid: currentUser.line_uid,
        casts: castData,
      }

      if (formState.editing_plan_id) {
        await updatePlan({ ...planPayload, plan_id: formState.editing_plan_id })
      } else {
        const result = await createPlan(planPayload)
        if (formState.save_as_template) {
          await createTemplate({
            band_name: formState.band_name,
            creator_uid: currentUser.line_uid,
            casts: castData,
          }).catch(console.warn)
        }
      }

      setDone(true)
      setTimeout(() => navigate('/applications'), 2000)
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
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>応募完了！</div>
        <div style={{ color: '#888', marginTop: 8 }}>応募一覧に移動します...</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        応募確認（3/3）
      </div>
      <div style={s.content}>
        <div style={s.card}>
          <div style={s.title}>入力内容の確認</div>
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
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>パート一覧</div>
            <ul style={s.partList}>
              {formState.parts.map((p, i) => (
                <li key={i} style={s.partRow}>
                  <span style={s.partName}>{p.part}</span>
                  <span style={s.memberName}>{p.member?.full_name || '（未定）'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {formState.save_as_template && (
          <div style={s.templateBadge}>📂 テンプレートとして保存</div>
        )}

        <button
          style={{ ...s.submitBtn, ...(submitting ? s.submittingBtn : {}) }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '送信中...' : formState.editing_plan_id ? '変更を保存' : '応募する'}
        </button>
      </div>
    </div>
  )
}
