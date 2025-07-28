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
  // Read the file as a Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('file read'))
    reader.readAsDataURL(file)
  })

  // Create an Image element using document.createElement
  // This approach is often more robust against strict TypeScript configurations
  // when dealing with global constructors like Image.
  const img = document.createElement('img');
  img.src = dataUrl
  await new Promise((res) => {
    img.onload = () => res(null)
  })

  // Create a canvas and draw the image onto it
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')! // Get the 2D rendering context

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0)

  // Apply AI "protection" (noise) if the option is enabled
  if (ai) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data // Pixel data array (RGBA)

    // Apply slight random variations to RGB channels
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp(d[i] + rand(-5, 5)) // Red channel
      d[i + 1] = clamp(d[i + 1] + rand(-5, 5)) // Green channel
      d[i + 2] = clamp(d[i + 2] + rand(-5, 5)) // Blue channel
    }

    // Add semi-transparent noise dots at wider intervals
    const dotSpacing = 5 // pixels between noise dots
    const opacity = 0.05 // noise opacity (lower for higher transparency)

    for (let y = 0; y < canvas.height; y += dotSpacing) {
      for (let x = 0; x < canvas.width; x += dotSpacing) {
        const idx = (y * canvas.width + x) * 4
        const noise = rand(0, 255)
        d[idx] = clamp(d[idx] * (1 - opacity) + noise * opacity)
        d[idx + 1] = clamp(d[idx + 1] * (1 - opacity) + noise * opacity)
        d[idx + 2] = clamp(d[idx + 2] * (1 - opacity) + noise * opacity)
      }
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(imageData, 0, 0)
  }

  // Compress the image to JPEG format, reducing quality if needed to meet size limit
  let quality = 0.92 // Initial JPEG quality
  let blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality)
  )
  // Loop to reduce quality until blob size is under 2MB or quality drops too low
  while (blob.size > 2 * 1024 * 1024 && quality > 0.3) {
    quality -= 0.05 // Decrease quality by 5%
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

  // Handler for processing the image
  const handleProcess = async () => {
    if (!file) return // Do nothing if no file is selected
    const blob = await compressImage(file, aiOption) // Call the compression function
    setResultUrl(URL.createObjectURL(blob)) // Set the URL for the processed image
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
        className="bg-pink-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-pink-600 transition-colors duration-200"
        onClick={handleProcess}
        disabled={!file}
      >
        変換
      </button>
      {resultUrl && (
        <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold">結果</h2>
          <Image
            src={resultUrl}
            alt="result"
            width={500}
            height={500}
            className="max-w-full h-auto rounded-md shadow-sm"
          />
          <a
            href={resultUrl}
            download="processed.jpg"
            className="text-pink-500 underline text-center hover:text-pink-700 transition-colors duration-200"
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}
