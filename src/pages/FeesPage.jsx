import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLives, getFees } from '../api.js'

const s = {
  page: { minHeight: '100vh', background: '#f7f7f7', paddingBottom: 40 },
  header: {
    background: '#2d3748', color: '#fff', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 700,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0,
  },
  content: { padding: '16px', maxWidth: 480, margin: '0 auto' },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, background: '#fff', boxSizing: 'border-box', marginBottom: 16,
  },
  totalCard: {
    background: '#2d3748', borderRadius: 12, padding: '16px 20px',
    marginBottom: 16, color: '#fff',
  },
  totalLabel: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: 700 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '1fr 60px 80px 48px',
    padding: '10px 16px', background: '#f7f7f7',
    fontSize: 12, fontWeight: 700, color: '#888', borderBottom: '1px solid #eee',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1fr 60px 80px 48px',
    padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  tableRowPaid: { background: '#f0fff4' },
  memberName: { fontSize: 14, fontWeight: 600 },
  cell: { fontSize: 13, color: '#555', textAlign: 'center' },
  amount: { fontSize: 14, fontWeight: 600, textAlign: 'right' },
  checkbox: { width: 20, height: 20, cursor: 'pointer' },
  loading: { textAlign: 'center', color: '#aaa', padding: 40 },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
}

export default function FeesPage() {
  const navigate = useNavigate()
  const [lives, setLives] = useState([])
  const [selectedLiveId, setSelectedLiveId] = useState('')
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState({})

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
    getFees(selectedLiveId)
      .then(res => setFees(res.fees || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedLiveId])

  const total = fees.reduce((sum, f) => sum + (f.fee || 0), 0)

  function togglePaid(memberId) {
    setPaid(prev => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        出演費管理
      </div>
      <div style={s.content}>
        <select style={s.select} value={selectedLiveId} onChange={e => setSelectedLiveId(e.target.value)}>
          <option value="">ライブを選択</option>
          {lives.map(l => <option key={l.live_id} value={l.live_id}>{l.live_name}</option>)}
        </select>

        {selectedLiveId && (
          <>
            <div style={s.totalCard}>
              <div style={s.totalLabel}>合計出演費</div>
              <div style={s.totalAmount}>¥{total.toLocaleString()}</div>
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
                        <span style={s.memberName}>{f.full_name}</span>
                        <span style={s.cell}>{f.plan_count}企画</span>
                        <span style={s.amount}>¥{(f.fee || 0).toLocaleString()}</span>
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={s.checkbox}
                            checked={!!paid[f.member_id]}
                            onChange={() => togglePaid(f.member_id)}
                          />
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
