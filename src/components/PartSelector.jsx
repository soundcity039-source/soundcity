import { useState } from 'react'
import MemberSearchModal from './MemberSearchModal.jsx'

const s = {
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 0', borderBottom: '1px solid #f0f0f0',
  },
  partLabel: {
    minWidth: 72, fontWeight: 600, fontSize: 14, color: '#333',
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

export default function PartSelector({ part, member, onMemberChange, onRemove, disabledMemberIds }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div style={s.row}>
        <span style={s.partLabel}>{part}</span>
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
          onSelect={m => { onMemberChange(m); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
