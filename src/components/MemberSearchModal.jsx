import { useState, useEffect } from 'react'
import { getMembers } from '../api.js'

const PARTS = ['Vo', 'Gt', 'Ba', 'Dr', 'Key', 'Gt2', 'Key2', 'DJ', 'コーラス', 'Sax', 'その他']
const GRADES = [1, 2, 3, 4]
const GENDERS = ['男', '女', 'その他']

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--card-bg)', borderRadius: '16px 16px 0 0',
    width: '100%', maxWidth: 480, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    color: 'var(--text)',
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontWeight: 700, fontSize: 18,
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)',
  },
  filterArea: { padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  searchInput: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', marginBottom: 8,
    background: 'var(--input-bg)', color: 'var(--text)',
  },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterSelect: {
    padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6,
    fontSize: 13, background: 'var(--input-bg)', color: 'var(--text)',
  },
  list: { overflowY: 'auto', flex: 1 },
  memberItem: {
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    borderBottom: '1px solid var(--border)', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%', background: 'var(--border)',
    marginRight: 12, objectFit: 'cover', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: 'var(--text-muted)',
  },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15 },
  sub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  disabled: { opacity: 0.4, cursor: 'not-allowed' },
  empty: { padding: 32, textAlign: 'center', color: 'var(--text-muted)' },
  clearRow: {
    padding: '12px 16px', borderTop: '1px solid var(--border)',
  },
  clearBtn: {
    width: '100%', padding: '10px', background: 'var(--page-bg)',
    border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
    color: 'var(--text-sub)',
  },
}

function getParts(member) {
  if (!member.main_part) return []
  return member.main_part.split(',').filter(Boolean)
}

function filterByPart(members, selectedPart) {
  if (!selectedPart) return members
  return members.filter(m => getParts(m).includes(selectedPart))
}

export default function MemberSearchModal({ onSelect, onClose, disabledMemberIds = [], defaultPart = '', castFullMemberIds = null }) {
  const [search, setSearch] = useState('')
  const [partFilter, setPartFilter] = useState('')
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
  if (search) filtered = filtered.filter(m => m.full_name && m.full_name.includes(search))
  if (partFilter) filtered = filterByPart(filtered, partFilter)
  if (gradeFilter) filtered = filtered.filter(m => String(m.grade) === gradeFilter)
  if (genderFilter) filtered = filtered.filter(m => m.gender === genderFilter)

  // defaultPartがある場合、一致するメンバーを上に、それ以外を下に分ける
  const priorityMembers = defaultPart && !partFilter
    ? filterByPart(filtered, defaultPart)
    : filtered
  const otherMembers = defaultPart && !partFilter
    ? filtered.filter(m => !filterByPart([m], defaultPart).length)
    : []

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
          {!loading && priorityMembers.length === 0 && otherMembers.length === 0 && (
            <div style={s.empty}>該当するメンバーがいません</div>
          )}
          {!loading && [...priorityMembers, ...otherMembers].length > 0 && (() => {
            const renderItem = (m, dimmed = false) => {
              const isDisabled = disabledMemberIds.includes(m.member_id)
              const isCastFull = castFullMemberIds != null && castFullMemberIds.has(m.member_id)
              return (
                <div
                  key={m.member_id}
                  style={{
                    ...s.memberItem,
                    ...(isDisabled ? s.disabled : {}),
                    opacity: dimmed ? 0.5 : (isCastFull ? 0.6 : 1),
                  }}
                  onClick={() => {
                    if (isDisabled) return
                    if (isCastFull) {
                      alert(`${m.full_name} はこのライブの出演企画数が上限に達しているため選択できません`)
                      return
                    }
                    onSelect(m)
                  }}
                >
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.full_name} style={s.avatar} />
                    : <div style={s.avatar}>👤</div>
                  }
                  <div style={s.info}>
                    <div style={s.name}>{m.full_name}</div>
                    <div style={s.sub}>
                      {[
                        m.main_part ? m.main_part.split(',').filter(Boolean).join('/') : null,
                        m.grade ? `${m.grade}年` : null,
                        m.gender,
                      ].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                  {isDisabled && <span style={{ fontSize: 12, color: '#999' }}>選択済</span>}
                  {isCastFull && (
                    <span style={{
                      fontSize: 11, color: '#dc2626', fontWeight: 700,
                      background: '#fee2e2', padding: '2px 7px', borderRadius: 6,
                    }}>上限</span>
                  )}
                </div>
              )
            }
            return (
              <>
                {priorityMembers.map(m => renderItem(m, false))}
                {otherMembers.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f8fafc', letterSpacing: 0.5 }}>
                      その他のメンバー
                    </div>
                    {otherMembers.map(m => renderItem(m, true))}
                  </>
                )}
              </>
            )
          })()}
        </div>
        <div style={s.clearRow}>
          <button style={s.clearBtn} onClick={() => onSelect(null)}>空欄にする</button>
        </div>
      </div>
    </div>
  )
}
