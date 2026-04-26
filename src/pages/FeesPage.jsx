import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getFees, getFeeCollections, setFeeCollection } from '../api.js'

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
    background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, position: 'relative' },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, background: 'var(--input-bg)', color: 'var(--text)', boxSizing: 'border-box', marginBottom: 16,
  },
  totalCard: {
    background: '#2d3748', borderRadius: 12, padding: '16px 20px',
    marginBottom: 8, color: '#fff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  totalLabel: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: 700 },
  collectedBadge: {
    fontSize: 12, color: '#86efac', fontWeight: 700,
    textAlign: 'right',
  },
  table: { background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--card-shadow)' },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '1fr 60px 80px 56px',
    padding: '10px 16px', background: '#f7f7f7',
    fontSize: 12, fontWeight: 700, color: '#888', borderBottom: '1px solid #eee',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1fr 60px 80px 56px',
    padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  tableRowPaid: { background: '#f0fff4' },
  memberName: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cell: { fontSize: 13, color: '#555', textAlign: 'center' },
  amount: { fontSize: 14, fontWeight: 600, textAlign: 'right' },
  checkBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '50%', border: 'none',
    cursor: 'pointer', fontSize: 16, margin: '0 auto', transition: 'all 0.15s',
  },
  checkBtnOn:  { background: '#16a34a', color: '#fff' },
  checkBtnOff: { background: '#e2e8f0', color: '#94a3b8' },
  savingDot: { width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', margin: '0 auto' },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function FeesPage() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])
  const [selectedLiveId, setSelectedLiveId] = useState('')
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState({})       // member_id → true/false
  const [saving, setSaving] = useState({})   // member_id → true/false

  useEffect(() => {
    getLives({})
      .then(res => {
        const list = res.lives || res || []
        setLives(list)
        if (list.length > 0) setSelectedLiveId(list[0].live_id)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedLiveId) return
    setLoading(true)
    setPaid({})
    // 独立して取得 — 片方が失敗しても影響しない
    getFees(selectedLiveId)
      .then(res => setFees(res.fees || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
    getFeeCollections(selectedLiveId)
      .then(rows => {
        const paidMap = {}
        rows.forEach(c => { paidMap[c.member_id] = true })
        setPaid(paidMap)
      })
      .catch(console.error)
  }, [selectedLiveId])

  async function togglePaid(memberId) {
    const isCurrentlyPaid = !!paid[memberId]

    // 取り消し時は確認
    if (isCurrentlyPaid) {
      if (!window.confirm('徴収済みを取り消しますか？')) return
    }

    const newValue = !isCurrentlyPaid
    setSaving(prev => ({ ...prev, [memberId]: true }))
    try {
      await setFeeCollection(selectedLiveId, memberId, newValue)
      setPaid(prev => ({ ...prev, [memberId]: newValue }))
    } catch (e) {
      alert('保存エラー: ' + (e.message || JSON.stringify(e)))
    } finally {
      setSaving(prev => ({ ...prev, [memberId]: false }))
    }
  }

  const total = fees.reduce((sum, f) => sum + (f.fee || 0), 0)
  const collectedCount = fees.filter(f => paid[f.member_id]).length

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerCircle} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <span style={s.headerTitle}>出演費管理</span>
      </div>
      <div style={s.content}>
        <select style={s.select} value={selectedLiveId} onChange={e => setSelectedLiveId(e.target.value)}>
          <option value="">ライブを選択</option>
          {lives.map(l => <option key={l.live_id} value={l.live_id}>{l.live_name}</option>)}
        </select>

        {selectedLiveId && (
          <>
            <div style={s.totalCard}>
              <div>
                <div style={s.totalLabel}>合計出演費</div>
                <div style={s.totalAmount}>¥{total.toLocaleString()}</div>
              </div>
              {fees.length > 0 && (
                <div style={s.collectedBadge}>
                  徴収済 {collectedCount} / {fees.length} 人
                </div>
              )}
            </div>

            {loading
              ? <div style={s.loading}>読み込み中...</div>
              : fees.length === 0
                ? <div style={s.empty}>出演費データがありません</div>
                : (
                  <div style={s.table}>
                    <div style={s.tableHeader}>
                      <span>メンバー</span>
                      <span style={{ textAlign: 'center' }}>企画数</span>
                      <span style={{ textAlign: 'right' }}>金額</span>
                      <span style={{ textAlign: 'center' }}>徴収</span>
                    </div>
                    {fees.map(f => (
                      <div
                        key={f.member_id}
                        style={{ ...s.tableRow, ...(paid[f.member_id] ? s.tableRowPaid : {}) }}
                      >
                        <span style={s.memberName}>{f.member?.full_name}</span>
                        <span style={s.cell}>{f.count}企画</span>
                        <span style={s.amount}>¥{(f.fee || 0).toLocaleString()}</span>
                        <div style={{ textAlign: 'center' }}>
                          {saving[f.member_id]
                            ? <div style={s.savingDot} />
                            : (
                              <button
                                style={{ ...s.checkBtn, ...(paid[f.member_id] ? s.checkBtnOn : s.checkBtnOff) }}
                                onClick={() => togglePaid(f.member_id)}
                                title={paid[f.member_id] ? '徴収済（クリックで取り消し）' : '未徴収'}
                              >
                                {paid[f.member_id] ? '✓' : '○'}
                              </button>
                            )
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </>
        )}
      </div>
    </div>
  )
}
