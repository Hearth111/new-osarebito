'use client'
import React from 'react'

interface Props {
  author: string
  category?: string | null
  content: string
  image?: string | null
  createdAt: string
  actions?: React.ReactNode
  children?: React.ReactNode
  compact?: boolean
}

export default function PostCard({
  author,
  category,
  content,
  image,
  createdAt,
  actions,
  children,
  compact = false,
}: Props) {
  return (
    <div className={`rounded-lg bg-white shadow ${compact ? 'p-2 text-sm' : 'p-4'}`}>
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>{author}</div>
      {category && !compact && (
        <div className="text-xs text-pink-600 mb-1">[{category}]</div>
      )}
      <p>{content}</p>
      {image && !compact && (
        <img src={image} alt="post image" className="max-h-60 mt-2" />
      )}
      {children}
      {actions && (
        <div className="mt-2 flex gap-4 text-sm items-center">{actions}</div>
      )}
      <div className="text-right text-xs text-gray-500 mt-1">
        {new Date(createdAt).toLocaleString()}
      </div>
    </div>
  )
}
