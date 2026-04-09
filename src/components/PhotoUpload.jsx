import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

function resizeImage(file, maxSize = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize }
          else { width = Math.round((width * maxSize) / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  avatar: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', background: '#eee' },
  placeholder: {
    width: 80, height: 80, borderRadius: '50%', background: '#e6f9ed',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
  },
  btn: {
    padding: '6px 16px', background: '#06C755', color: '#fff',
    border: 'none', borderRadius: 20, fontSize: 13, cursor: 'pointer',
  },
}

export default function PhotoUpload({ currentUrl, onUpload, memberId }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const blob = await resizeImage(file, 400)
      const path = `${memberId || 'tmp'}_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/jpeg', upsert: true,
      })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      onUpload(publicUrl)
    } catch (err) {
      alert('写真のアップロードに失敗しました')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={s.wrap}>
      {currentUrl
        ? <img src={currentUrl} alt="" style={s.avatar} />
        : <div style={s.placeholder}>🎵</div>
      }
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <button style={s.btn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? 'アップロード中...' : '写真を選択'}
      </button>
    </div>
  )
}
