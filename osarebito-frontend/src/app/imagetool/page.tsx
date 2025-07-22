'use client'
import { useState } from 'react'
import Image from 'next/image'

function clamp(v: number) {
  return Math.max(0, Math.min(255, v))
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function compressImage(file: File, ai: boolean): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('file read'))
    reader.readAsDataURL(file)
  })
reader.readAsDataURL(file)
　})
　const img = new Image() as HTMLImageElement; // ★ ここを修正
　img.src = dataUrl
　await new Promise((res) => {
　img.onload = () => res(null)
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  if (ai) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp(d[i] + rand(-5, 5))
      d[i + 1] = clamp(d[i + 1] + rand(-5, 5))
      d[i + 2] = clamp(d[i + 2] + rand(-5, 5))
    }
    for (let i = 0; i < d.length; i += 40) {
      const noise = rand(0, 255)
      d[i] = noise
      d[i + 1] = noise
      d[i + 2] = noise
    }
    ctx.putImageData(imageData, 0, 0)
  }

  let quality = 0.92
  let blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality)
  )
  while (blob.size > 2 * 1024 * 1024 && quality > 0.3) {
    quality -= 0.05
    blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality)
    )
  }
  return blob
}

export default function ImageTool() {
  const [file, setFile] = useState<File | null>(null)
  const [aiOption, setAiOption] = useState(false)
  const [resultUrl, setResultUrl] = useState('')

  const handleProcess = async () => {
    if (!file) return
    const blob = await compressImage(file, aiOption)
    setResultUrl(URL.createObjectURL(blob))
  }

  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">画像圧縮&amp;AI対策</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={aiOption}
          onChange={(e) => setAiOption(e.target.checked)}
        />
        AI対策
      </label>
      <button
        className="bg-blue-500 text-white py-2 px-4"
        onClick={handleProcess}
        disabled={!file}
      >
        変換
      </button>
      {resultUrl && (
        <div className="flex flex-col gap-2">
          <Image
            src={resultUrl}
            alt="result"
            width={500}
            height={500}
            className="max-w-full h-auto"
          />
          <a
            href={resultUrl}
            download="processed.jpg"
            className="text-blue-500 underline"
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}
