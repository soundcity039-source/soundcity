import { useState, useEffect } from 'react'
import { getMembers } from '../api.js'

const PARTS = ['Vo', 'ギタボ', 'Gt', 'Ba', 'Dr', 'Key', 'Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '16px 16px 0 0',
    width: '100%', maxWidth: 480, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #eee',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontWeight: 700, fontSize: 18,
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666',
  },
  filterArea: { padding: '12px 16px', borderBottom: '1px solid #eee' },
  searchInput: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', marginBottom: 8,
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterSelect: {
    padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6,
    fontSize: 13, background: '#fff',
  },
  list: { overflowY: 'auto', flex: 1 },
  memberItem: {
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%', background: '#ddd',
    marginRight: 12, objectFit: 'cover', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#888',
  },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15 },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  disabled: { opacity: 0.4, cursor: 'not-allowed' },
  empty: { padding: 32, textAlign: 'center', color: '#aaa' },
  clearRow: {
    padding: '12px 16px', borderTop: '1px solid #eee',
  },
  clearBtn: {
    width: '100%', padding: '10px', background: '#f5f5f5',
    border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
    color: '#555',
  },
}

function filterByPart(members, selectedPart) {
  if (!selectedPart) return members
  if (selectedPart === 'Vo') {
    return members.filter(m => m.main_part === 'Vo' || m.main_part === 'ギタボ')
  }
  if (selectedPart === 'Gt') {
    return members.filter(m => m.main_part === 'Gt' || m.main_part === 'ギタボ')
  }
  return members.filter(m => m.main_part === selectedPart)
}

export default function MemberSearchModal({ onSelect, onClose, disabledMemberIds = [], defaultPart = '' }) {
  const [search, setSearch] = useState('')
  const [partFilter, setPartFilter] = useState(defaultPart || '')
  const [gradeFilter, setGradeFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMembers({ is_active: true })
      .then(res => setMembers(res.members || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  let filtered = members.filter(m => m.is_active !== false)
  if (search) {
    filtered = filtered.filter(m =>
      m.full_name && m.full_name.includes(search)
    )
  }
  filtered = filterByPart(filtered, partFilter)
  if (gradeFilter) filtered = filtered.filter(m => String(m.grade) === gradeFilter)
  if (genderFilter) filtered = filtered.filter(m => m.gender === genderFilter)

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.header}>
          <span>メンバー選択</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={s.filterArea}>
          <input
            style={s.searchInput}
            placeholder="名前で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div style={s.filterRow}>
            <select style={s.filterSelect} value={partFilter} onChange={e => setPartFilter(e.target.value)}>
              <option value="">パート(全て)</option>
              {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select style={s.filterSelect} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="">学年(全て)</option>
              {GRADES.map(g => <option key={g} value={g}>{g}年</option>)}
            </select>
            <select style={s.filterSelect} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option value="">性別(全て)</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div style={s.list}>
          {loading && <div style={s.empty}>読み込み中...</div>}
          {!loading && filtered.length === 0 && <div style={s.empty}>該当するメンバーがいません</div>}
          {!loading && filtered.map(m => {
            const isDisabled = disabledMemberIds.includes(m.member_id)
            return (
              <div
                key={m.member_id}
                style={{ ...s.memberItem, ...(isDisabled ? s.disabled : {}) }}
                onClick={() => !isDisabled && onSelect(m)}
              >
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.full_name} style={s.avatar} />
                  : <div style={s.avatar}>👤</div>
                }
                <div style={s.info}>
                  <div style={s.name}>{m.full_name}</div>
                  <div style={s.sub}>
                    {[m.main_part, m.grade ? `${m.grade}年` : null, m.gender].filter(Boolean).join(' / ')}
                  </div>
                </div>
                {isDisabled && <span style={{ fontSize: 12, color: '#999' }}>選択済</span>}
              </div>
            )
          })}
        </div>
        <div style={s.clearRow}>
          <button style={s.clearBtn} onClick={() => onSelect(null)}>空欄にする</button>
        </div>
      </div>
    </div>
  )
}
