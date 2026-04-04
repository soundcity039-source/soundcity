import { useState, useRef } from 'react'
import { uploadPhoto } from '../api.js'
import { useApp } from '../context/AppContext.jsx'

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  preview: {
    width: 100, height: 100, borderRadius: '50%',
    objectFit: 'cover', border: '3px solid #eee', cursor: 'pointer',
  },
  placeholder: {
    width: 100, height: 100, borderRadius: '50%',
    background: '#f0f0f0', border: '3px dashed #ddd',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, cursor: 'pointer',
  },
  label: { fontSize: 13, color: '#06C755', cursor: 'pointer', textDecoration: 'underline' },
  input: { display: 'none' },
  uploading: { fontSize: 13, color: '#888' },
}

export default function PhotoUpload({ currentUrl, onUpload }) {
  const { currentUser } = useApp()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || null)
  const inputRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = ev => res(ev.target.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const result = await uploadPhoto({
        member_id: currentUser?.member_id,
        file_name: file.name,
        mime_type: file.type,
        base64_data: base64,
      })
      if (result.photo_url) {
        setPreview(result.photo_url)
        onUpload(result.photo_url)
      }
    } catch (e) {
      console.error('Upload failed:', e)
      alert('写真のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={s.container}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={s.input}
        onChange={handleFileChange}
      />
      <div onClick={() => inputRef.current.click()}>
        {preview
          ? <img src={preview} alt="プロフィール写真" style={s.preview} />
          : <div style={s.placeholder}>📷</div>
        }
      </div>
      {uploading
        ? <span style={s.uploading}>アップロード中...</span>
        : <span style={s.label} onClick={() => inputRef.current.click()}>
            {preview ? '写真を変更' : '写真を追加'}
          </span>
      }
    </div>
  )
}
