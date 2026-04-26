import { useState } from 'react'
import MemberSearchModal from './MemberSearchModal.jsx'

const VO_OPTIONS = ['Vo', 'Vo/Gt', 'Vo/Ba', 'Vo/Key', 'Vo/Dr']

const s = {
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 0', borderBottom: '1px solid #f0f0f0',
  },
  partLabel: {
    minWidth: 72, fontWeight: 600, fontSize: 14, color: '#333',
  },
  partSelect: {
    minWidth: 80, fontWeight: 600, fontSize: 13,
    border: '1.5px solid var(--border)', borderRadius: 8,
    padding: '5px 4px', background: 'var(--input-bg)', color: 'var(--text)',
    cursor: 'pointer', outline: 'none', flexShrink: 0,
  },
  memberBtn: {
    flex: 1, padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: 8, background: '#fafafa', cursor: 'pointer',
    textAlign: 'left', fontSize: 14, color: '#333',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
  },
  placeholder: { color: '#aaa' },
  removeBtn: {
    background: 'none', border: 'none', fontSize: 20,
    cursor: 'pointer', color: '#e53e3e', padding: '0 4px',
    lineHeight: 1,
  },
}

export default function PartSelector({ part, member, onMemberChange, onRemove, disabledMemberIds, onPartChange, castFullMemberIds }) {
  const [showModal, setShowModal] = useState(false)
  const isVo = part === 'Vo' || part.startsWith('Vo/')

  return (
    <>
      <div style={s.row}>
        {isVo && onPartChange ? (
          <select
            style={s.partSelect}
            value={part}
            onChange={e => onPartChange(e.target.value)}
          >
            {VO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <span style={s.partLabel}>{part}</span>
        )}
        <button style={s.memberBtn} onClick={() => setShowModal(true)}>
          {member
            ? <>
                {member.photo_url
                  ? <img src={member.photo_url} alt={member.full_name} style={s.avatar} />
                  : <span>👤</span>
                }
                <span>{member.full_name}</span>
              </>
            : <span style={s.placeholder}>メンバーを選択...</span>
          }
        </button>
        <button style={s.removeBtn} onClick={onRemove} title="パートを削除">－</button>
      </div>
      {showModal && (
        <MemberSearchModal
          defaultPart={part}
          disabledMemberIds={disabledMemberIds}
          castFullMemberIds={castFullMemberIds}
          onSelect={m => { onMemberChange(m); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
