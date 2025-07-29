'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { materialsUrl, saveMaterialUrl, unsaveMaterialUrl, materialBoxUrl } from '@/routes'

interface Material {
  id: number
  uploader_id: string
  title: string
  description: string
  category: string
  url: string
  created_at: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [urlStr, setUrlStr] = useState('')
  const [savedIds, setSavedIds] = useState<number[]>([])
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const load = async () => {
    const res = await axios.get(materialsUrl)
    setMaterials(res.data.materials || [])
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!uid) return
    axios.get(materialBoxUrl(uid)).then((res) => {
      setSavedIds(res.data.materials?.map((m: Material) => m.id) || [])
    })
  }, [uid])

  const submit = async () => {
    if (!uid || !title || !urlStr) return
    await axios.post(materialsUrl, {
      uploader_id: uid,
      title,
      description,
      category,
      url: urlStr,
    })
    setTitle('')
    setDescription('')
    setCategory('')
    setUrlStr('')
    load()
  }

  const toggleSave = async (id: number) => {
    if (!uid) return
    if (savedIds.includes(id)) {
      await axios.post(unsaveMaterialUrl(id), { user_id: uid })
      setSavedIds(savedIds.filter((x) => x !== id))
    } else {
      await axios.post(saveMaterialUrl(id), { user_id: uid })
      setSavedIds([...savedIds, id])
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">素材マーケット</h1>
      <div className="space-y-2 border rounded-lg bg-white p-3 shadow">
        <input
          className="border rounded p-1 w-full"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border rounded p-1 w-full"
          rows={2}
          placeholder="説明"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="border rounded p-1 w-full"
          placeholder="カテゴリ"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="border rounded p-1 w-full"
          placeholder="URL"
          value={urlStr}
          onChange={(e) => setUrlStr(e.target.value)}
        />
        <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 transition" onClick={submit}>
          投稿
        </button>
      </div>
      <div className="space-y-4">
        {materials.map((m) => (
          <div key={m.id} className="border rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">{m.uploader_id}</div>
            <h2 className="font-semibold">{m.title}</h2>
            <p className="whitespace-pre-wrap">{m.description}</p>
            {m.category && <div className="text-xs text-pink-600 mb-1">[{m.category}]</div>}
            <a href={m.url} className="text-pink-500 underline" target="_blank" rel="noopener noreferrer">
              リンク
            </a>
            {uid && (
              <button
                className="ml-2 text-xs underline text-pink-500"
                onClick={() => toggleSave(m.id)}
              >
                {savedIds.includes(m.id) ? '保存済み' : 'ボックスへ'}
              </button>
            )}
          </div>
        ))}
        {materials.length === 0 && <p>素材はありません。</p>}
      </div>
    </div>
  )
}
